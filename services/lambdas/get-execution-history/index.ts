import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { SFNClient, ListExecutionsCommand, DescribeExecutionCommand, GetExecutionHistoryCommand } from '@aws-sdk/client-sfn';

const stateMachineArn = process.env.STATE_MACHINE_ARN!;

const sfn = new SFNClient({});

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': 'true',
};

interface ExecutionStep {
  id: string;
  name: string;
  type: string;
  status: 'succeeded' | 'failed' | 'in_progress' | 'not_started';
  startTime?: string;
  endTime?: string;
  error?: string;
  input?: any;
  output?: any;
}

interface ExecutionGraph {
  executionArn: string;
  status: string;
  startDate: string;
  stopDate?: string;
  steps: ExecutionStep[];
}

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const videoId = event.queryStringParameters?.videoId;

    if (!videoId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'videoId query parameter is required' }),
      };
    }

    // List executions for this state machine
    // Note: We'll search for executions that contain the videoId in their input
    const listExecutionsResponse = await sfn.send(
      new ListExecutionsCommand({
        stateMachineArn,
        maxResults: 50, // Get recent executions
      })
    );

    // Find the execution(s) for this video
    let executionArn: string | null = null;
    let executionDetails: any = null;

    for (const execution of listExecutionsResponse.executions || []) {
      try {
        const describeResponse = await sfn.send(
          new DescribeExecutionCommand({
            executionArn: execution.executionArn,
          })
        );

        // Parse input to check if it matches our videoId
        if (describeResponse.input) {
          const input = JSON.parse(describeResponse.input);
          if (input.videoId === videoId) {
            executionArn = execution.executionArn;
            executionDetails = {
              ...execution,
              input: describeResponse.input,
              output: describeResponse.output,
            };
            break;
          }
        }
      } catch (err) {
        console.warn(`Failed to describe execution ${execution.executionArn}:`, err);
        continue;
      }
    }

    if (!executionArn) {
      return {
        statusCode: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          execution: null,
          message: 'No execution found for this video',
        }),
      };
    }

    // Get execution history to build the graph
    const historyResponse = await sfn.send(
      new GetExecutionHistoryCommand({
        executionArn,
        maxResults: 1000,
        reverseOrder: false,
      })
    );

    // Parse history events to build step graph
    const steps: ExecutionStep[] = [];
    const stepMap = new Map<string, ExecutionStep>();

    // Define the expected state machine structure
    const stateMachineSteps = [
      { id: 'MarkProcessingTask', name: 'Mark Processing', type: 'Lambda' },
      { id: 'ParallelAnalysis', name: 'Parallel Analysis', type: 'Parallel' },
      { id: 'PegasusTask', name: 'Pegasus Analysis', type: 'Lambda' },
      { id: 'MarengoTask', name: 'Marengo Embedding', type: 'Lambda' },
      { id: 'MergeResults', name: 'Merge Results', type: 'Pass' },
      { id: 'WriteResultTask', name: 'Write Results', type: 'Lambda' },
      { id: 'ValidateTask', name: 'Validate Video', type: 'Lambda' },
      { id: 'ClusterTask', name: 'Cluster Video', type: 'Lambda' },
      { id: 'EmitVideoAnalyzedEvent', name: 'Emit Event', type: 'EventBridge' },
    ];

    // Process history events
    for (const event of historyResponse.events || []) {
      const eventType = event.type;
      const stateEnteredEvent = event.stateEnteredEventDetails;
      const stateExitedEvent = event.stateExitedEventDetails;
      const taskScheduledEvent = event.taskScheduledEventDetails;
      const taskSucceededEvent = event.taskSucceededEventDetails;
      const taskFailedEvent = event.taskFailedEventDetails;
      const executionStartedEvent = event.executionStartedEventDetails;
      const executionSucceededEvent = event.executionSucceededEventDetails;
      const executionFailedEvent = event.executionFailedEventDetails;

      if (eventType === 'ExecutionStarted') {
        // Execution started
      } else if (eventType === 'ExecutionSucceeded' || eventType === 'ExecutionFailed') {
        // Execution completed
      } else if (stateEnteredEvent) {
        const stateName = stateEnteredEvent.name || 'Unknown';
        const stepId = stateName;

        if (!stepMap.has(stepId)) {
          stepMap.set(stepId, {
            id: stepId,
            name: stateMachineSteps.find((s) => s.id === stepId)?.name || stateName,
            type: stateMachineSteps.find((s) => s.id === stepId)?.type || 'Unknown',
            status: 'in_progress',
            startTime: new Date(event.timestamp).toISOString(),
            input: stateEnteredEvent.input,
          });
        }
      } else if (stateExitedEvent) {
        const stateName = stateExitedEvent.name || 'Unknown';
        const stepId = stateName;

        if (stepMap.has(stepId)) {
          const step = stepMap.get(stepId)!;
          step.status = 'succeeded';
          step.endTime = new Date(event.timestamp).toISOString();
          step.output = stateExitedEvent.output;
        }
      } else if (taskFailedEvent) {
        const resource = taskFailedEvent.resource || '';
        // Extract step name from resource ARN or error
        const stepId = taskFailedEvent.resource?.split(':').pop() || 'Unknown';

        if (stepMap.has(stepId)) {
          const step = stepMap.get(stepId)!;
          step.status = 'failed';
          step.endTime = new Date(event.timestamp).toISOString();
          step.error = taskFailedEvent.error || taskFailedEvent.cause || 'Task failed';
        } else {
          // Create new failed step
          stepMap.set(stepId, {
            id: stepId,
            name: stepId,
            type: 'Lambda',
            status: 'failed',
            startTime: new Date(event.timestamp).toISOString(),
            endTime: new Date(event.timestamp).toISOString(),
            error: taskFailedEvent.error || taskFailedEvent.cause || 'Task failed',
          });
        }
      }
    }

    // Convert map to array and sort by start time
    const stepsArray = Array.from(stepMap.values()).sort((a, b) => {
      const timeA = a.startTime ? new Date(a.startTime).getTime() : 0;
      const timeB = b.startTime ? new Date(b.startTime).getTime() : 0;
      return timeA - timeB;
    });

    // Build execution graph
    const graph: ExecutionGraph = {
      executionArn,
      status: executionDetails.status || 'UNKNOWN',
      startDate: executionDetails.startDate?.toISOString() || new Date().toISOString(),
      stopDate: executionDetails.stopDate?.toISOString(),
      steps: stepsArray,
    };

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ execution: graph }),
    };
  } catch (err) {
    console.error('Error fetching execution history:', err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

