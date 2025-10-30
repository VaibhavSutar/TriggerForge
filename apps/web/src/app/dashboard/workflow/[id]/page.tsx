"use client";

import React, { useCallback, useState, useEffect } from "react";
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
export default function WorkflowEditor({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [workflowId, setWorkflowId] = useState<string>("");
  const [workflowName, setWorkflowName] = useState<string>("Untitled Workflow");
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Run log panel states
  const [runLogs, setRunLogs] = useState<string[]>([]);
  const [runOutput, setRunOutput] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showRunPanel, setShowRunPanel] = useState(false);

  // 🧩 Fetch workflow from backend
  const loadWorkflow = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/workflows/${id}`);
      if (!res.ok) throw new Error("Failed to load workflow");

      const data = await res.json();
      if (!data?.ok || !data?.workflow) throw new Error("Invalid workflow data");

      const wf = data.workflow;

      setWorkflowName(wf.name ?? `Workflow ${wf.id}`);

      // restore nodes & edges from DB JSON
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
      console.log("✅ Loaded workflow:", wf);
    } catch (err) {
      console.error("❌ Error loading workflow:", err);
    }
  }, [setNodes, setEdges]);

  // Resolve params and load workflow
  useEffect(() => {
    (async () => {
      const { id } = await params;
      setWorkflowId(id);
      await loadWorkflow(id);
    })();
  }, [params, loadWorkflow]);

  // Read userId from localStorage
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
    [setEdges]
  );

  const updateNodeData = useCallback(
    (nodeId: string, newData: any) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, ...newData } }
            : node
        )
      );
    },
    [setNodes]
  );

  const addNode = useCallback(
    (connectorId: string, manifest?: ConnectorManifest) => {
      const cfg = manifest?.defaultConfig ?? {};
      const title =
        manifest?.title ??
        connectorId.charAt(0).toUpperCase() + connectorId.slice(1);

      const newNode: Node = {
        id: `node_${Date.now()}`,
        type: "workflowNode",
        position: {
          x: Math.random() * 400 + 100,
          y: Math.random() * 300 + 200,
        },
        data: {
          label: title,
          nodeType: connectorId,
          config: { ...cfg },
          onUpdate: updateNodeData,
        },
      };

      setNodes((nds) => nds.concat(newNode));
      setIsSidebarOpen(false);
    },
    [setNodes, updateNodeData]
  );

  // ensure all nodes carry onUpdate
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: { ...node.data, onUpdate: updateNodeData },
      }))
    );
  }, [updateNodeData, setNodes]);

  // ✅ Save workflow with proper node type transformation
  const saveWorkflow = useCallback(async () => {
    if (!workflowId) return;
    if (!userId) {
      alert("User ID is required to save the workflow.");
      return;
    }

    const preparedNodes = nodes.map((n) => ({
      id: n.id,
      type: n.data.nodeType,
      data: n.data,
      position: n.position,
    }));

    const payload = {
      id: workflowId,
      userId,
      name: workflowName,
      nodes: preparedNodes,
      edges,
    };

    try {
      const r = await fetch(`/api/workflows`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await r.json();
      if (r.ok && data?.ok) {
        console.log("✅ Workflow saved:", data.workflow?.id ?? workflowId);
      } else {
        console.error("❌ Save failed:", data);
        alert(data?.error ?? "Save failed");
      }
    } catch (e) {
      console.error("Error saving workflow:", e);
    }
  }, [workflowId, workflowName, nodes, edges, userId]);

  // 🚀 Run workflow with n8n-style logs panel
  const runWorkflow = useCallback(async () => {
    if (!workflowId) return;
    try {
      setIsRunning(true);
      setRunLogs(["▶️ Starting workflow run..."]);
      setShowRunPanel(true);

      await saveWorkflow();

      const r = await fetch(`/api/workflows/${workflowId}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, triggeredFrom: "editor" }),
      });

      const data = await r.json();
      setIsRunning(false);

      if (!r.ok || !data?.ok) {
        console.error("❌ Run failed:", data);
        setRunLogs((prev) => [
          ...prev,
          "❌ Run failed.",
          data?.error ?? "Unknown error",
        ]);
        alert(data?.error ?? "Run failed");
        return;
      }

      const logs = data?.result?.logs ?? [];
      const output = data?.result?.output ?? data?.result;

      setRunLogs((prev) => [...prev, ...logs, "✅ Workflow completed."]);
      setRunOutput(output);

      console.log("▶️ Run result:", data.result);
    } catch (e) {
      console.error("Error running workflow:", e);
      setRunLogs((prev) => [
        ...prev,
        "❌ Exception occurred: " + String(e),
      ]);
      setIsRunning(false);
    }
  }, [workflowId, userId, saveWorkflow]);

  if (!workflowId) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Loading workflow...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex bg-white relative">
      <div className="flex-1 relative">
        <WorkflowToolbar
          workflowName={workflowName} // ✅ bound correctly
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
          className="bg-white"
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          minZoom={0.2}
          maxZoom={2}
        >
          <Controls
            className="bg-white border border-gray-200 rounded-lg shadow-lg"
            showInteractive={false}
          />
          <MiniMap
            className="bg-white border border-gray-200 rounded-lg shadow-lg"
            maskColor="rgba(0, 0, 0, 0.1)"
            nodeColor="#6366f1"
          />
          <Background
            variant={BackgroundVariant.Dots}
            gap={16}
            size={2}
            color="#9ca3af"
          />
        </ReactFlow>
      </div>

      <NodeSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onAddNode={addNode}
      />

      {/* 🧭 Run Output / Logs Panel */}
      {showRunPanel && (
        <div className="absolute bottom-0 left-0 right-0 bg-gray-900 text-gray-100 p-3 border-t border-gray-700 max-h-[40vh] overflow-y-auto font-mono text-sm">
          <div className="flex justify-between items-center mb-2">
            <div className="font-semibold text-green-400">
              {isRunning ? "⚙️ Running Workflow..." : "🧩 Workflow Run Logs"}
            </div>
            <button
              onClick={() => setShowRunPanel(false)}
              className="text-gray-400 hover:text-gray-200 text-xs"
            >
              Close
            </button>
          </div>

          <div className="space-y-1">
            {runLogs.map((line, i) => (
              <div key={i} className="whitespace-pre-wrap">
                {line}
              </div>
            ))}
          </div>

          {runOutput && (
            <div className="mt-3 border-t border-gray-700 pt-2">
              <div className="font-semibold text-blue-400 mb-1">🧾 Output:</div>
              <pre className="text-xs bg-gray-800 p-2 rounded-md overflow-x-auto">
                {JSON.stringify(runOutput, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
