'use client';

import { useCallback, useMemo, useEffect } from 'react';
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
}

interface ExecutionGraphProps {
  steps: ExecutionStep[];
  executionStatus?: string;
}

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
    const horizontalSpacing = 250;
    const verticalSpacing = 150;

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Define the pipeline structure
    const pipelineStructure = [
      { id: 'MarkProcessingTask', name: 'Mark Processing', type: 'Lambda' },
      { id: 'ParallelAnalysis', name: 'Parallel Analysis', type: 'Parallel' },
      { id: 'PegasusTask', name: 'Pegasus', type: 'Lambda', parent: 'ParallelAnalysis' },
      { id: 'MarengoTask', name: 'Marengo', type: 'Lambda', parent: 'ParallelAnalysis' },
      { id: 'MergeResults', name: 'Merge Results', type: 'Pass' },
      { id: 'WriteResultTask', name: 'Write Results', type: 'Lambda' },
      { id: 'ValidateTask', name: 'Validate', type: 'Lambda' },
      { id: 'ClusterTask', name: 'Cluster', type: 'Lambda' },
      { id: 'EmitVideoAnalyzedEvent', name: 'Emit Event', type: 'EventBridge' },
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

      // Create node label with status indicator
      const nodeLabel = (
        <div className="text-center">
          <div className="font-semibold text-sm">{stepDef.name}</div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {stepDef.type}
          </div>
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
          },
          style: {
            width: nodeWidth,
            height: nodeHeight,
            border: `2px solid ${getStatusColor(status)}`,
            borderRadius: '8px',
            backgroundColor: 'var(--bg-soft)',
          },
        });
        x++;
      } else if (isParallel) {
        // Parallel branch nodes
        const branchX = (x - 1) * horizontalSpacing;
        const branchY = y * verticalSpacing + (stepDef.id === 'PegasusTask' ? -80 : 80);
        nodes.push({
          id: stepDef.id,
          type: 'default',
          position: { x: branchX, y: branchY },
          data: {
            label: nodeLabel,
          },
          style: {
            width: nodeWidth,
            height: nodeHeight,
            border: `2px solid ${getStatusColor(status)}`,
            borderRadius: '8px',
            backgroundColor: 'var(--bg-soft)',
          },
        });
      } else {
        // Regular sequential nodes
        nodes.push({
          id: stepDef.id,
          type: 'default',
          position: { x: x * horizontalSpacing, y: y * verticalSpacing },
          data: {
            label: nodeLabel,
          },
          style: {
            width: nodeWidth,
            height: nodeHeight,
            border: `2px solid ${getStatusColor(status)}`,
            borderRadius: '8px',
            backgroundColor: 'var(--bg-soft)',
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

  return (
    <div className="w-full h-[600px] border border-[var(--border-subtle)] rounded-lg bg-[var(--bg)]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        className="bg-[var(--bg)]"
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const step = steps.find((s) => s.id === node.id);
            return getStatusColor(step?.status || 'not_started');
          }}
          maskColor="var(--bg-soft)"
        />
      </ReactFlow>
    </div>
  );
}

