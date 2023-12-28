import {
    updateVectorStore,
    queryVectorStoreAndQueryLLM,
    queryVectorStore,
    resetVectorStore,
    getNamespaceFromEvent,
} from './lib/knowledge';
import {queryVectorStoreAndChatLLM} from './lib/chat';

/*

Handler for the document upload API

 */
export const documentUpload = async (event) => {
    event.body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const {files} = event.body || {};
    const namespace = getNamespaceFromEvent(event);

    // Format the documents similar to langchain document loader
    const docs = (files || []).map(({path, content}) => {
        return {
            metadata: {
                url: path,
            },
            pageContent: content,
        };
    });

    // Update vector store with the new documents
    try {
        const chunks = await updateVectorStore(docs, namespace);
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Upload successful',
                chunks: parseInt(`${chunks}`) || 0,
            }),
        };
    } catch (error) {
        console.error('Error updating vector store', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error updating vector store',
                error: error.message || error,
            }),
        };
    }
};

/*

Handler for the document search API

 */
export const questionAnswer = async (event) => {
    event.body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const {question} = event.body || {};
    const namespace = getNamespaceFromEvent(event);
    try {
        const results = await queryVectorStoreAndQueryLLM(question, namespace);
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Query successful',
                question: question,
                answer: results.answer,
                references: results.references,
            }),
        };
    } catch (error) {
        console.error('Error querying vector store', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error querying vector store',
                error: error.message || error,
            }),
        };
    }
};

/*

Handler for the document chat API

 */
export const chat = async (event) => {
    event.body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const {messages, systemPrompt, model} = event.body || {};
    const namespace = getNamespaceFromEvent(event);
    try {
        const response = await queryVectorStoreAndChatLLM({
            messages,
            systemPrompt,
            model,
            namespace,
        });
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Query successful',
                text: response.result,
                references: response.references,
                messages: response.messages,
            }),
        };
    } catch (error) {
        console.error('Error querying vector store', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error querying vector store',
                error: error.message || error,
            }),
        };
    }
};

/*

Handler for the document search API

 */
export const search = async (event) => {
    event.body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const {query} = event.body || {};
    const namespace = getNamespaceFromEvent(event);
    try {
        const results = await queryVectorStore(query, namespace);
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Query successful',
                data: results,
            }),
        };
    } catch (error) {
        console.error('Error querying vector store', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error querying vector store',
                error: error.message || error,
            }),
        };
    }
};

/*

Handler for resetting the vector store

 */
export const reset = async (event) => {
    try {
        await resetVectorStore();
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Reset successful',
            }),
        };
    } catch (error) {
        console.error('Error resetting vector store', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error resetting vector store',
                error: error.message || error,
            }),
        };
    }
};