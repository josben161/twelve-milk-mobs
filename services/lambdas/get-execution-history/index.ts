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
  console.log('=== Execution History Lambda Handler Invoked ===');
  console.log('Event:', JSON.stringify(event, null, 2));
  
  try {
    const videoId = event.queryStringParameters?.videoId;
    console.log('[get-execution-history] videoId received:', videoId);
    console.log('[get-execution-history] stateMachineArn:', stateMachineArn);

    if (!videoId) {
      console.error('[get-execution-history] Missing videoId parameter');
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'videoId query parameter is required' }),
      };
    }

    // List executions for this state machine
    // Note: We'll search for executions that contain the videoId in their input
    console.log('[get-execution-history] Listing executions for state machine...');
    const listExecutionsResponse = await sfn.send(
      new ListExecutionsCommand({
        stateMachineArn,
        maxResults: 50, // Get recent executions
      })
    );
    console.log('[get-execution-history] Found executions:', listExecutionsResponse.executions?.length || 0);

    // Find the execution(s) for this video
    let executionArn: string | null = null;
    let executionDetails: any = null;

    console.log('[get-execution-history] Searching for execution matching videoId:', videoId);
    let checkedCount = 0;
    
    for (const execution of listExecutionsResponse.executions || []) {
      checkedCount++;
      try {
        console.log(`[get-execution-history] Checking execution ${checkedCount}/${listExecutionsResponse.executions?.length || 0}:`, execution.executionArn);
        const describeResponse = await sfn.send(
          new DescribeExecutionCommand({
            executionArn: execution.executionArn,
          })
        );

        // Parse input to check if it matches our videoId
        if (describeResponse.input) {
          try {
            const input = JSON.parse(describeResponse.input);
            console.log(`[get-execution-history] Execution input parsed:`, { videoId: input.videoId, status: execution.status });
            
            if (input.videoId === videoId) {
              console.log(`[get-execution-history] ✓ Found matching execution! ARN: ${execution.executionArn}`);
              executionArn = execution.executionArn;
              executionDetails = {
                ...execution,
                input: describeResponse.input,
                output: describeResponse.output,
              };
              break;
            } else {
              console.log(`[get-execution-history] Execution videoId (${input.videoId}) does not match (${videoId})`);
            }
          } catch (parseErr) {
            console.warn(`[get-execution-history] Failed to parse input for execution ${execution.executionArn}:`, parseErr);
          }
        } else {
          console.log(`[get-execution-history] Execution ${execution.executionArn} has no input`);
        }
      } catch (err) {
        console.warn(`[get-execution-history] Failed to describe execution ${execution.executionArn}:`, err);
        continue;
      }
    }
    
    console.log(`[get-execution-history] Checked ${checkedCount} executions`);

    if (!executionArn) {
      console.log('[get-execution-history] ✗ No execution found for videoId:', videoId);
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
    console.log('[get-execution-history] Fetching execution history for ARN:', executionArn);
    const historyResponse = await sfn.send(
      new GetExecutionHistoryCommand({
        executionArn,
        maxResults: 1000,
        reverseOrder: false,
      })
    );
    console.log('[get-execution-history] Retrieved', historyResponse.events?.length || 0, 'history events');

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
    console.log('[get-execution-history] Processing history events...');
    let eventCount = 0;
    let stateEnteredCount = 0;
    let stateExitedCount = 0;
    let taskFailedCount = 0;
    
    for (const event of historyResponse.events || []) {
      eventCount++;
      const eventType = event.type;
      const stateEnteredEvent = event.stateEnteredEventDetails;
      const stateExitedEvent = event.stateExitedEventDetails;
      const taskFailedEvent = event.taskFailedEventDetails;
      const executionFailedEvent = event.executionFailedEventDetails;
      
      if (eventCount <= 5 || eventCount % 50 === 0) {
        console.log(`[get-execution-history] Event ${eventCount}: type=${eventType}, id=${event.id}`);
      }

      // Handle state entered events
      if (stateEnteredEvent) {
        stateEnteredCount++;
        const stateName = stateEnteredEvent.name || 'Unknown';
        const stepId = stateName;
        console.log(`[get-execution-history] StateEntered: ${stepId}`);

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
          console.log(`[get-execution-history] Created new step: ${stepId} (${stepInfo.name})`);
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
        stateExitedCount++;
        const stateName = stateExitedEvent.name || 'Unknown';
        const stepId = stateName;
        console.log(`[get-execution-history] StateExited: ${stepId}`);

        if (stepMap.has(stepId)) {
          const step = stepMap.get(stepId)!;
          step.status = 'succeeded';
          step.endTime = new Date(event.timestamp).toISOString();
          step.output = stateExitedEvent.output ? JSON.parse(stateExitedEvent.output) : undefined;
          console.log(`[get-execution-history] Updated step ${stepId} to succeeded`);
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
          console.log(`[get-execution-history] Created step ${stepId} as succeeded (wasn't tracked before)`);
        }
      }

      // Handle task failed events
      if (taskFailedEvent) {
        taskFailedCount++;
        console.log(`[get-execution-history] TaskFailed event detected`);
        // Try to extract state name from the error or resource
        // The resource ARN might contain the Lambda function name, but we need the state name
        // Look for the state name in the error message or use a fallback
        const errorMessage = taskFailedEvent.error || taskFailedEvent.cause || '';
        let stepId: string | null = null;

        // Try to find state name in error message
        for (const stateId of Object.keys(stateNameMap)) {
          if (errorMessage.includes(stateId)) {
            stepId = stateId;
            console.log(`[get-execution-history] Found stepId ${stepId} in error message`);
            break;
          }
        }

        // If not found, try to extract from resource ARN (last resort)
        if (!stepId && taskFailedEvent.resource) {
          const resourceParts = taskFailedEvent.resource.split(':');
          const functionName = resourceParts[resourceParts.length - 1];
          console.log(`[get-execution-history] Trying to match function name: ${functionName}`);
          // Try to match function name to state (this is a heuristic)
          for (const stateId of Object.keys(stateNameMap)) {
            if (functionName.toLowerCase().includes(stateId.toLowerCase().replace('Task', ''))) {
              stepId = stateId;
              console.log(`[get-execution-history] Matched function name to stepId: ${stepId}`);
              break;
            }
          }
        }

        if (stepId && stepMap.has(stepId)) {
          const step = stepMap.get(stepId)!;
          step.status = 'failed';
          step.endTime = new Date(event.timestamp).toISOString();
          step.error = taskFailedEvent.error || taskFailedEvent.cause || 'Task failed';
          console.log(`[get-execution-history] Updated step ${stepId} to failed`);
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
          console.log(`[get-execution-history] Created new failed step: ${stepId}`);
        } else {
          console.warn(`[get-execution-history] TaskFailed event but could not determine stepId. Error: ${errorMessage}, Resource: ${taskFailedEvent.resource}`);
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

    console.log(`[get-execution-history] Event processing summary: total=${eventCount}, StateEntered=${stateEnteredCount}, StateExited=${stateExitedCount}, TaskFailed=${taskFailedCount}`);
    console.log(`[get-execution-history] Steps found: ${stepMap.size}`);
    console.log(`[get-execution-history] Step IDs:`, Array.from(stepMap.keys()));

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

    console.log('[get-execution-history] Final graph structure:', {
      executionArn: graph.executionArn,
      status: graph.status,
      stepsCount: graph.steps.length,
      stepIds: graph.steps.map(s => s.id),
    });

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ execution: graph }),
    };
  } catch (err) {
    console.error('[get-execution-history] === FATAL ERROR ===');
    console.error('Error details:', {
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      type: err instanceof Error ? err.constructor.name : typeof err,
    });
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: err instanceof Error ? err.message : String(err),
      }),
    };
  }
};

