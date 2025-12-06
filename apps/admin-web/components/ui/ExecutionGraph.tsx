'use client';

import { useCallback, useMemo, useEffect, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';

interface ExecutionStep {
  id: string;
  name: string;
  type: string;
  status: 'succeeded' | 'failed' | 'in_progress' | 'not_started';
  startTime?: string;
  endTime?: string;
  error?: string;
  twelveLabsData?: {
    participation?: {
      participationScore?: number;
      mentionsMilk?: boolean;
      showsMilkObject?: boolean;
      showsActionAligned?: boolean;
      rationale?: string;
      highlights?: Array<{ timestamp: number; description: string; score?: number }>;
    };
    embedding?: {
      dim?: number;
      vectorLength?: number;
    };
    validation?: {
      status?: string;
      validationScore?: number;
      reasons?: string[];
    };
    clustering?: {
      mobId?: string;
      method?: 'embedding' | 'keyword';
      similarityScore?: number;
    };
  };
}

interface ExecutionGraphProps {
  steps: ExecutionStep[];
  executionStatus?: string;
}

// Campaign context for each step
const stepCampaignContext: Record<string, {
  workflowStage: 'Identify' | 'Validate' | 'Segment' | 'Explore';
  description: string;
  twelveLabsFunction?: string;
  businessValue: string;
  modalities?: string[];
}> = {
  'MarkProcessingTask': {
    workflowStage: 'Identify',
    description: 'Initial video ingestion - identifies when someone is taking part in the campaign',
    businessValue: 'Marks video for processing and campaign participation detection',
  },
  'PegasusTask': {
    workflowStage: 'Validate',
    description: 'Participation detection - validates contents are related to "Got Milk" campaign',
    twelveLabsFunction: 'Detects "drinking milk" actions, milk containers, on-screen text (#gotmilk, #milkmob), and spoken mentions',
    businessValue: 'Validates campaign participation using multimodal analysis',
    modalities: ['Visual', 'Audio', 'OCR/Text'],
  },
  'MarengoTask': {
    workflowStage: 'Segment',
    description: 'Embedding generation - enables video clustering and similarity search',
    twelveLabsFunction: 'Generates embeddings per video for similarity search and clustering by activity (parkour-with-milk, latte-art, skate-with-milk), location (city landmarks), or vibe (funny/serious)',
    businessValue: 'Creates searchable video embeddings for mob creation',
    modalities: ['Visual', 'Audio'],
  },
  'ParallelAnalysis': {
    workflowStage: 'Validate',
    description: 'Parallel execution of TwelveLabs APIs for efficient processing',
    businessValue: 'Runs Pegasus and Marengo analysis simultaneously',
  },
  'MergeResults': {
    workflowStage: 'Validate',
    description: 'Combines multimodal analysis from both TwelveLabs APIs',
    businessValue: 'Merges participation detection and embedding results',
  },
  'WriteResultTask': {
    workflowStage: 'Validate',
    description: 'Stores analysis results for validation decision',
    businessValue: 'Persists analysis data for validation threshold check',
  },
  'ValidateTask': {
    workflowStage: 'Validate',
    description: 'Automatic validation against confidence threshold across modalities (visual, audio, OCR)',
    businessValue: 'Determines if video passes campaign requirements',
  },
  'ClusterTask': {
    workflowStage: 'Segment',
    description: 'Segments users into "Milk Mobs" by activity, location, or vibe',
    businessValue: 'Groups similar videos together for user exploration',
  },
  'EmitVideoAnalyzedEvent': {
    workflowStage: 'Explore',
    description: 'Triggers downstream processing for user exploration of similar mobs',
    businessValue: 'Enables users to discover and explore related videos',
  },
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'succeeded':
      return '#10b981'; // emerald-500
    case 'failed':
      return '#ef4444'; // red-500
    case 'in_progress':
      return '#f59e0b'; // amber-500
    default:
      return '#6b7280'; // gray-500
  }
};

// Get node color based on service type and status
const getNodeColor = (stepId: string, status: string) => {
  const isTwelveLabs = stepId === 'PegasusTask' || stepId === 'MarengoTask';
  
  if (isTwelveLabs) {
    // TwelveLabs brand colors - indigo/purple gradient
    switch (status) {
      case 'succeeded':
        return {
          border: '#6366f1', // indigo-500
          background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)', // indigo-50 to indigo-100
          text: '#4338ca', // indigo-700
        };
      case 'failed':
        return {
          border: '#ef4444',
          background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
          text: '#dc2626',
        };
      case 'in_progress':
        return {
          border: '#f59e0b',
          background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
          text: '#d97706',
        };
      default:
        return {
          border: '#9ca3af',
          background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
          text: '#6b7280',
        };
    }
  } else {
    // AWS services - teal/blue
    switch (status) {
      case 'succeeded':
        return {
          border: '#14b8a6', // teal-500
          background: 'var(--bg-soft)',
          text: 'var(--text)',
        };
      case 'failed':
        return {
          border: '#ef4444',
          background: '#fef2f2',
          text: '#dc2626',
        };
      case 'in_progress':
        return {
          border: '#f59e0b',
          background: '#fffbeb',
          text: '#d97706',
        };
      default:
        return {
          border: '#9ca3af',
          background: 'var(--bg-soft)',
          text: 'var(--text-muted)',
        };
    }
  }
};

// Workflow stage colors
const workflowStageColors: Record<string, string> = {
  'Identify': '#3b82f6', // blue
  'Validate': '#10b981', // emerald
  'Segment': '#8b5cf6', // violet
  'Explore': '#f59e0b', // amber
};

const getStatusBg = (status: string) => {
  switch (status) {
    case 'succeeded':
      return 'bg-emerald-500/10 border-emerald-500/40';
    case 'failed':
      return 'bg-rose-500/10 border-rose-500/40';
    case 'in_progress':
      return 'bg-amber-500/10 border-amber-500/40';
    default:
      return 'bg-gray-500/10 border-gray-500/40';
  }
};

export function ExecutionGraph({ steps, executionStatus }: ExecutionGraphProps) {
  // Build nodes and edges from steps
  const { nodes: computedNodes, edges: computedEdges } = useMemo(() => {
    const nodeWidth = 200;
    const nodeHeight = 80;
    const horizontalSpacing = 350; // Increased from 250 to prevent overlap
    const verticalSpacing = 200; // Increased from 150 to prevent overlap

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Define the pipeline structure with campaign context
    const pipelineStructure = [
      { id: 'MarkProcessingTask', name: 'Mark Processing', type: 'AWS Lambda', parent: null },
      { id: 'ParallelAnalysis', name: 'Parallel Analysis', type: 'Step Functions', parent: null },
      { id: 'PegasusTask', name: 'Pegasus', type: 'TwelveLabs API', parent: 'ParallelAnalysis', subtitle: 'Participation Detection' },
      { id: 'MarengoTask', name: 'Marengo', type: 'TwelveLabs API', parent: 'ParallelAnalysis', subtitle: 'Embedding Generation' },
      { id: 'MergeResults', name: 'Merge Results', type: 'Step Functions', parent: null },
      { id: 'WriteResultTask', name: 'Write Results', type: 'AWS Lambda', parent: null },
      { id: 'ValidateTask', name: 'Validate', type: 'AWS Lambda', parent: null },
      { id: 'ClusterTask', name: 'Cluster', type: 'AWS Lambda', parent: null },
      { id: 'EmitVideoAnalyzedEvent', name: 'Emit Event', type: 'EventBridge', parent: null },
    ];

    // Create a map of step statuses
    const stepStatusMap = new Map<string, ExecutionStep>();
    steps.forEach((step) => {
      stepStatusMap.set(step.id, step);
    });

    // Log missing steps for debugging
    const missingSteps = pipelineStructure.filter(stepDef => !stepStatusMap.has(stepDef.id));
    if (missingSteps.length > 0) {
      console.warn('[ExecutionGraph] Missing steps in execution data:', missingSteps.map(s => s.id));
      console.log('[ExecutionGraph] Available step IDs:', Array.from(stepStatusMap.keys()));
    }

    // Create nodes
    let x = 0;
    let y = 0;

    pipelineStructure.forEach((stepDef) => {
      const step = stepStatusMap.get(stepDef.id);
      const status = step?.status || 'not_started';
      const isParallel = stepDef.parent === 'ParallelAnalysis';
      const context = stepCampaignContext[stepDef.id];
      const nodeColors = getNodeColor(stepDef.id, status);
      const isTwelveLabs = stepDef.type === 'TwelveLabs API';

      // Calculate duration if available
      let duration = '';
      if (step?.startTime && step?.endTime) {
        const start = new Date(step.startTime).getTime();
        const end = new Date(step.endTime).getTime();
        const seconds = Math.round((end - start) / 1000);
        if (seconds < 60) {
          duration = `${seconds}s`;
        } else {
          duration = `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
        }
      }

      // Create node label with enhanced details
      const nodeLabel = (
        <div className="text-center p-2">
          {context?.workflowStage && (
            <div 
              className="text-[10px] font-semibold uppercase tracking-wide mb-1 px-2 py-0.5 rounded"
              style={{ 
                backgroundColor: `${workflowStageColors[context.workflowStage]}20`,
                color: workflowStageColors[context.workflowStage],
              }}
            >
              {context.workflowStage}
            </div>
          )}
          <div className="font-semibold text-sm" style={{ color: nodeColors.text }}>
            {stepDef.name}
          </div>
          {stepDef.subtitle && (
            <div className="text-[10px] font-medium mt-0.5" style={{ color: nodeColors.text, opacity: 0.8 }}>
              {stepDef.subtitle}
            </div>
          )}
          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {stepDef.type}
          </div>
          {duration && (
            <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
              {duration}
            </div>
          )}
          {step?.error && (
            <div className="text-xs mt-1 text-rose-400" title={step.error}>
              Error
            </div>
          )}
          {status === 'not_started' && (
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Not started
            </div>
          )}
          {isTwelveLabs && (
            <div className="mt-1">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-100 text-indigo-700">
                TwelveLabs
              </span>
            </div>
          )}
        </div>
      );

      if (stepDef.id === 'ParallelAnalysis') {
        // Parallel node spans both branches
        nodes.push({
          id: stepDef.id,
          type: 'default',
          position: { x: x * horizontalSpacing, y: y * verticalSpacing },
          data: {
            label: nodeLabel,
            context,
            step,
            stepName: stepDef.name,
            stepType: stepDef.type,
          },
          style: {
            width: nodeWidth,
            height: nodeHeight + 20,
            border: `2px solid ${nodeColors.border}`,
            borderRadius: '12px',
            background: nodeColors.background,
            boxShadow: isTwelveLabs ? '0 4px 6px -1px rgba(99, 102, 241, 0.1), 0 2px 4px -1px rgba(99, 102, 241, 0.06)' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          },
        });
        x++;
      } else if (isParallel) {
        // Parallel branch nodes - TwelveLabs services
        const branchX = (x - 1) * horizontalSpacing;
        const branchY = y * verticalSpacing + (stepDef.id === 'PegasusTask' ? -120 : 120); // Increased offset to prevent overlap
        nodes.push({
          id: stepDef.id,
          type: 'default',
          position: { x: branchX, y: branchY },
          data: {
            label: nodeLabel,
            context,
            step,
            stepName: stepDef.name,
            stepType: stepDef.type,
            subtitle: stepDef.subtitle,
          },
          style: {
            width: nodeWidth + 20,
            height: nodeHeight + 30,
            border: `3px solid ${nodeColors.border}`,
            borderRadius: '12px',
            background: nodeColors.background,
            boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.1), 0 2px 4px -1px rgba(99, 102, 241, 0.06)',
          },
        });
        // Don't increment x or y for parallel branches - they're positioned relative to parent
      } else {
        // Regular sequential nodes - move to next column after parallel branches merge
        // If we just processed MergeResults (which comes after parallel), ensure proper spacing
        if (stepDef.id === 'MergeResults') {
          x++; // Move to next column for merge
          y++; // Move down to align with merge point
        }
        nodes.push({
          id: stepDef.id,
          type: 'default',
          position: { x: x * horizontalSpacing, y: y * verticalSpacing },
          data: {
            label: nodeLabel,
            context,
            step,
            stepName: stepDef.name,
            stepType: stepDef.type,
          },
          style: {
            width: nodeWidth,
            height: nodeHeight + 20,
            border: `2px solid ${nodeColors.border}`,
            borderRadius: '12px',
            background: nodeColors.background,
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          },
        });
        x++;
      }
    });

    // Create edges
    const edgeConnections = [
      { from: 'MarkProcessingTask', to: 'ParallelAnalysis' },
      { from: 'ParallelAnalysis', to: 'PegasusTask' },
      { from: 'ParallelAnalysis', to: 'MarengoTask' },
      { from: 'PegasusTask', to: 'MergeResults' },
      { from: 'MarengoTask', to: 'MergeResults' },
      { from: 'MergeResults', to: 'WriteResultTask' },
      { from: 'WriteResultTask', to: 'ValidateTask' },
      { from: 'ValidateTask', to: 'ClusterTask' },
      { from: 'ClusterTask', to: 'EmitVideoAnalyzedEvent' },
    ];

    edgeConnections.forEach((conn) => {
      const fromStep = stepStatusMap.get(conn.from);
      const toStep = stepStatusMap.get(conn.to);
      const edgeStatus = fromStep?.status === 'failed' ? 'failed' : 'default';
      
      // Only create edge if both nodes exist
      const fromNodeExists = nodes.some(n => n.id === conn.from);
      const toNodeExists = nodes.some(n => n.id === conn.to);
      
      if (!fromNodeExists || !toNodeExists) {
        console.warn(`[ExecutionGraph] Skipping edge ${conn.from} -> ${conn.to}: nodes missing`);
        return;
      }

      edges.push({
        id: `${conn.from}-${conn.to}`,
        source: conn.from,
        target: conn.to,
        type: 'smoothstep',
        animated: toStep?.status === 'in_progress',
        style: {
          stroke: edgeStatus === 'failed' ? '#ef4444' : getStatusColor(toStep?.status || 'not_started'),
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edgeStatus === 'failed' ? '#ef4444' : getStatusColor(toStep?.status || 'not_started'),
        },
      });
    });

    return { nodes, edges };
  }, [steps]);

  const [nodes, setNodes, onNodesChange] = useNodesState(computedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(computedEdges);

  // Update nodes and edges when computed values change
  useEffect(() => {
    setNodes(computedNodes);
    setEdges(computedEdges);
  }, [computedNodes, computedEdges, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  if (steps.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border border-[var(--border-subtle)] rounded-lg bg-[var(--bg-soft)]">
        <p className="text-sm text-[var(--text-muted)]">No execution data available</p>
      </div>
    );
  }

  // Custom node component with tooltip
  const CustomNode = ({ data }: { data: any }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const context = data.context;
    const step = data.step;

    return (
      <div
        className="relative w-full h-full"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <Handle type="target" position={Position.Left} />
        <div className="w-full h-full">
          {data.label}
        </div>
        <Handle type="source" position={Position.Right} />
        {showTooltip && context && (
          <div
            className="absolute z-50 w-80 p-4 rounded-lg border shadow-xl pointer-events-none"
            style={{
              backgroundColor: 'var(--bg)',
              borderColor: 'var(--border-subtle)',
              left: 'calc(100% + 12px)',
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          >
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-xs font-semibold uppercase tracking-wide px-2 py-1 rounded"
                    style={{
                      backgroundColor: `${workflowStageColors[context.workflowStage]}20`,
                      color: workflowStageColors[context.workflowStage],
                    }}
                  >
                    {context.workflowStage}
                  </span>
                  {context.twelveLabsFunction && (
                    <span className="text-xs font-medium px-2 py-1 rounded bg-indigo-100 text-indigo-700">
                      TwelveLabs API
                    </span>
                  )}
                </div>
                <h4 className="font-semibold text-sm mb-1" style={{ color: 'var(--text)' }}>
                  {data.stepName}
                  {data.subtitle && (
                    <span className="font-normal text-xs ml-1" style={{ color: 'var(--text-muted)' }}>
                      - {data.subtitle}
                    </span>
                  )}
                </h4>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {data.stepType}
                </p>
              </div>
              
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                  Campaign Role
                </p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text)' }}>
                  {context.description}
                </p>
              </div>

              {context.twelveLabsFunction && (
                <div>
                  <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                    TwelveLabs Function
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text)' }}>
                    {context.twelveLabsFunction}
                  </p>
                </div>
              )}

              {context.modalities && (
                <div>
                  <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                    Modalities Analyzed
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {context.modalities.map((mod: string) => (
                      <span
                        key={mod}
                        className="text-[10px] px-2 py-0.5 rounded bg-[var(--accent-soft)] text-[var(--accent)]"
                      >
                        {mod}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                  Business Value
                </p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text)' }}>
                  {context.businessValue}
                </p>
              </div>

              {step?.startTime && step?.endTime && (
                <div>
                  <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                    Duration
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text)' }}>
                    {(() => {
                      const start = new Date(step.startTime).getTime();
                      const end = new Date(step.endTime).getTime();
                      const seconds = Math.round((end - start) / 1000);
                      if (seconds < 60) return `${seconds}s`;
                      return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
                    })()}
                  </p>
                </div>
              )}

              {/* TwelveLabs API Response Data */}
              {step?.twelveLabsData && (
                <div className="border-t border-[var(--border-subtle)] pt-3 mt-3">
                  <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text)' }}>
                    API Response Details
                  </p>
                  
                  {/* Pegasus Participation Data */}
                  {step.twelveLabsData.participation && (
                    <div className="mb-3">
                      <p className="text-[10px] font-medium mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                        Pegasus Results
                      </p>
                      <div className="space-y-1.5">
                        {step.twelveLabsData.participation.participationScore !== undefined && (
                          <div className="flex items-center justify-between">
                            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Score:</span>
                            <span className="text-[10px] font-semibold" style={{ color: 'var(--text)' }}>
                              {Math.round(step.twelveLabsData.participation.participationScore * 100)}%
                            </span>
                          </div>
                        )}
                        {step.twelveLabsData.participation.mentionsMilk !== undefined && (
                          <div className="flex items-center justify-between">
                            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Mentions Milk:</span>
                            <span className={`text-[10px] font-medium ${step.twelveLabsData.participation.mentionsMilk ? 'text-emerald-600' : 'text-gray-500'}`}>
                              {step.twelveLabsData.participation.mentionsMilk ? '✓ Yes' : '✗ No'}
                            </span>
                          </div>
                        )}
                        {step.twelveLabsData.participation.showsMilkObject !== undefined && (
                          <div className="flex items-center justify-between">
                            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Shows Object:</span>
                            <span className={`text-[10px] font-medium ${step.twelveLabsData.participation.showsMilkObject ? 'text-emerald-600' : 'text-gray-500'}`}>
                              {step.twelveLabsData.participation.showsMilkObject ? '✓ Yes' : '✗ No'}
                            </span>
                          </div>
                        )}
                        {step.twelveLabsData.participation.showsActionAligned !== undefined && (
                          <div className="flex items-center justify-between">
                            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Action Aligned:</span>
                            <span className={`text-[10px] font-medium ${step.twelveLabsData.participation.showsActionAligned ? 'text-emerald-600' : 'text-gray-500'}`}>
                              {step.twelveLabsData.participation.showsActionAligned ? '✓ Yes' : '✗ No'}
                            </span>
                          </div>
                        )}
                        {step.twelveLabsData.participation.highlights && step.twelveLabsData.participation.highlights.length > 0 && (
                          <div>
                            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                              Highlights: {step.twelveLabsData.participation.highlights.length} detected
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Marengo Embedding Data */}
                  {step.twelveLabsData.embedding && (
                    <div className="mb-3">
                      <p className="text-[10px] font-medium mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                        Marengo Results
                      </p>
                      <div className="space-y-1.5">
                        {step.twelveLabsData.embedding.dim && (
                          <div className="flex items-center justify-between">
                            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Dimension:</span>
                            <span className="text-[10px] font-semibold" style={{ color: 'var(--text)' }}>
                              {step.twelveLabsData.embedding.dim}D
                            </span>
                          </div>
                        )}
                        {step.twelveLabsData.embedding.vectorLength && (
                          <div className="flex items-center justify-between">
                            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Vector Length:</span>
                            <span className="text-[10px] font-semibold" style={{ color: 'var(--text)' }}>
                              {step.twelveLabsData.embedding.vectorLength}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Validation Data */}
                  {step.twelveLabsData.validation && (
                    <div className="mb-3">
                      <p className="text-[10px] font-medium mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                        Validation Results
                      </p>
                      <div className="space-y-1.5">
                        {step.twelveLabsData.validation.status && (
                          <div className="flex items-center justify-between">
                            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Status:</span>
                            <span className="text-[10px] font-semibold" style={{ color: 'var(--text)' }}>
                              {step.twelveLabsData.validation.status}
                            </span>
                          </div>
                        )}
                        {step.twelveLabsData.validation.validationScore !== undefined && (
                          <div className="flex items-center justify-between">
                            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Score:</span>
                            <span className="text-[10px] font-semibold" style={{ color: 'var(--text)' }}>
                              {Math.round(step.twelveLabsData.validation.validationScore * 100)}%
                            </span>
                          </div>
                        )}
                        {step.twelveLabsData.validation.reasons && step.twelveLabsData.validation.reasons.length > 0 && (
                          <div>
                            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                              Reasons: {step.twelveLabsData.validation.reasons.join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Clustering Data */}
                  {step.twelveLabsData.clustering && (
                    <div>
                      <p className="text-[10px] font-medium mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                        Clustering Results
                      </p>
                      <div className="space-y-1.5">
                        {step.twelveLabsData.clustering.mobId && (
                          <div className="flex items-center justify-between">
                            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Mob ID:</span>
                            <span className="text-[10px] font-mono font-semibold" style={{ color: 'var(--text)' }}>
                              {step.twelveLabsData.clustering.mobId}
                            </span>
                          </div>
                        )}
                        {step.twelveLabsData.clustering.method && (
                          <div className="flex items-center justify-between">
                            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Method:</span>
                            <span className="text-[10px] font-semibold" style={{ color: 'var(--text)' }}>
                              {step.twelveLabsData.clustering.method}
                            </span>
                          </div>
                        )}
                        {step.twelveLabsData.clustering.similarityScore !== undefined && (
                          <div className="flex items-center justify-between">
                            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Similarity:</span>
                            <span className="text-[10px] font-semibold" style={{ color: 'var(--text)' }}>
                              {Math.round(step.twelveLabsData.clustering.similarityScore * 100)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const nodeTypes = useMemo(() => ({
    default: CustomNode,
  }), []);

  return (
    <div className="w-full h-[600px] border border-[var(--border-subtle)] rounded-lg bg-[var(--bg)] relative">
      {/* Workflow Stage Legend */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-[var(--bg)]/95 backdrop-blur-sm border border-[var(--border-subtle)] rounded-lg px-3 py-2">
        <span className="text-xs font-medium text-[var(--text-muted)] mr-2">Workflow:</span>
        {['Identify', 'Validate', 'Segment', 'Explore'].map((stage) => (
          <span
            key={stage}
            className="text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded"
            style={{
              backgroundColor: `${workflowStageColors[stage]}20`,
              color: workflowStageColors[stage],
            }}
          >
            {stage}
          </span>
        ))}
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        className="bg-[var(--bg)]"
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const step = steps.find((s) => s.id === node.id);
            const isTwelveLabs = node.id === 'PegasusTask' || node.id === 'MarengoTask';
            if (isTwelveLabs) return '#6366f1'; // indigo for TwelveLabs
            return getStatusColor(step?.status || 'not_started');
          }}
          maskColor="var(--bg-soft)"
        />
      </ReactFlow>
    </div>
  );
}

