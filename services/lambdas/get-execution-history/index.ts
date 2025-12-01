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

    // Define the expected state machine structure - map CDK construct IDs to display names
    const stateNameMap: Record<string, { name: string; type: string }> = {
      'MarkProcessingTask': { name: 'Mark Processing', type: 'Lambda' },
      'ParallelAnalysis': { name: 'Parallel Analysis', type: 'Parallel' },
      'PegasusTask': { name: 'Pegasus Analysis', type: 'Lambda' },
      'MarengoTask': { name: 'Marengo Embedding', type: 'Lambda' },
      'MergeResults': { name: 'Merge Results', type: 'Pass' },
      'WriteResultTask': { name: 'Write Results', type: 'Lambda' },
      'ValidateTask': { name: 'Validate Video', type: 'Lambda' },
      'ClusterTask': { name: 'Cluster Video', type: 'Lambda' },
      'EmitVideoAnalyzedEvent': { name: 'Emit Event', type: 'EventBridge' },
    };

    // Process history events - Step Functions emits StateEntered/StateExited for all states
    for (const event of historyResponse.events || []) {
      const eventType = event.type;
      const stateEnteredEvent = event.stateEnteredEventDetails;
      const stateExitedEvent = event.stateExitedEventDetails;
      const taskFailedEvent = event.taskFailedEventDetails;
      const executionFailedEvent = event.executionFailedEventDetails;

      // Handle state entered events
      if (stateEnteredEvent) {
        const stateName = stateEnteredEvent.name || 'Unknown';
        const stepId = stateName;

        if (!stepMap.has(stepId)) {
          const stepInfo = stateNameMap[stepId] || { name: stateName, type: 'Unknown' };
          stepMap.set(stepId, {
            id: stepId,
            name: stepInfo.name,
            type: stepInfo.type,
            status: 'in_progress',
            startTime: new Date(event.timestamp).toISOString(),
            input: stateEnteredEvent.input ? JSON.parse(stateEnteredEvent.input) : undefined,
          });
        } else {
          // Update existing step if it doesn't have a start time
          const step = stepMap.get(stepId)!;
          if (!step.startTime) {
            step.startTime = new Date(event.timestamp).toISOString();
            step.input = stateEnteredEvent.input ? JSON.parse(stateEnteredEvent.input) : undefined;
          }
        }
      }

      // Handle state exited events (successful completion)
      if (stateExitedEvent) {
        const stateName = stateExitedEvent.name || 'Unknown';
        const stepId = stateName;

        if (stepMap.has(stepId)) {
          const step = stepMap.get(stepId)!;
          step.status = 'succeeded';
          step.endTime = new Date(event.timestamp).toISOString();
          step.output = stateExitedEvent.output ? JSON.parse(stateExitedEvent.output) : undefined;
        } else {
          // Create step if it wasn't tracked (shouldn't happen, but handle gracefully)
          const stepInfo = stateNameMap[stepId] || { name: stateName, type: 'Unknown' };
          stepMap.set(stepId, {
            id: stepId,
            name: stepInfo.name,
            type: stepInfo.type,
            status: 'succeeded',
            endTime: new Date(event.timestamp).toISOString(),
            output: stateExitedEvent.output ? JSON.parse(stateExitedEvent.output) : undefined,
          });
        }
      }

      // Handle task failed events
      if (taskFailedEvent) {
        // Try to extract state name from the error or resource
        // The resource ARN might contain the Lambda function name, but we need the state name
        // Look for the state name in the error message or use a fallback
        const errorMessage = taskFailedEvent.error || taskFailedEvent.cause || '';
        let stepId: string | null = null;

        // Try to find state name in error message
        for (const stateId of Object.keys(stateNameMap)) {
          if (errorMessage.includes(stateId)) {
            stepId = stateId;
            break;
          }
        }

        // If not found, try to extract from resource ARN (last resort)
        if (!stepId && taskFailedEvent.resource) {
          const resourceParts = taskFailedEvent.resource.split(':');
          const functionName = resourceParts[resourceParts.length - 1];
          // Try to match function name to state (this is a heuristic)
          for (const stateId of Object.keys(stateNameMap)) {
            if (functionName.toLowerCase().includes(stateId.toLowerCase().replace('Task', ''))) {
              stepId = stateId;
              break;
            }
          }
        }

        if (stepId && stepMap.has(stepId)) {
          const step = stepMap.get(stepId)!;
          step.status = 'failed';
          step.endTime = new Date(event.timestamp).toISOString();
          step.error = taskFailedEvent.error || taskFailedEvent.cause || 'Task failed';
        } else if (stepId) {
          // Create new failed step
          const stepInfo = stateNameMap[stepId] || { name: stepId, type: 'Lambda' };
          stepMap.set(stepId, {
            id: stepId,
            name: stepInfo.name,
            type: stepInfo.type,
            status: 'failed',
            startTime: new Date(event.timestamp).toISOString(),
            endTime: new Date(event.timestamp).toISOString(),
            error: taskFailedEvent.error || taskFailedEvent.cause || 'Task failed',
          });
        }
      }

      // Handle execution failed events
      if (executionFailedEvent) {
        // Mark all in-progress steps as failed if execution failed
        for (const [stepId, step] of stepMap.entries()) {
          if (step.status === 'in_progress') {
            step.status = 'failed';
            step.endTime = new Date(event.timestamp).toISOString();
            step.error = executionFailedEvent.error || executionFailedEvent.cause || 'Execution failed';
          }
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

