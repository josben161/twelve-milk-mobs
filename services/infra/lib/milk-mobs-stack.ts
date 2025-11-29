import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as path from 'path';

export class MilkMobsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1) S3 bucket for raw uploads
    const uploadsBucket = new s3.Bucket(this, 'UploadsBucket', {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN, // keep data by default
      autoDeleteObjects: false,
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
            s3.HttpMethods.HEAD,
          ],
          allowedOrigins: ['*'], // Allow all origins for presigned URL uploads
          allowedHeaders: ['*'],
          exposedHeaders: [
            'ETag',
            'x-amz-server-side-encryption',
            'x-amz-request-id',
            'x-amz-id-2',
          ],
          maxAge: 3000,
        },
      ],
    });

    // 2) DynamoDB table for videos
    const videosTable = new dynamodb.Table(this, 'VideosTable', {
      partitionKey: { name: 'videoId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // 3) Lambda function to create upload (presigned URL + metadata)
    // Using NodejsFunction for automatic TypeScript bundling and dependency resolution
    const createUploadFn = new lambdaNodejs.NodejsFunction(this, 'CreateUploadFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, '../../lambdas/create-upload/index.ts'),
      environment: {
        UPLOADS_BUCKET_NAME: uploadsBucket.bucketName,
        VIDEOS_TABLE_NAME: videosTable.tableName,
      },
      timeout: cdk.Duration.seconds(10),
      // No bundling config needed - @twelve/core-types is type-only and will be erased at compile time
    });

    // Grant permissions
    uploadsBucket.grantPut(createUploadFn);
    videosTable.grantWriteData(createUploadFn);

    // 4) API Gateway REST API
    const api = new apigw.RestApi(this, 'MilkMobsApi', {
      restApiName: 'Milk Mobs API',
      deployOptions: {
        stageName: 'prod',
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: apigw.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key'],
      },
    });

    const videos = api.root.addResource('videos');
    const submit = videos.addResource('submit');
    submit.addMethod('POST', new apigw.LambdaIntegration(createUploadFn), {
      methodResponses: [{ statusCode: '200' }],
    });

    // 5) Outputs for frontends / debugging
    new cdk.CfnOutput(this, 'ApiBaseUrl', {
      value: api.url,
      description: 'Base URL for Milk Mobs API Gateway',
      exportName: 'MilkMobsApiBaseUrl',
    });

    new cdk.CfnOutput(this, 'UploadsBucketName', {
      value: uploadsBucket.bucketName,
      description: 'S3 bucket name for video uploads',
      exportName: 'MilkMobsUploadsBucketName',
    });

    new cdk.CfnOutput(this, 'VideosTableName', {
      value: videosTable.tableName,
      description: 'DynamoDB table name for video metadata',
      exportName: 'MilkMobsVideosTableName',
    });
  }
}
