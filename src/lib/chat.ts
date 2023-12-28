import {OpenAI} from 'langchain/llms/openai';
import {PromptTemplate} from 'langchain/prompts';
import {StringOutputParser} from 'langchain/schema/output_parser';
import {
    RunnableSequence,
    RunnablePassthrough,
} from 'langchain/schema/runnable';
import {getPageContent} from './store';
import {getPineconeVectorStore} from './store-pinecone';

type ChatMessage = {
    role: 'user' | 'assistant';
    content: string;
}

type ConversationalRetrievalQAChainInput = {
    messages: ChatMessage[];
};

type QueryChatInputType = {
    messages: ChatMessage[];
    systemPrompt?: string;
    model?: 'gpt-4' | 'gpt-4-1106-preview' | 'gpt-3.5-turbo' | 'gpt-3.5-turbo-1106' | 'gpt-3.5-turbo-16k';
    namespace?: string;
};

const formatChatHistory = (messages: ChatMessage[]): string => {
    return messages.map((message: ChatMessage) => {
        return `${message.role}: ${message.content}`;
    }).join('\n');
};

export const queryVectorStoreAndChatLLM = async (Props: QueryChatInputType) => {
    const {
        messages,
        systemPrompt,
        model,
        namespace,
    } = Props || {};

    // Retrieve the Pinecone VectorStore
    const vectorStore = await getPineconeVectorStore({namespace});

    // Retrieve the LLM
    const llm = new OpenAI({modelName: model || 'gpt-3.5-turbo-1106'});

    // Create retriever
    const retriever = vectorStore.asRetriever();

    // Create the question prompt
    const condenseQuestionTemplate = [
        'Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question, in its original language.',
        '',
        'Chat History:',
        '{chat_history}',
        '',
        'Follow Up Input: {question}',
        'Standalone question:',
    ].filter(l => !!l).join('\n');
    const CONDENSE_QUESTION_PROMPT = PromptTemplate.fromTemplate(condenseQuestionTemplate);

    // Create the answer prompt
    const answerTemplate = [
        systemPrompt || null,
        'Answer the question based only on the following context:',
        '{context}',
        '',
        'Question: {question}',
        '',
    ].filter(l => !!l).join('\n');
    const ANSWER_PROMPT = PromptTemplate.fromTemplate(answerTemplate);

    // Create the QA chain
    const standaloneQuestionChain = RunnableSequence.from([
        {
            question: (input: ConversationalRetrievalQAChainInput) => input.messages[input.messages.length - 1].content,
            chat_history: (input: ConversationalRetrievalQAChainInput) => formatChatHistory(input.messages.slice(0, input.messages.length - 1)),
        },
        CONDENSE_QUESTION_PROMPT,
        llm,
        new StringOutputParser(),
    ]);

    const references = new Set<string>();

    // Create the answer chain
    const answerChain = RunnableSequence.from([
        {
            context: retriever.pipe(docs => {
                return docs.map(doc => {
                    if (doc?.metadata) {
                        if (doc.metadata.txtPath) {
                            references.add(doc.metadata.txtPath);
                        } else if (doc.metadata.url) {
                            references.add(doc.metadata.url);
                        } else if (doc.metadata.source) {
                            references.add(doc.metadata.source);
                        } else {
                            console.warn('No reference found for document', doc);
                        }
                    }
                    return getPageContent(doc);
                }).join('\n');
            }),
            question: new RunnablePassthrough(),
        },
        ANSWER_PROMPT,
        llm,
    ]);

    // Create the conversational retrieval QA chain
    const conversationalRetrievalQAChain = standaloneQuestionChain.pipe(answerChain);

    // Invoke the conversational retrieval QA chain
    const result = await conversationalRetrievalQAChain.invoke({
        messages: messages
    });

    // Append the answer to the messages
    messages.push({
        role: 'assistant',
        content: (result || '').trim(),
    });

    // Return the messages and the result
    return {
        messages: messages,
        result: (result || '').trim(),
        references: Array.from(references),
    }
};

export default queryVectorStoreAndChatLLM;