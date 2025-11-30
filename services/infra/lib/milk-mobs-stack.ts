import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as sfnTasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as events from 'aws-cdk-lib/aws-events';
import * as eventTargets from 'aws-cdk-lib/aws-events-targets';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as cloudfrontOrigins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as opensearch from 'aws-cdk-lib/aws-opensearchservice';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
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

    // 1b) CloudFront distribution for video delivery
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OAI', {
      comment: 'OAI for Milk Mobs video bucket',
    });

    const distribution = new cloudfront.Distribution(this, 'VideoDistribution', {
      defaultBehavior: {
        origin: new cloudfrontOrigins.S3Origin(uploadsBucket, {
          originAccessIdentity,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true,
      },
      defaultRootObject: '',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 404,
          responsePagePath: '/404.html',
          ttl: cdk.Duration.seconds(300),
        },
      ],
      comment: 'CloudFront distribution for Milk Mobs video delivery',
    });

    // Grant CloudFront OAI read access to S3 bucket
    uploadsBucket.grantRead(originAccessIdentity);

    // 2) DynamoDB table for videos
    const videosTable = new dynamodb.Table(this, 'VideosTable', {
      partitionKey: { name: 'videoId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // 2b) DynamoDB table for mobs
    const mobsTable = new dynamodb.Table(this, 'MobsTable', {
      partitionKey: { name: 'mobId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // 2c) OpenSearch domain for vector search
    const opensearchDomain = new opensearch.Domain(this, 'VideoEmbeddingsDomain', {
      version: opensearch.EngineVersion.OPENSEARCH_2_3,
      domainName: 'milk-mobs-videos',
      capacity: {
        dataNodes: 1,
        dataNodeInstanceType: 't3.small.search',
      },
      ebs: {
        volumeSize: 20,
        volumeType: ec2.EbsDeviceVolumeType.GP3,
      },
      zoneAwareness: {
        enabled: false,
      },
      nodeToNodeEncryption: true,
      encryptionAtRest: {
        enabled: true,
      },
      enforceHttps: true,
      accessPolicies: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          principals: [new iam.ServicePrincipal('lambda.amazonaws.com')],
          actions: ['es:ESHttpPost', 'es:ESHttpPut', 'es:ESHttpGet'],
          resources: ['*'],
        }),
      ],
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

    // 4) Lambda function to list videos by userId
    const listUserVideosFn = new lambdaNodejs.NodejsFunction(this, 'ListUserVideosFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, '../../lambdas/list-user-videos/index.ts'),
      environment: {
        VIDEOS_TABLE_NAME: videosTable.tableName,
      },
      timeout: cdk.Duration.seconds(10),
    });

    // 5) Analysis Lambda functions for Step Functions pipeline
    const analysisMarkProcessingFn = new lambdaNodejs.NodejsFunction(this, 'AnalysisMarkProcessingFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, '../../lambdas/analysis-mark-processing/index.ts'),
      environment: {
        VIDEOS_TABLE_NAME: videosTable.tableName,
      },
      timeout: cdk.Duration.seconds(30),
    });

    const analysisPegasusFn = new lambdaNodejs.NodejsFunction(this, 'AnalysisPegasusFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, '../../lambdas/analysis-pegasus/index.ts'),
      environment: {
        BEDROCK_REGION: this.region,
        TWELVELABS_PEGASUS_MODEL_ID: process.env.TWELVELABS_PEGASUS_MODEL_ID || '',
      },
      timeout: cdk.Duration.minutes(5),
    });

    // Grant Bedrock invoke permissions
    analysisPegasusFn.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['bedrock:InvokeModel'],
        resources: [
          `arn:aws:bedrock:${this.region}::foundation-model/${process.env.TWELVELABS_PEGASUS_MODEL_ID || '*'}`,
        ],
      })
    );

    const analysisMarengoFn = new lambdaNodejs.NodejsFunction(this, 'AnalysisMarengoFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, '../../lambdas/analysis-marengo/index.ts'),
      environment: {
        BEDROCK_REGION: this.region,
        TWELVELABS_MARENGO_MODEL_ID: process.env.TWELVELABS_MARENGO_MODEL_ID || '',
      },
      timeout: cdk.Duration.minutes(5),
    });

    // Grant Bedrock invoke permissions
    analysisMarengoFn.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['bedrock:InvokeModel'],
        resources: [
          `arn:aws:bedrock:${this.region}::foundation-model/${process.env.TWELVELABS_MARENGO_MODEL_ID || '*'}`,
        ],
      })
    );

    const analysisWriteResultFn = new lambdaNodejs.NodejsFunction(this, 'AnalysisWriteResultFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, '../../lambdas/analysis-write-result/index.ts'),
      environment: {
        VIDEOS_TABLE_NAME: videosTable.tableName,
        OPENSEARCH_ENDPOINT: opensearchDomain.domainEndpoint,
        OPENSEARCH_INDEX_NAME: 'videos',
      },
      timeout: cdk.Duration.seconds(30),
    });

    // Grant OpenSearch access to analysis-write-result Lambda
    opensearchDomain.grantIndexWrite('videos', analysisWriteResultFn);

    // Start-analysis Lambda (replaces process-video for S3 trigger)
    const startAnalysisFn = new lambdaNodejs.NodejsFunction(this, 'StartAnalysisFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, '../../lambdas/start-analysis/index.ts'),
      environment: {
        VIDEOS_TABLE_NAME: videosTable.tableName,
      },
      timeout: cdk.Duration.seconds(30),
    });

    // 5b) Lambda function to cluster videos into mobs
    const clusterVideoFn = new lambdaNodejs.NodejsFunction(this, 'ClusterVideoFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, '../../lambdas/cluster-video/index.ts'),
      environment: {
        VIDEOS_TABLE_NAME: videosTable.tableName,
        MOBS_TABLE_NAME: mobsTable.tableName,
      },
      timeout: cdk.Duration.seconds(30),
    });

    // 5c) API Lambda functions
    const getVideoDetailFn = new lambdaNodejs.NodejsFunction(this, 'GetVideoDetailFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, '../../lambdas/get-video-detail/index.ts'),
      environment: {
        VIDEOS_TABLE_NAME: videosTable.tableName,
        UPLOADS_BUCKET_NAME: uploadsBucket.bucketName,
        CLOUDFRONT_DISTRIBUTION_DOMAIN: distribution.distributionDomainName,
      },
      timeout: cdk.Duration.seconds(10),
    });

    // Grant S3 read access for presigned URL generation
    uploadsBucket.grantRead(getVideoDetailFn);

    const adminListVideosFn = new lambdaNodejs.NodejsFunction(this, 'AdminListVideosFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, '../../lambdas/admin-list-videos/index.ts'),
      environment: {
        VIDEOS_TABLE_NAME: videosTable.tableName,
      },
      timeout: cdk.Duration.seconds(10),
    });

    const listMobsFn = new lambdaNodejs.NodejsFunction(this, 'ListMobsFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, '../../lambdas/list-mobs/index.ts'),
      environment: {
        MOBS_TABLE_NAME: mobsTable.tableName,
      },
      timeout: cdk.Duration.seconds(10),
    });

    const getMobFn = new lambdaNodejs.NodejsFunction(this, 'GetMobFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, '../../lambdas/get-mob/index.ts'),
      environment: {
        MOBS_TABLE_NAME: mobsTable.tableName,
        VIDEOS_TABLE_NAME: videosTable.tableName,
      },
      timeout: cdk.Duration.seconds(10),
    });

    // EventBridge custom bus for video analysis events
    const eventBus = new events.EventBus(this, 'MilkMobsEventBus', {
      eventBusName: 'milk-mobs-bus',
    });

    // Step Functions state machine for video analysis pipeline
    const markProcessingTask = new sfnTasks.LambdaInvoke(this, 'MarkProcessingTask', {
      lambdaFunction: analysisMarkProcessingFn,
      outputPath: '$.Payload',
    });

    const pegasusTask = new sfnTasks.LambdaInvoke(this, 'PegasusTask', {
      lambdaFunction: analysisPegasusFn,
      outputPath: '$.Payload',
    });

    const marengoTask = new sfnTasks.LambdaInvoke(this, 'MarengoTask', {
      lambdaFunction: analysisMarengoFn,
      outputPath: '$.Payload',
    });

    // Parallel execution of Pegasus and Marengo
    const parallelAnalysis = new sfn.Parallel(this, 'ParallelAnalysis', {
      comment: 'Run Pegasus and Marengo analysis in parallel',
    });
    parallelAnalysis.branch(pegasusTask);
    parallelAnalysis.branch(marengoTask);

    // Merge results from parallel tasks
    const mergeResults = new sfn.Pass(this, 'MergeResults', {
      parameters: {
        'videoId.$': '$.videoId',
        's3Bucket.$': '$.s3Bucket',
        's3Key.$': '$.s3Key',
        'hashtags.$': '$.hashtags',
        'participation.$': '$[0].participation',
        'embedding.$': '$[1].embedding',
      },
    });

    const writeResultTask = new sfnTasks.LambdaInvoke(this, 'WriteResultTask', {
      lambdaFunction: analysisWriteResultFn,
      outputPath: '$.Payload',
    });

    // Emit EventBridge event
    const emitEventTask = new sfnTasks.EventBridgePutEvents(this, 'EmitVideoAnalyzedEvent', {
      entries: [
        {
          detail: sfn.TaskInput.fromObject({
            videoId: sfn.JsonPath.stringAt('$.videoId'),
            status: sfn.JsonPath.stringAt('$.status'),
            participationScore: sfn.JsonPath.numberAt('$.participationScore'),
            mobId: sfn.JsonPath.stringAt('$.mobId'),
          }),
          detailType: 'VideoAnalyzed',
          source: 'milk-mobs.analysis',
          eventBus,
        },
      ],
    });

    // Define state machine
    const definition = markProcessingTask
      .next(parallelAnalysis)
      .next(mergeResults)
      .next(writeResultTask)
      .next(emitEventTask);

    const videoAnalysisStateMachine = new sfn.StateMachine(this, 'VideoAnalysisStateMachine', {
      definition,
      timeout: cdk.Duration.minutes(10),
      comment: 'Video analysis pipeline using Pegasus and Marengo',
    });

    // Grant start-analysis Lambda permission to start state machine
    videoAnalysisStateMachine.grantStartExecution(startAnalysisFn);
    startAnalysisFn.addEnvironment('STATE_MACHINE_ARN', videoAnalysisStateMachine.stateMachineArn);

    // Grant permissions
    uploadsBucket.grantPut(createUploadFn);
    uploadsBucket.grantRead(startAnalysisFn);
    videosTable.grantWriteData(createUploadFn);
    videosTable.grantReadData(startAnalysisFn);
    videosTable.grantReadWriteData(analysisMarkProcessingFn);
    videosTable.grantReadWriteData(analysisWriteResultFn);
    videosTable.grantReadData(listUserVideosFn);
    videosTable.grantReadWriteData(clusterVideoFn);
    videosTable.grantReadData(getVideoDetailFn);
    videosTable.grantReadData(adminListVideosFn);
    videosTable.grantReadData(getMobFn);
    mobsTable.grantReadWriteData(clusterVideoFn);
    mobsTable.grantReadData(listMobsFn);
    mobsTable.grantReadData(getMobFn);

    // Add S3 event source to trigger start-analysis Lambda
    startAnalysisFn.addEventSource(
      new lambdaEventSources.S3EventSource(uploadsBucket, {
        events: [s3.EventType.OBJECT_CREATED],
        filters: [{ prefix: 'vid_', suffix: '.mp4' }],
      })
    );

    // Batch clustering Lambda (runs on schedule)
    const clusterEmbeddingsFn = new lambdaNodejs.NodejsFunction(this, 'ClusterEmbeddingsFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, '../../lambdas/cluster-embeddings/index.ts'),
      environment: {
        VIDEOS_TABLE_NAME: videosTable.tableName,
        MOBS_TABLE_NAME: mobsTable.tableName,
      },
      timeout: cdk.Duration.minutes(5), // Clustering may take time
      memorySize: 512, // More memory for in-memory clustering
    });

    videosTable.grantReadData(clusterEmbeddingsFn);
    videosTable.grantReadWriteData(clusterEmbeddingsFn);
    mobsTable.grantReadWriteData(clusterEmbeddingsFn);

    // Schedule clustering to run once per hour
    const clusteringRule = new events.Rule(this, 'ClusteringSchedule', {
      schedule: events.Schedule.rate(cdk.Duration.hours(1)),
      description: 'Trigger batch clustering of video embeddings',
    });

    clusteringRule.addTarget(new eventTargets.LambdaFunction(clusterEmbeddingsFn));

    // 6) API Gateway REST API
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

    // GET /videos/user?userId={userId}
    const user = videos.addResource('user');
    user.addMethod('GET', new apigw.LambdaIntegration(listUserVideosFn), {
      methodResponses: [{ statusCode: '200' }],
    });

    // GET /videos/{videoId}
    const videoId = videos.addResource('{videoId}');
    videoId.addMethod('GET', new apigw.LambdaIntegration(getVideoDetailFn), {
      methodResponses: [{ statusCode: '200' }],
    });

    // GET /admin/videos
    const admin = api.root.addResource('admin');
    const adminVideos = admin.addResource('videos');
    adminVideos.addMethod('GET', new apigw.LambdaIntegration(adminListVideosFn), {
      methodResponses: [{ statusCode: '200' }],
    });

    // GET /mobs
    const mobs = api.root.addResource('mobs');
    mobs.addMethod('GET', new apigw.LambdaIntegration(listMobsFn), {
      methodResponses: [{ statusCode: '200' }],
    });

    // GET /mobs/{mobId}
    const mobId = mobs.addResource('{mobId}');
    mobId.addMethod('GET', new apigw.LambdaIntegration(getMobFn), {
      methodResponses: [{ statusCode: '200' }],
    });

    // GET /search/similar?videoId={videoId}
    const searchSimilarFn = new lambdaNodejs.NodejsFunction(this, 'SearchSimilarFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, '../../lambdas/search-similar/index.ts'),
      environment: {
        VIDEOS_TABLE_NAME: videosTable.tableName,
        OPENSEARCH_ENDPOINT: opensearchDomain.domainEndpoint,
        OPENSEARCH_INDEX_NAME: 'videos',
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 512, // More memory for similarity calculations
    });

    // Grant OpenSearch read access to search-similar Lambda
    opensearchDomain.grantIndexRead('videos', searchSimilarFn);

    videosTable.grantReadData(searchSimilarFn);

    const search = api.root.addResource('search');
    const similar = search.addResource('similar');
    similar.addMethod('GET', new apigw.LambdaIntegration(searchSimilarFn), {
      methodResponses: [{ statusCode: '200' }],
    });

    // POST /validate (or GET /validate/{videoId})
    const validateVideoFn = new lambdaNodejs.NodejsFunction(this, 'ValidateVideoFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, '../../lambdas/validate-video/index.ts'),
      environment: {
        VIDEOS_TABLE_NAME: videosTable.tableName,
      },
      timeout: cdk.Duration.seconds(10),
    });

    videosTable.grantReadData(validateVideoFn);

    const validate = api.root.addResource('validate');
    validate.addMethod('POST', new apigw.LambdaIntegration(validateVideoFn), {
      methodResponses: [{ statusCode: '200' }],
    });
    
    // Also support GET /validate/{videoId}
    const validateVideoId = validate.addResource('{videoId}');
    validateVideoId.addMethod('GET', new apigw.LambdaIntegration(validateVideoFn), {
      methodResponses: [{ statusCode: '200' }],
    });

    // 7) Outputs for frontends / debugging
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

    new cdk.CfnOutput(this, 'MobsTableName', {
      value: mobsTable.tableName,
      description: 'DynamoDB table name for mob clusters',
      exportName: 'MilkMobsMobsTableName',
    });

    new cdk.CfnOutput(this, 'StateMachineArn', {
      value: videoAnalysisStateMachine.stateMachineArn,
      description: 'Step Functions state machine ARN for video analysis',
      exportName: 'MilkMobsStateMachineArn',
    });

    new cdk.CfnOutput(this, 'EventBusName', {
      value: eventBus.eventBusName,
      description: 'EventBridge bus name for video analysis events',
      exportName: 'MilkMobsEventBusName',
    });

    new cdk.CfnOutput(this, 'CloudFrontDistributionDomain', {
      value: distribution.distributionDomainName,
      description: 'CloudFront distribution domain for video delivery',
      exportName: 'MilkMobsCloudFrontDomain',
    });

    new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
      value: distribution.distributionId,
      description: 'CloudFront distribution ID',
      exportName: 'MilkMobsCloudFrontId',
    });

    new cdk.CfnOutput(this, 'OpenSearchEndpoint', {
      value: opensearchDomain.domainEndpoint,
      description: 'OpenSearch domain endpoint for vector search',
      exportName: 'MilkMobsOpenSearchEndpoint',
    });

    // CloudWatch Dashboard for observability
    const dashboard = new cloudwatch.Dashboard(this, 'MilkMobsDashboard', {
      dashboardName: 'MilkMobsSystemHealth',
    });

    // Lambda metrics
    const analysisLambdas = [
      analysisMarkProcessingFn,
      analysisPegasusFn,
      analysisMarengoFn,
      analysisWriteResultFn,
      clusterEmbeddingsFn,
      validateVideoFn,
      searchSimilarFn,
    ];

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Analysis Lambda Invocations',
        left: analysisLambdas.map((fn) =>
          fn.metricInvocations({ statistic: 'Sum', label: fn.functionName })
        ),
        width: 24,
      }),
      new cloudwatch.GraphWidget({
        title: 'Analysis Lambda Errors',
        left: analysisLambdas.map((fn) =>
          fn.metricErrors({ statistic: 'Sum', label: fn.functionName })
        ),
        width: 24,
      }),
      new cloudwatch.GraphWidget({
        title: 'Step Functions Executions',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/States',
            metricName: 'ExecutionsStarted',
            dimensionsMap: {
              StateMachineArn: videoAnalysisStateMachine.stateMachineArn,
            },
            statistic: 'Sum',
            label: 'Total',
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/States',
            metricName: 'ExecutionsFailed',
            dimensionsMap: {
              StateMachineArn: videoAnalysisStateMachine.stateMachineArn,
            },
            statistic: 'Sum',
            label: 'Failed',
          }),
        ],
        width: 24,
      }),
      new cloudwatch.GraphWidget({
        title: 'DynamoDB Read/Write Capacity',
        left: [
          videosTable.metricConsumedReadCapacityUnits({ statistic: 'Sum', label: 'Videos Read' }),
          videosTable.metricConsumedWriteCapacityUnits({ statistic: 'Sum', label: 'Videos Write' }),
          mobsTable.metricConsumedReadCapacityUnits({ statistic: 'Sum', label: 'Mobs Read' }),
          mobsTable.metricConsumedWriteCapacityUnits({ statistic: 'Sum', label: 'Mobs Write' }),
        ],
        width: 24,
      }),
      new cloudwatch.GraphWidget({
        title: 'S3 Bucket Size',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/S3',
            metricName: 'BucketSizeBytes',
            dimensionsMap: {
              BucketName: uploadsBucket.bucketName,
              StorageType: 'StandardStorage',
            },
            statistic: 'Average',
            label: 'Uploads Bucket Size',
          }),
        ],
        width: 24,
      })
    );

    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://${cdk.Aws.REGION}.console.aws.amazon.com/cloudwatch/home?region=${cdk.Aws.REGION}#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
      exportName: 'MilkMobsDashboardUrl',
    });
  }
}
