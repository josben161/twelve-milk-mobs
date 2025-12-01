import type { CloudFormationCustomResourceEvent, Context } from 'aws-lambda';
import { fromEnv } from '@aws-sdk/credential-providers';
import { SignatureV4 } from '@aws-sdk/signature-v4';
import { HttpRequest } from '@aws-sdk/protocol-http';
import { Sha256 } from '@aws-crypto/sha256-js';
import * as https from 'https';

const opensearchEndpoint = process.env.OPENSEARCH_ENDPOINT!;
const opensearchIndexName = process.env.OPENSEARCH_INDEX_NAME || 'videos';
const region = process.env.AWS_REGION || 'us-east-1';

/**
 * Create OpenSearch index with k-NN mapping
 */
async function createIndex(): Promise<void> {
  const indexUrl = new URL(`https://${opensearchEndpoint}/${opensearchIndexName}`);
  
  // Check if index already exists
  const checkRequest = new HttpRequest({
    hostname: indexUrl.hostname,
    path: indexUrl.pathname,
    method: 'HEAD',
    headers: {
      'Host': indexUrl.host,
    },
  });

  const signer = new SignatureV4({
    credentials: fromEnv(),
    service: 'es',
    region,
    sha256: Sha256,
  });

  const signedCheckRequest = await signer.sign(checkRequest);
  const checkResponse = await fetch(indexUrl.toString(), {
    method: signedCheckRequest.method,
    headers: signedCheckRequest.headers as HeadersInit,
  });

  // If index exists, return
  if (checkResponse.ok) {
    console.log(`OpenSearch index ${opensearchIndexName} already exists`);
    return;
  }

  // Create index with k-NN mapping
  const mapping = {
    mappings: {
      properties: {
        videoId: { type: 'keyword' },
        embedding: {
          type: 'knn_vector',
          dimension: 256, // Marengo embedding dimension
          method: {
            name: 'hnsw',
            space_type: 'cosinesimil',
            engine: 'nmslib',
          },
        },
        userHandle: { type: 'keyword' },
        hashtags: { type: 'keyword' },
        createdAt: { type: 'date' },
        mobId: { type: 'keyword' },
      },
    },
  };

  const createRequest = new HttpRequest({
    hostname: indexUrl.hostname,
    path: indexUrl.pathname,
    method: 'PUT',
    headers: {
      'Host': indexUrl.host,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(JSON.stringify(mapping)).toString(),
    },
    body: JSON.stringify(mapping),
  });

  const signedCreateRequest = await signer.sign(createRequest);
  const createResponse = await fetch(indexUrl.toString(), {
    method: signedCreateRequest.method,
    headers: signedCreateRequest.headers as HeadersInit,
    body: signedCreateRequest.body as string,
  });

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    throw new Error(`Failed to create OpenSearch index: ${createResponse.status} ${errorText}`);
  }

  console.log(`Successfully created OpenSearch index ${opensearchIndexName}`);
}

/**
 * Delete OpenSearch index
 */
async function deleteIndex(): Promise<void> {
  const indexUrl = new URL(`https://${opensearchEndpoint}/${opensearchIndexName}`);
  
  const deleteRequest = new HttpRequest({
    hostname: indexUrl.hostname,
    path: indexUrl.pathname,
    method: 'DELETE',
    headers: {
      'Host': indexUrl.host,
    },
  });

  const signer = new SignatureV4({
    credentials: fromEnv(),
    service: 'es',
    region,
    sha256: Sha256,
  });

  const signedDeleteRequest = await signer.sign(deleteRequest);
  const deleteResponse = await fetch(indexUrl.toString(), {
    method: signedDeleteRequest.method,
    headers: signedDeleteRequest.headers as HeadersInit,
  });

  if (!deleteResponse.ok && deleteResponse.status !== 404) {
    const errorText = await deleteResponse.text();
    throw new Error(`Failed to delete OpenSearch index: ${deleteResponse.status} ${errorText}`);
  }

  console.log(`Successfully deleted OpenSearch index ${opensearchIndexName}`);
}

export const handler = async (
  event: CloudFormationCustomResourceEvent,
  context: Context
): Promise<void> => {
  console.log('OpenSearch index custom resource event:', JSON.stringify(event, null, 2));

  const physicalResourceId = `opensearch-index-${opensearchIndexName}`;
  let status = 'SUCCESS';
  let reason = 'Index created successfully';
  const responseData: Record<string, any> = {};

  try {
    if (event.RequestType === 'Create' || event.RequestType === 'Update') {
      await createIndex();
    } else if (event.RequestType === 'Delete') {
      // Optionally delete index on stack deletion (or keep it for data retention)
      // await deleteIndex();
      console.log('Skipping index deletion on stack deletion');
    }

    // Send success response to CloudFormation
    await sendResponse(event.ResponseURL, {
      Status: status,
      Reason: reason,
      PhysicalResourceId: physicalResourceId,
      StackId: event.StackId,
      RequestId: event.RequestId,
      LogicalResourceId: event.LogicalResourceId,
      Data: responseData,
    });
  } catch (error) {
    console.error('Error in OpenSearch index custom resource:', error);
    status = 'FAILED';
    reason = error instanceof Error ? error.message : 'Unknown error';
    await sendResponse(event.ResponseURL, {
      Status: status,
      Reason: reason,
      PhysicalResourceId: physicalResourceId,
      StackId: event.StackId,
      RequestId: event.RequestId,
      LogicalResourceId: event.LogicalResourceId,
      Data: responseData,
    });
    throw error;
  }
};

/**
 * Send response to CloudFormation
 */
async function sendResponse(responseUrl: string, response: Record<string, any>): Promise<void> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(response);
    const url = new URL(responseUrl);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'PUT',
      headers: {
        'Content-Type': '',
        'Content-Length': Buffer.byteLength(body).toString(),
      },
    };

    const req = https.request(options, (res) => {
      res.on('data', () => {});
      res.on('end', () => {
        resolve();
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(body);
    req.end();
  });
}

