export const indexName = process.env.DB_NAME || 'my-test-pinecone-index';
export const timeout = 180000;

/*
Enable multi-tenancy by setting the following environment variable to true.
Multi-tenancy works by setting a unique namespace for user on the vector store using their API key ID.
 */
export const multiTenant = process.env.MULTI_TENANT === 'true';