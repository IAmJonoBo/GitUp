import React from "react";
import ReactFlow, { Background, Edge, MarkerType, Node } from "reactflow";
import "reactflow/dist/style.css";
import { useStore } from "../../store";
import { Card } from "../ui/primitives";

const STYLE_BY_TYPE: Record<string, React.CSSProperties> = {
  init: {
    width: 110,
    fontSize: 12,
    borderRadius: 8,
    background: "#27272a",
    color: "#e4e4e7",
    border: "1px solid #3f3f46",
  },
  check: {
    width: 110,
    fontSize: 12,
    borderRadius: 8,
    background: "#27272a",
    color: "#e4e4e7",
    border: "1px solid #3f3f46",
  },
  create_file: {
    width: 120,
    fontSize: 12,
    borderRadius: 8,
    background: "#1e3a8a",
    color: "#bfdbfe",
    border: "1px solid #3b82f6",
  },
  install: {
    width: 120,
    fontSize: 12,
    borderRadius: 8,
    background: "#312e81",
    color: "#c7d2fe",
    border: "1px solid #6366f1",
  },
  quality: {
    width: 120,
    fontSize: 12,
    borderRadius: 8,
    background: "#065f46",
    color: "#a7f3d0",
    border: "1px solid #10b981",
  },
  complete: {
    width: 120,
    fontSize: 12,
    borderRadius: 8,
    background: "#14532d",
    color: "#bbf7d0",
    border: "1px solid #22c55e",
  },
};

const EDGE_STYLE = { stroke: "#71717a" } as const;

export const WorkflowGraph = () => {
  const changePlan = useStore((state) => state.changePlan);

  const { nodes, edges } = React.useMemo(() => {
    const nodesValue: Node[] = changePlan.operations.map(
      (operation, index) => ({
        id: operation.id,
        position: { x: 40 + index * 150, y: 60 },
        data: {
          label:
            operation.type === "create_file"
              ? `Create: ${operation.target?.split("/").pop() ?? "file"}`
              : operation.type,
        },
        style: STYLE_BY_TYPE[operation.type] ?? STYLE_BY_TYPE.check,
      }),
    );

    const edgesValue: Edge[] = changePlan.operations
      .slice(1)
      .map((operation, index) => ({
        id: `e-${changePlan.operations[index].id}-${operation.id}`,
        source: changePlan.operations[index].id,
        target: operation.id,
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: EDGE_STYLE,
      }));

    return { nodes: nodesValue, edges: edgesValue };
  }, [changePlan.operations]);

  return (
    <Card className="h-[200px] border border-white/10 bg-zinc-900 overflow-hidden relative">
      <div className="absolute top-2 left-3 z-10 text-xs font-bold text-zinc-500 uppercase tracking-wider">
        ChangePlan Workflow
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        attributionPosition="bottom-right"
      >
        <Background color="#3f3f46" gap={16} />
      </ReactFlow>
    </Card>
  );
};
