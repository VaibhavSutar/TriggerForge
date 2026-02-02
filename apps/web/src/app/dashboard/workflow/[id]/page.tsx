"use client";

import React, { useCallback, useState, useEffect } from "react";
import { X } from "lucide-react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  NodeTypes,
  ConnectionMode,
} from "reactflow";
import "reactflow/dist/style.css";

import { WorkflowNode } from "@/components/workflow/WorkflowNode";
import { WorkflowToolbar } from "@/components/workflow/WorkflowToolbar";
import { NodeSidebar } from "@/components/workflow/NodeSidebar";
import type { ConnectorManifest } from "@/app/types/workflow";
import { LOCAL_STORAGE_KEYS } from "@/config/constants";

const nodeTypes: NodeTypes = { workflowNode: WorkflowNode };
const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

/* ----------------------------------
   Helper: edges → config.inputFrom
----------------------------------- */
function applyEdgesToNodes(nodes: Node[], edges: Edge[]) {
  const inputFromMap = new Map<string, string>();

  edges.forEach((e) => {
    if (e.source && e.target) {
      inputFromMap.set(e.target, e.source);
    }
  });

  return nodes.map((n) => ({
    id: n.id,
    type: n.data.nodeType,
    position: n.position,
    data: n.data,
    config: {
      ...(n.data?.config ?? {}),
      inputFrom: inputFromMap.get(n.id),
    },
  }));
}

export default function WorkflowEditor({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [workflowId, setWorkflowId] = useState("");
  const [workflowName, setWorkflowName] = useState("Untitled Workflow");
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [runLogs, setRunLogs] = useState<string[]>([]);
  const [runOutput, setRunOutput] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showRunPanel, setShowRunPanel] = useState(false);

  /* ----------------------------------
     Load workflow
  ----------------------------------- */
  const loadWorkflow = useCallback(async (id: string) => {
    const res = await fetch(`/api/workflows/${id}`);
    const data = await res.json();

    const wf = data.workflow;
    setWorkflowName(wf.name);

    const restoredNodes = (wf.json?.nodes ?? []).map((n: any) => ({
      ...n,
      type: "workflowNode",
      data: {
        ...n.data,
        onUpdate: updateNodeData,
      },
    }));

    setNodes(restoredNodes);
    setEdges(wf.json?.edges ?? []);
  }, []);

  useEffect(() => {
    (async () => {
      const { id } = await params;
      setWorkflowId(id);
      await loadWorkflow(id);
    })();
  }, [params, loadWorkflow]);

  useEffect(() => {
    const storedUser = localStorage.getItem(LOCAL_STORAGE_KEYS.USER);
    if (storedUser) setUserId(storedUser);
  }, []);

  const onConnect = useCallback(
    (p: Edge | Connection) =>
      setEdges((eds) =>
        addEdge(
          { ...p, animated: true, style: { stroke: "#6366f1", strokeWidth: 2 } },
          eds
        )
      ),
    []
  );

  const updateNodeData = useCallback((nodeId: string, newData: any) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...newData } } : n
      )
    );
  }, []);

  const addNode = useCallback(
    (connectorId: string, manifest?: ConnectorManifest) => {
      const newNode: Node = {
        id: `node_${Date.now()}`,
        type: "workflowNode",
        position: { x: 200, y: 200 },
        data: {
          label: manifest?.title ?? connectorId,
          nodeType: connectorId,
          config: manifest?.defaultConfig ?? {},
          onUpdate: updateNodeData,
        },
      };

      setNodes((nds) => [...nds, newNode]);
      setIsSidebarOpen(false);
    },
    [updateNodeData]
  );

  /* ----------------------------------
     SAVE WORKFLOW (IMPORTANT)
  ----------------------------------- */
  const saveWorkflow = useCallback(async () => {
    if (!workflowId || !userId) return;

    const preparedNodes = applyEdgesToNodes(nodes, edges);

    await fetch(`/api/workflows`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: workflowId,
        userId,
        name: workflowName,
        nodes: preparedNodes,
        edges,
      }),
    });
  }, [workflowId, workflowName, nodes, edges, userId]);

  /* ----------------------------------
     RUN WORKFLOW
  ----------------------------------- */
  const runWorkflow = useCallback(async () => {
    if (!workflowId || !userId) return;

    setIsRunning(true);
    setRunLogs(["▶️ Starting workflow..."]);
    setShowRunPanel(true);

    await saveWorkflow();

    const r = await fetch(
      `/api/workflows/${workflowId}/run?userId=${userId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ triggeredFrom: "editor" }),
      }
    );

    const data = await r.json();
    setIsRunning(false);

    const logs = data?.result?.context?.logs ?? [];
    const output = data?.result?.context?.nodeResults ?? null;

    setRunLogs((prev) => [
      ...prev,
      ...logs.map(
        (l: any) =>
          `[${l.nodeId}] ${l.message} ${l.data ? JSON.stringify(l.data) : ""
          }`
      ),
      "✅ Workflow completed",
    ]);

    setRunOutput(output);
  }, [workflowId, userId, saveWorkflow]);

  if (!workflowId) return null;


  return (
    <div className="h-screen w-full flex bg-[#0B0E14] relative text-white">
      <div className="flex-1">
        <WorkflowToolbar
          workflowName={workflowName}
          onSave={saveWorkflow}
          onAddNode={() => setIsSidebarOpen(true)}
          onNameChange={setWorkflowName}
          onRun={runWorkflow}
        />

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          className="bg-[#0B0E14]"
        >
          <MiniMap style={{ background: '#151C2F', border: '1px solid #1f2937' }} nodeColor="#3D5CFF" />
          {/* <Controls style={{ background: '#151C2F', border: '1px solid #1f2937', fill: 'white' }} /> */}
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#374151" />
        </ReactFlow>
      </div>

      <NodeSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onAddNode={addNode}
      />

      {showRunPanel && (
        <div className="absolute bottom-0 left-0 right-0 bg-[#151C2F] border-t border-gray-800 text-white flex flex-col max-h-[40vh] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)]">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-[#151C2F]">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Run Logs</span>
            <button
              onClick={() => setShowRunPanel(false)}
              className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-3 overflow-y-auto font-mono text-xs">
            {runLogs.map((l, i) => (
              <div key={i} className="text-gray-300 mb-1">{l}</div>
            ))}
            {runOutput && (
              <pre className="mt-2 bg-[#0B0E14] border border-gray-800 p-2 rounded text-green-400">
                {JSON.stringify(runOutput, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
