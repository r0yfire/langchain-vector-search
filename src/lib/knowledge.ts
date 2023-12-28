import {RecursiveCharacterTextSplitter} from 'langchain/text_splitter';
import {OpenAI} from 'langchain/llms/openai';
import {VectorDBQAChain} from 'langchain/chains';
import {Document} from 'langchain/document';
import {getPineconeVectorStore, deleteAllDocuments} from './store-pinecone';
import {multiTenant} from '../../config';


export const getNamespaceFromEvent = (event: any): string => {
    event.body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const {namespace, topic} = event.body || {};
    const ns = topic || namespace || '';
    const identity = event?.requestContext?.identity || {};
    return multiTenant ? `${identity.apiKeyId}:${ns}` : ns;
};


export const queryVectorStore = async (question: string, namespace: string) => {
    console.log('Querying vector store...');

    // Get the Pinecone VectorStore
    const vectorStore = await getPineconeVectorStore({namespace});

    // Query the VectorStore
    const queryResponse = await vectorStore.similaritySearchWithScore(question, 10);
    console.log(`Found ${queryResponse.length} matches for question: '${question}'`);

    return queryResponse;
};

export const queryVectorStoreAndQueryLLM = async (question: string, namespace: string) => {

    // Get the Pinecone VectorStore
    const vectorStore = await getPineconeVectorStore({namespace});

    // Create an OpenAI instance
    const model = new OpenAI();

    // Create the chain
    const chain = VectorDBQAChain.fromLLM(model, vectorStore, {
        k: 1,
        returnSourceDocuments: true,
    });

    // Execute the chain with input documents and question
    const response = await chain.call({query: question});

    // Extract references
    const references = response.sourceDocuments
        .map((doc) => {
            return doc.metadata?.txtPath || doc.metadata?.url || doc.metadata?.source;
        })
        .filter((ref) => ref && ref !== '');

    // Return the response
    return {
        question,
        answer: response.text,
        references: references,
    }
};

export const updateVectorStore = async (documents: Document[], namespace: string): Promise<number> => {
    let counter = 0;

    // Get the Pinecone VectorStore
    const vectorStore = await getPineconeVectorStore({namespace});

    // Throw error if no documents
    if (!documents || documents.length === 0) {
        throw new Error('No documents provided');
    }

    // Throw error if there are more than 10 documents
    if (documents.length > 10) {
        throw new Error('Only 10 documents can be added at a time');
    }

    // Create a RecursiveCharacterTextSplitter
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 140,
    });

    // Iterate over documents and split page content into chunks
    for (const doc of documents) {

        // Split the page content into chunks
        const chunks = await splitter.createDocuments(
            [doc.pageContent],
        );

        // Increment counter
        counter += chunks.length;

        // Insert the chunks into the VectorStore
        try {
            await vectorStore.addDocuments(chunks.map((chunk) => ({
                ...chunk,
                metadata: {
                    ...doc.metadata,
                    ...chunk.metadata,
                },
            })));
        } catch (error) {
            console.error(`Error inserting to Vector Store a document ${doc.metadata?.txtPath || doc.metadata?.url || doc.metadata?.source}`, error);
        }
    }

    console.log(`Inserted ${counter} chunks into vector store`);

    // Return the number of chunks inserted
    return counter;
};

export const resetVectorStore = async (): Promise<void> => {
    console.warn('Resetting vector store...');
    // Delete all documents
    await deleteAllDocuments({});
}