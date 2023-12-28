# Vector Search

API for storing documents on a vector database and searching for similar documents.

## Setup

Install dependencies:

```bash
npm install
```

Create a config file for your environment and fill in the values:

```bash
cp configs/example-dev.yml configs/dev.yml
```

## Deployment

Deploy using Serverless API:

```bash
npx sls deploy --verbose --stage dev
```

> An API key will be generated and printed on the console.


You can optionally also deploy the web interface using Vercel. See the [website/README.md](website/README.md) file for more details.


## Testing

Start the local server using `serverless-offline`:

```bash
npx sls offline --stage dev
```

> An API key will be generated and printed on the console.

## Usage

API endpoints:

- `POST /documents` - Stores documents on the database
- `POST /qa` - One-shot question answering
- `POST /chat` - Conversational question answering
- `POST /search` - Returns raw vector search results for a given query

### POST /documents

Stores a document on the vector database for later retrieval.

#### Request

##### Body Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| `files` | `Array` | List of files |
| `files.path` | `String` | File path |
| `files.content` | `String` | File content |
| `topic` | `String` | Topic name (optional) |

```bash
curl --location --request POST 'http://localhost:3000/dev/train' \
--header 'Content-Type: application/json' \
--header 'x-api-key: API_KEY' \
--data-raw '{
    "files": [
      { "path": "file_path_1", "content": "..." },
      { "path": "file_path_2", "content": "..." },
    ]
}'
```

#### Response

Success:

```json
{
  "message": "Documents uploaded successfully",
  "chunks": 355
}
```

Error:

```json
{
  "message": "Error message",
  "error": "Error details"
}
```

### POST /qa

One-shot question answering with LLM assistance.

#### Request

##### Body Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| `question` | `String` | Question |
| `topic` | `String` | Topic name (optional) |

```bash
curl --location --request POST 'http://localhost:3000/dev/qa' \
--header 'Content-Type: application/json' \
--header 'x-api-key: API_KEY' \
--data-raw '{
    "question": "Can you use Docusaurus with ChatGPT?",
    "topic": "topic_name",
}' | jq '{answer, references}'
```

#### Response

```json
{
  "answer": "Completion response",
  "references": [
    "string",
    "string"
  ]
}
```

### POST /chat

Conversational question answering with LLM assistance.

#### Request

##### Body Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| `messages` | `Array` | List of messages |
| `messages.role` | `String` | Message role (`user` or `assistant`) |
| `messages.content` | `String` | Message content |
| `model` | `String` | OpenAI model name (optional) |
| `systemPrompt` | `String` | Custom system prompt that wraps prompt and context (optional) |
| `topic` | `String` | Topic name (optional) |

###### Supported models

- `gpt-4`
- `gpt-4-1106-preview`
- `gpt-3.5-turbo`
- `gpt-3.5-turbo-1106`
- `gpt-3.5-turbo-16k`

```bash
curl --location --request POST 'http://localhost:3000/dev/chat' \
--header 'Content-Type: application/json' \
--header 'x-api-key: API_KEY' \
--data-raw '{
    "messages": [
      {
        "role": "user",
        "content": "When was Autohost founded?"
      },
      {
        "role": "assistant",
        "content": "Autohost was founded in 2019"
      },
      {
        "role": "user",
        "content": "How can I use the Autohost API?"
      }
    ],
    "model": "gpt-4-1106-preview",
    "systemPrompt": "You are a pirate from Hook Enterprises who loves to help people and crack jokes! You answer in pirate language, and end with a pirate joke."
}' | jq '{text, references}'

```

#### Response

```json
{
  "text": "Completion response",
  "messages": [
    {
      "role": "string",
      "content": "string"
    }
  ],
  "references": [
    "string",
    "string"
  ]
}
```

### POST /search

Similarity search for a given query. Returns raw vector search results.

#### Request

##### Body Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| `query` | `String` | Query |
| `topic` | `String` | Topic name (optional) |

```bash
curl --location --request POST 'http://localhost:3000/dev/search' \
--header 'Content-Type: application/json' \
--header 'x-api-key: API_KEY' \
--data-raw '{
    "query": "What is Docusaurus?"
}'
```

#### Response

```json
{
  "data": [
    {
      "id": "file_path_1",
      "score": 0.9999999999999999
    },
    {
      "id": "file_path_2",
      "score": 0.9999999999999999
    }
  ]
}
```

## Indexing Autohost Documentation

### Knowledge Base from HubSpot

1. Go to HubSpot Knowledge Base and click More Tools > Export in the left sidebar
2. Select the following options:
    - Export format: CSV
    - Export type: All articles
    - Export options: Include article body
3. Click Export
4. Unzip the downloaded file, move it to the `scripts` directory and rename it to `hubspot.csv`
5. Edit `FILE_NAME` and execute the script to convert the CSV export to Markdown files:
   ```bash
   # Replace `FILE_NAME = "/path/to/csv";` with the name of the downloaded file
   sed -i 's/FILE_NAME = ".*";/FILE_NAME = "hubspot.csv";/g' scripts/export-hubspot-docs.js
   node scripts/export-hubspot-docs.js
   ```
6. Execute the following command to upload the documents to the vector database:
   ```bash
   node scripts/upload-docs.js
   ```
7. Done! You can now search for Autohost documentation using the `/search` endpoint

### API Documentation

1. Go to your Docusaurus project repository and clone it
2. Copy the `docs/` directory to the `documents/docs/` directory
   ```bash
   mkdir -p documents/api
   cp -r /path/to/docusaurus/docs documents/docs
   ```
3. Execute the following command to upload the documents to the vector database:
   ```bash
   node scripts/upload-docs.js
   ```
4. Done! You can now search for API documentation using the `/search` endpoint

### Slack Messages

1. Go to your Slack workspace and export the workspace data (must be an admin)
2. Unzip the downloaded file, move it to the `documents/slack` directory
3. Delete channels you don't want to index from the `documents/slack` directory
4. Edit the `scripts/upload-slack.js` file and change the workspace URL `'https://xxxx.slack.com'` to your own
5. Execute the following command to upload the documents to the vector database:
   ```bash
   node scripts/upload-slack.js
   ```

### Notion

1. Go to your Notion workspace and export the workspace data (must be an admin)
2. Unzip the downloaded file, move it to the `documents/notion` directory
3. Edit the `scripts/upload-notion.js` file and change the workspace ID `NOTION_WORKSPACE_ID` to your own
4. Execute the following command to upload the documents to the vector database:
   ```bash
   node scripts/upload-notion.js
   ```

## Multi-Tenant Support

You can enable multi-tenant support by following these steps:

1. Edit your `configs/dev.yml` file and add the following:
   ```yaml
   MULTI_TENANT: true
   ```
2. Edit the `serverless.yml` file and add new API keys:
   ```yaml
   provider:
     apiGateway:
      apiKeys:
        - ${self:custom.apiKey}-tenant1
        - ${self:custom.apiKey}-tenant2
   ```
3. Make sure all the functions have `private: true` in the `serverless.yml` file
4. Deploy the API
   ```bash
   npx sls deploy --verbose --stage dev
   ```
5. Done! Each API key will have its own documents using namespacing


## References

- https://github.com/pinecone-io/langchain-retrieval-agent-example/tree/main
- https://js.langchain.com/docs/expression_language/cookbook/retrieval
- https://js.langchain.com/docs/modules/data_connection/retrievers/how_to/vectorstore
- https://github.com/supabase/supabase/blob/master/apps/docs/scripts/search/generate-embeddings.ts
- https://github.com/dabit3/semantic-search-nextjs-pinecone-langchain-chatgpt/tree/main