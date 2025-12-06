import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const clusterEmbeddingsFunctionName = process.env.CLUSTER_EMBEDDINGS_FUNCTION_NAME!;
const lambda = new LambdaClient({});

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': 'true',
};

export const handler: APIGatewayProxyHandlerV2 = async () => {
  try {
    console.log(`Invoking cluster-embeddings Lambda: ${clusterEmbeddingsFunctionName}`);

    // Invoke the cluster-embeddings Lambda function asynchronously
    const invokeCommand = new InvokeCommand({
      FunctionName: clusterEmbeddingsFunctionName,
      InvocationType: 'Event', // Asynchronous invocation
    });

    const response = await lambda.send(invokeCommand);

    console.log(`Cluster-embeddings Lambda invoked successfully. StatusCode: ${response.StatusCode}`);

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        message: 'Batch clustering job triggered successfully',
        statusCode: response.StatusCode,
      }),
    };
  } catch (error) {
    console.error('Error invoking cluster-embeddings Lambda:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: 'Failed to trigger clustering job',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

