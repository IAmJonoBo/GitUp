import React from 'react';
import ReactFlow, { Background, Node, Edge, MarkerType } from 'reactflow';
import 'reactflow/dist/style.css';
import { useStore } from '../../store';
import { Card } from '../ui/primitives';

const BASE_NODE_STYLE = {
  width: 100,
  fontSize: 12,
  borderRadius: 8,
  background: '#27272a',
  color: '#e4e4e7',
  border: '1px solid #3f3f46',
} as const;

const BUILD_NODE_STYLE = {
  width: 100,
  fontSize: 12,
  borderRadius: 8,
  background: '#1e3a8a',
  color: '#bfdbfe',
  border: '1px solid #3b82f6',
} as const;

const RELEASE_NODE_STYLE = {
  width: 100,
  fontSize: 12,
  borderRadius: 8,
  background: '#064e3b',
  color: '#a7f3d0',
  border: '1px solid #10b981',
} as const;

const EDGE_STYLE = { stroke: '#71717a' } as const;

export const WorkflowGraph = () => {
  const config = useStore((state) => state.config);

  const { nodes, edges } = React.useMemo(() => {
    const builtNodes: Node[] = [
      { id: '1', position: { x: 50, y: 50 }, data: { label: 'Checkout' }, style: BASE_NODE_STYLE },
      { id: '2', position: { x: 200, y: 50 }, data: { label: 'Install' }, style: BASE_NODE_STYLE },
    ];
    const builtEdges: Edge[] = [
      { id: 'e1-2', source: '1', target: '2', animated: true, markerEnd: { type: MarkerType.ArrowClosed }, style: EDGE_STYLE },
    ];

    let lastX = 200;
    let lastId = 2;

    const addNode = (label: string, style: Node['style']) => {
      lastId += 1;
      lastX += 150;
      builtNodes.push({ id: String(lastId), position: { x: lastX, y: 50 }, data: { label }, style });
      builtEdges.push({
        id: `e${lastId - 1}-${lastId}`,
        source: String(lastId - 1),
        target: String(lastId),
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: EDGE_STYLE,
      });
    };

    if (config.quality.linter !== 'None') addNode('Lint', BASE_NODE_STYLE);
    if (config.ci.runTests) addNode('Test', BASE_NODE_STYLE);
    if (config.ci.buildArtifacts) addNode('Build', BUILD_NODE_STYLE);
    if (config.ci.automaticRelease) addNode('Release', RELEASE_NODE_STYLE);

    return { nodes: builtNodes, edges: builtEdges };
  }, [config.ci.automaticRelease, config.ci.buildArtifacts, config.ci.runTests, config.quality.linter]);

  return (
    <Card className="h-[200px] border border-white/10 bg-zinc-900 overflow-hidden relative">
      <div className="absolute top-2 left-3 z-10 text-xs font-bold text-zinc-500 uppercase tracking-wider">CI Pipeline Preview</div>
      <ReactFlow nodes={nodes} edges={edges} fitView attributionPosition="bottom-right">
        <Background color="#3f3f46" gap={16} />
      </ReactFlow>
    </Card>
  );
};
