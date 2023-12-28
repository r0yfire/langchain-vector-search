import {IndexStatsDescription, Pinecone} from '@pinecone-database/pinecone';
import {OpenAIEmbeddings} from 'langchain/embeddings/openai';
import {PineconeStore} from 'langchain/vectorstores/pinecone';
import {indexName, timeout} from '../../config';

export const VectorDimensions = 1536;

type GetPineconeClientProps = {
    indexNameString?: string;
    namespace?: string;
}

export const getPineconeClient = async () : Promise<Pinecone> => {
    return new Pinecone({
        apiKey: process.env.PINECONE_API_KEY || '',
        environment: process.env.PINECONE_ENVIRONMENT || ''
    })
}

export const getPineconeVectorStore = async (options: GetPineconeClientProps): Promise<PineconeStore> => {
    const {indexNameString, namespace} = options || {};

    // Create a new Pinecone client
    const pinecone = await getPineconeClient();

    // Select the index
    const pineconeIndex = pinecone.Index(
        typeof indexNameString === 'string' ? indexNameString : indexName,
    );

    // Return the VectorStore
    return await PineconeStore.fromExistingIndex(
        new OpenAIEmbeddings(),
        {
            pineconeIndex,
            maxConcurrency: 5,
            namespace: namespace || '',
        }
    );
}

export const deleteAllDocuments = async (options: GetPineconeClientProps) : Promise<IndexStatsDescription> => {
    const {indexNameString} = options || {};

    // Create a new Pinecone client
    const pinecone = await getPineconeClient();

    // Select the index
    const pineconeIndex = pinecone.Index(
        typeof indexNameString === 'string' ? indexNameString : indexName,
    );

    // Delete all documents
    await pineconeIndex.deleteAll();

    // Return index stats
    return await pineconeIndex.describeIndexStats();
}

export const createPineconeIndex = async (indexName, vectorDimension) => {
    // Initiate index existence check
    console.log(`Checking "${indexName}"...`);
    // Get list of existing indexes
    const client = await getPineconeClient();
    const existingIndexes = await client.listIndexes();
    // If index doesn't exist, create it
    if (!existingIndexes.includes(indexName)) {
        // Log index creation initiation
        console.log(`Creating "${indexName}"...`);
        // Create index
        await client.createIndex({
            name: indexName,
            dimension: vectorDimension || VectorDimensions,
            metric: 'cosine',
        });
        // Log successful creation
        console.log(`Creating index.... please wait for it to finish initializing.`);
        // Wait for index initialization
        await new Promise((resolve) => setTimeout(resolve, timeout));
    } else {
        // Log if index already exists
        console.log(`"${indexName}" already exists.`);
    }
};

export default getPineconeVectorStore;