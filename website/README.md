# Autohost Chatbot

Web interface for the Vector Search API using Next.js and React.

## Getting Started

Install dependencies:

```bash
npm install
```

Create a `.env.development` file in the root directory and add the following:

```bash
LLM_ENDPOINT_URL=http://localhost:3001/dev/chat
NEXT_PUBLIC_LLM_ENDPOINT_URL=/api/chat
LLM_API_KEY=<change me (will be generated when you deploy)>
# You can enable basic auth by uncommenting the following line and changing the username and password
# HTTP_BASIC_AUTH=human:supersecret
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deploying

You can easily deploy this to [Vercel](https://vercel.com/) by following steps:

1. Clone this repository
2. Create a new project on Vercel
3. Connect your repository to the project
4. Add the following environment variables to the project:
   
   - `NEXT_PUBLIC_LLM_ENDPOINT_URL` - The URL of the Vercel serverless function (should be `/api/chat`)
   - `LLM_ENDPOINT_URL` - The URL of the API Gateway Lambda function (e.g. `https://my-lambda-function.execute-api.us-east-1.amazonaws.com/dev/chat`)
   - `LLM_API_KEY` - The API key for the Lambda function if you enabled API authentication
   - `HTTP_BASIC_AUTH` - (Optional) The username and password for HTTP basic auth (e.g. `human:supersecret`)
5. Change the root directory to `website`
6. Deploy!
7. (Optional) Add a custom domain

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.