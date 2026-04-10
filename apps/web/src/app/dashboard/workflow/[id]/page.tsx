"use client";

import React, { useCallback, useState, useEffect } from "react";
import { Shield, X } from "lucide-react";
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
import { ExecutionHistory } from "@/components/workflow/ExecutionHistory";
import type { ConnectorManifest } from "@/app/types/workflow";
import { LOCAL_STORAGE_KEYS } from "@/config/constants";
import { WorkflowAssistant } from "@/components/workflow/WorkflowAssistant";
import { WORKFLOW_TEMPLATES } from "@/data/templates";
import { Walkthrough, WalkthroughStep } from "@/components/workflow/Walkthrough";

const walkthroughSteps: WalkthroughStep[] = [
  {
    target: '[data-tour="toolbar-main"]',
    title: 'Welcome to TriggerForge',
    content: "This is the main editor toolbar where you can manage your workflow. Let's take a quick tour.",
    position: 'bottom',
  },
  {
    target: '[data-tour="assistant-toggle"]',
    title: 'AI Assistant',
    content: 'Click here to open our intelligent AI Assistant. It can help you build workflows instantly from templates or using natural language.',
    position: 'bottom',
  },
  {
    target: '[data-tour="add-node-btn"]',
    title: 'Add Node',
    content: 'Manually add new action nodes, triggers, or integrations to your workflow canvas.',
    position: 'bottom',
  },
  {
    target: '[data-tour="run-workflow-btn"]',
    title: 'Run & Test',
    content: 'Ready? Hit this button to execute your workflow and see live results in the console.',
    position: 'bottom',
  },
  {
    target: '[data-tour="save-workflow-btn"]',
    title: 'Save Changes',
    content: 'Always make sure to save your work! Your workflows are stored securely in the cloud.',
    position: 'bottom',
  }
];

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
    position: n.position || { x: 0, y: 0 },
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
  const [showHistory, setShowHistory] = useState(false);
  const [executionId, setExecutionId] = useState<string | null>(null);

  // Add state for assistant & walkthrough
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isWalkthroughOpen, setIsWalkthroughOpen] = useState(false);
  const [connectors, setConnectors] = useState<ConnectorManifest[]>([]);
  const [isLoadingConnectors, setIsLoadingConnectors] = useState(false);

  // Fetch connectors for AI RAG
  useEffect(() => {
    setIsLoadingConnectors(true);
    fetch("/api/connectors")
      .then(res => res.json())
      .then(data => {
        if (data.items) {
          setConnectors(data.items.map((c: any) => ({
            id: c.id,
            title: c.name || c.id,
            kind: c.type || "action"
          })));
        }
      })
      .finally(() => setIsLoadingConnectors(false));
  }, []);

  // Add state for report
  const [showReportPanel, setShowReportPanel] = useState(false);
  const [reportData, setReportData] = useState<{ loading: boolean, error: string | null, report: any }>({
    loading: false,
    error: null,
    report: null
  });

  /* ----------------------------------
     Load workflow
  ----------------------------------- */
  const loadWorkflow = useCallback(async (id: string) => {
    const res = await fetch(`/api/workflows/${id}`);
    const data = await res.json();

    const wf = data?.workflow;
    if (!wf) {
      console.error("Workflow data missing:", data);
      return;
    }
    setWorkflowName(wf.name || "Untitled Workflow");

    const restoredNodes = (wf.json?.nodes ?? []).map((n: any) => ({
      ...n,
      type: "workflowNode",
      position: n.position || { x: 0, y: 0 },
      data: {
        ...n.data,
        workflowId: id, // Inject ID for webhook URL generation
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
          workflowId: workflowId,
        },
      };

      setNodes((nds) => [...nds, newNode]);
      setIsSidebarOpen(false);
    },
    [updateNodeData, workflowId]
  );

  const addTemplate = useCallback(
    (template: import("@/data/templates").WorkflowTemplate) => {
      console.log("[WorkflowEditor] addTemplate called with:", template);
      // 1. Generate a mapping from "template-id" to "real-id"
      const idMap = new Map<string, string>();
      const timestamp = Date.now();

      const newNodes: Node[] = template.nodes.map((tn, index) => {
        const realId = `node_${timestamp}_${index}`;
        idMap.set(tn.id, realId);

        return {
          id: realId,
          type: "workflowNode",
          position: (tn.position?.x !== undefined) ? tn.position : { x: 250, y: 100 * (index + 1) },
          data: {
            label: tn.label,
            nodeType: tn.connectorId,
            config: tn.config,
            onUpdate: updateNodeData,
            workflowId: workflowId,
          },
        };
      });

      // 2. Create connections based on mapping
      const newEdges: Edge[] = template.edges.map((te, index) => {
        const sourceId = idMap.get(te.source) || te.source;
        const targetId = idMap.get(te.target) || te.target;

        return {
          id: `edge_${timestamp}_${index}`,
          source: sourceId,
          target: targetId,
          sourceHandle: te.sourceHandle,
          targetHandle: te.targetHandle,
          animated: true,
          style: { stroke: "#6366f1", strokeWidth: 2 },
        };
      });

      // 3. Resolve internal references in config (e.g. {{$node.1.output}})
      // This is a simple replacements for {{ $node.OLD_ID... }} -> {{ $node.NEW_ID... }}
      newNodes.forEach((node) => {
        try {
          console.log("[WorkflowEditor] Processing config for node:", node.id);
          const configStr = JSON.stringify(node.data.config);
          const replacedConfigStr = configStr.replace(
            /\{\{\s*\$node\.(\w+)\./g,
            (match, oldId) => {
              const newId = idMap.get(oldId);
              return newId ? `{{$node.${newId}.` : match;
            }
          );
          node.data.config = JSON.parse(replacedConfigStr);
        } catch (err) {
          console.error("[WorkflowEditor] Error processing node config:", err);
          throw err;
        }
      });

      setNodes((nds) => [...nds, ...newNodes]);
      setEdges((eds) => [...eds, ...newEdges]);
      setIsSidebarOpen(false);
    },
    [updateNodeData, workflowId]
  );

  /* ----------------------------------
     SAVE WORKFLOW (IMPORTANT)
  ----------------------------------- */
  const saveWorkflow = useCallback(async (nodesToSave = nodes) => {
    if (!workflowId || !userId) return;

    const preparedNodes = applyEdgesToNodes(nodesToSave, edges);

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
     POLLING & UPDATE LOGIC
  ----------------------------------- */
  const processExecutionUpdate = useCallback((execution: any) => {
    const logs = execution.logs ?? [];
    const output = execution.output ?? null;

    // Reset or Initialize
    if (!logs.length) return;

    const nodeRunData: Record<string, { input?: any; output?: any; status?: 'success' | 'error' | 'RUNNING' }> = {};
    const labelMap = new Map(nodes.map(n => [n.id, n.data.label]));
    const newLogLines: string[] = ["▶️ [System] Starting workflow..."];

    logs.forEach((l: any) => {
      let timestamp = "Running...";
      let label = "System";
      let statusIcon = "ℹ️";
      let logColor = "text-gray-300";
      let message = "";

      if (typeof l === 'string') {
        message = l;
      } else {
        timestamp = new Date(l.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        label = labelMap.get(l.nodeId) || l.nodeId || "System";
        message = l.message;

        if (!nodeRunData[l.nodeId]) nodeRunData[l.nodeId] = { status: 'success' };

        if (l.message === "Execution started") {
          nodeRunData[l.nodeId].status = 'RUNNING';
          statusIcon = "⚡";
          logColor = "text-blue-400";
          if (l.data !== undefined) nodeRunData[l.nodeId].input = l.data;
        } else if (l.message === "Execution completed") {
          nodeRunData[l.nodeId].status = 'success';
          statusIcon = "✅";
          logColor = "text-green-400";
          if (l.data !== undefined) nodeRunData[l.nodeId].output = l.data;
        } else if (l.message === "Execution failed" || l.message === "Execution crashed") {
          nodeRunData[l.nodeId].status = 'error';
          statusIcon = "❌";
          logColor = "text-red-400";
          nodeRunData[l.nodeId].output = l.data;
        }
      }

      let logMsg = `[${timestamp}] ${statusIcon} [${label}] ${message}`;
      if (l && typeof l === 'object' && (l.message === "Execution failed" || l.message === "Execution crashed") && l.data) {
        const errMsg = typeof l.data === 'string' ? l.data : (l.data.message || JSON.stringify(l.data));
        logMsg += `: ${errMsg}`;
      }
      newLogLines.push(logMsg);
    });

    if (execution.status === 'SUCCEEDED') {
      newLogLines.push(`🏁 Workflow completed successfully at ${new Date().toLocaleTimeString()}`);
    } else if (execution.status === 'FAILED') {
      newLogLines.push(`🛑 Workflow failed at ${new Date().toLocaleTimeString()}`);
    }

    setRunLogs(newLogLines);
    if (output) setRunOutput(output);

    setNodes((nds) => nds.map((n) => {
      const d = nodeRunData[n.id];
      return d ? { ...n, data: { ...n.data, lastRun: { ...n.data.lastRun, ...d } } } : n;
    }));
  }, [nodes, setNodes]);

  // Polling Effect (Detects both manual and external triggers like Cron)
  useEffect(() => {
    if (!workflowId) return;

    let interval: NodeJS.Timeout;

    const poll = async () => {
      try {
        let targetId = executionId;

        if (!targetId) {
          // Check for any currently running or very recent executions
          const res = await fetch(`/api/execution/workflow/${workflowId}`);
          const data = await res.json();
          if (data.ok && data.executions?.length > 0) {
            const latest = data.executions[0];
            const createdTime = new Date(latest.createdAt).getTime();

            // If it's running, automatically switch to it
            // Or if it started in the last 15 seconds (to catch fresh background triggers)
            const isActive = latest.status === 'RUNNING' || latest.status === 'PENDING';
            const isFresh = Math.abs(Date.now() - createdTime) < 15000;

            if (isActive || (isFresh && !['SUCCEEDED', 'FAILED'].includes(latest.status))) {
              targetId = latest.id;
              setExecutionId(targetId);

              if (!isRunning && isActive) {
                setIsRunning(true);
                setShowRunPanel(true);
              }
            }
          }
        }

        if (targetId) {
          const res = await fetch(`/api/execution/${targetId}`);
          const data = await res.json();
          if (data.ok && data.execution) {
            processExecutionUpdate(data.execution);
            if (data.execution.status === 'SUCCEEDED' || data.execution.status === 'FAILED') {
              setIsRunning(false);
              setExecutionId(null);
            }
          }
        }
      } catch (e) {
        console.error("Polling error:", e);
      }
    };

    // Poll at 1s if running, 5s if idle (to detect external triggers)
    const intervalTime = isRunning ? 1000 : 5000;
    interval = setInterval(poll, intervalTime);
    if (isRunning) poll(); // Immediate if we manually triggered

    return () => clearInterval(interval);
  }, [isRunning, workflowId, executionId, processExecutionUpdate]);


  /* ----------------------------------
     RUN WORKFLOW
  ----------------------------------- */
  const runWorkflow = useCallback(async () => {
    if (!workflowId || !userId) return;

    setIsRunning(true);
    setExecutionId(null);
    setRunLogs(["▶️ Starting workflow..."]);
    setShowRunPanel(true);
    setRunOutput(null);

    // Clear previous node results
    const clearedNodes = nodes.map((n) => ({
      ...n,
      data: { ...n.data, lastRun: undefined }
    }));
    setNodes(clearedNodes);

    await saveWorkflow(clearedNodes);

    // Fire and forget (let polling handle UI updates), BUT await validation
    const r = await fetch(
      `/api/workflows/${workflowId}/run?userId=${userId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ triggeredFrom: "editor" }),
      }
    );

    // If request fails immediately
    if (!r.ok) {
      setIsRunning(false);
      alert("Failed to start workflow");
      return;
    }

    // The backend might finish fast, returning payload. 
    // We can use it for final consistency check.
    const data = await r.json();
    if (data.executionId) {
      setExecutionId(data.executionId);
    }

  }, [workflowId, userId, saveWorkflow, processExecutionUpdate]);

  const stopWorkflow = useCallback(async () => {
    if (!executionId) return;

    try {
      await fetch(`/api/execution/${executionId}/stop`, {
        method: "POST",
      });
      setRunLogs(prev => [...prev, "🛑 Stop request sent..."]);
    } catch (err) {
      console.error("Failed to stop:", err);
    }
  }, [executionId]);

  /* ----------------------------------
     EXPORT / IMPORT
  ----------------------------------- */
  const handleExport = useCallback(() => {
    const exportData = {
      nodes: nodes.map(n => ({
        ...n,
        selected: false,
        dragging: false,
        data: {
          ...n.data,
          lastRun: undefined, // Don't export execution data
          onUpdate: undefined // Don't export function refs
        }
      })),
      edges: edges.map(e => ({
        ...e,
        selected: false
      }))
    };

    const jsonStr = JSON.stringify(exportData, null, 2);
    navigator.clipboard.writeText(jsonStr).then(() => {
      alert("Workflow JSON copied to clipboard!");
    }).catch(err => {
      console.error("Failed to copy:", err);
      prompt("Copy this JSON:", jsonStr);
    });
  }, [nodes, edges]);

  const handleImport = useCallback(() => {
    const input = prompt("Paste Workflow JSON here:");
    if (!input) return;

    try {
      const data = JSON.parse(input);
      if (!Array.isArray(data.nodes)) throw new Error("Invalid JSON: 'nodes' array missing");

      const newNodes = data.nodes.map((n: any) => ({
        ...n,
        data: {
          ...n.data,
          onUpdate: updateNodeData // Re-attach handler
        }
      }));

      setNodes(newNodes);
      setEdges(data.edges || []);
      alert("Workflow imported successfully!");
    } catch (e: any) {
      alert("Import failed: " + e.message);
    }
  }, [setNodes, setEdges, updateNodeData]);

  const onModifyWorkflow = useCallback((newNodes: any[], newEdges: any[]) => {
    setNodes((currentNodes) => {
      const nodeMap = new Map(currentNodes.map(n => [n.id, n]));
      const nextNodes = [...currentNodes];

      newNodes.forEach(nn => {
        // Robust property normalization
        const id = nn.id || `node_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const label = nn.label || nn.title || nn.data?.label || "New Node";
        const nodeType = nn.nodeType || nn.type || nn.data?.nodeType || "http";
        const config = nn.config || nn.data?.config || {};

        const existing = nodeMap.get(id);
        if (existing) {
          const idx = nextNodes.findIndex(n => n.id === id);
          nextNodes[idx] = {
            ...existing,
            data: {
              ...existing.data,
              label,
              nodeType,
              config: { ...existing.data.config, ...config },
              onUpdate: updateNodeData
            },
            position: (nn.position?.x !== undefined) ? nn.position : existing.position
          };
        } else {
          nextNodes.push({
            id,
            type: "workflowNode",
            position: (nn.position?.x !== undefined) ? nn.position : { x: 400, y: 400 },
            data: {
              label,
              nodeType,
              config,
              onUpdate: updateNodeData,
              workflowId
            }
          });
        }
      });
      return nextNodes;
    });

    if (newEdges && newEdges.length > 0) {
      setEdges((currentEdges) => {
        const edgeMap = new Map(currentEdges.map(e => [e.id || `${e.source}->${e.target}`, e]));
        const nextEdges = [...currentEdges];

        newEdges.forEach(ne => {
          // Robust edge normalization
          const source = ne.source || ne.source_node_id || ne.from;
          const target = ne.target || ne.target_node_id || ne.to;

          // Hallucination safety: ReactFlow uses null for the default handle. 
          // AI often says "next" which doesn't exist.
          let sourceHandle = ne.sourceHandle || ne.source_handle;
          if (sourceHandle === "next") sourceHandle = null;

          let targetHandle = ne.targetHandle || ne.target_handle;
          if (targetHandle === "next") targetHandle = null;

          if (!source || !target) return;

          const id = ne.id || `${source}->${target}`;
          if (!edgeMap.has(id)) {
            nextEdges.push({
              id,
              source,
              target,
              sourceHandle,
              targetHandle,
              animated: true,
              style: { stroke: "#6366f1", strokeWidth: 2 }
            });
          }
        });
        return nextEdges;
      });
    }
  }, [updateNodeData, workflowId]);

  const onReplaceWorkflow = useCallback((newNodes: any[], newEdges: any[]) => {
    const timestamp = Date.now();
    const restoredNodes = newNodes.map((nn, i) => {
      const id = nn.id || `node_${timestamp}_${i}`;
      const label = nn.label || nn.title || nn.data?.label || "New Node";
      const nodeType = nn.nodeType || nn.type || nn.data?.nodeType || "http";
      const config = nn.config || nn.data?.config || {};

      return {
        id,
        type: "workflowNode",
        position: nn.position || { x: 250, y: 150 * (i + 1) },
        data: {
          label,
          nodeType,
          config,
          onUpdate: updateNodeData,
          workflowId
        }
      };
    });

    setNodes(restoredNodes);

    const restoredEdges = (newEdges || []).map((ne, i) => {
      const source = ne.source || ne.source_node_id || ne.from;
      const target = ne.target || ne.target_node_id || ne.to;

      let sourceHandle = ne.sourceHandle || ne.source_handle;
      if (sourceHandle === "next") sourceHandle = null;

      let targetHandle = ne.targetHandle || ne.target_handle;
      if (targetHandle === "next") targetHandle = null;

      return {
        id: ne.id || `edge_${timestamp}_${i}`,
        source,
        target,
        sourceHandle,
        targetHandle,
        animated: true,
        style: { stroke: "#6366f1", strokeWidth: 2 }
      };
    }).filter(e => e.source && e.target);

    setEdges(restoredEdges);
  }, [updateNodeData, workflowId]);

  return (
    <div className="h-screen w-full flex bg-[#0B0E14] relative text-white">
      <div className="flex-1">
        <WorkflowToolbar
          workflowName={workflowName}
          onSave={saveWorkflow}
          onAddNode={() => setIsSidebarOpen(true)}
          onNameChange={setWorkflowName}
          onRun={runWorkflow}
          onStop={stopWorkflow}
          isRunning={isRunning}
          onExport={handleExport}
          onImport={handleImport}
          onToggleAssistant={() => setIsAssistantOpen(!isAssistantOpen)}
          isAssistantOpen={isAssistantOpen}
          onToggleWalkthrough={() => setIsWalkthroughOpen(true)}
          onToggleHistory={() => {
            if (showReportPanel) setShowReportPanel(false);
            setShowHistory(!showHistory);
          }}
          isHistoryOpen={showHistory}
          onToggleReport={async () => {
            if (showHistory) setShowHistory(false);
            const isOpening = !showReportPanel;
            setShowReportPanel(isOpening);
            if (isOpening) {
              try {
                setReportData({ loading: true, error: null, report: null });
                const res = await fetch(`/api/ai/reports/${workflowId}`);
                const data = await res.json();
                if (data.ok) {
                  setReportData({ loading: false, error: null, report: data.report });
                } else {
                  setReportData({ loading: false, error: data.error || "Failed to load report", report: null });
                }
              } catch (e: any) {
                setReportData({ loading: false, error: e.message, report: null });
              }
            }
          }}
          isReportOpen={showReportPanel}
        />

        <Walkthrough
          isOpen={isWalkthroughOpen}
          onClose={() => setIsWalkthroughOpen(false)}
          steps={walkthroughSteps}
        />

        <WorkflowAssistant
          isOpen={isAssistantOpen}
          onClose={() => setIsAssistantOpen(false)}
          onAddTemplate={addTemplate}
          onModifyWorkflow={onModifyWorkflow}
          onReplaceWorkflow={onReplaceWorkflow}
          onRunWorkflow={runWorkflow}
          connectors={connectors}
          templates={WORKFLOW_TEMPLATES}
          nodes={nodes}
          edges={edges}
          logs={runLogs}
          isRunning={isRunning}
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
        onAddTemplate={addTemplate}
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

      {/* History Panel */}
      {showHistory && (
        <div className="absolute bottom-0 left-0 right-0 h-[40vh] z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.5)] flex flex-col">
          <div className="flex justify-between items-center bg-[#151C2F] px-4 py-2 border-t border-gray-800">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Parameters & History</span>
            <button onClick={() => setShowHistory(false)}><X className="w-4 h-4 text-gray-400 hover:text-white" /></button>
          </div>
          <ExecutionHistory workflowId={workflowId} />
        </div>
      )}

      {/* Safety Report Panel */}
      {showReportPanel && (
        <div className="absolute top-16 right-4 w-96 max-h-[80vh] bg-[#151C2F] border border-gray-800 rounded-lg shadow-2xl z-30 flex flex-col overflow-hidden">
          <div className="flex justify-between items-center px-4 py-3 border-b border-gray-800 bg-[#0B0E14]">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-400" />
              <span className="font-semibold text-white">Trust & Ethics Report</span>
            </div>
            <button onClick={() => setShowReportPanel(false)}><X className="w-4 h-4 text-gray-400 hover:text-white" /></button>
          </div>

          <div className="p-4 overflow-y-auto flex-1 text-sm">
            {reportData.loading && (
              <div className="flex flex-col items-center justify-center p-8 space-y-4">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-400">Analyzing logs and generating report...</p>
              </div>
            )}

            {reportData.error && (
              <div className="p-4 bg-red-900/20 border border-red-500/50 rounded text-red-400">
                <p className="font-semibold mb-1">Failed to load report</p>
                <p className="text-xs font-mono">{reportData.error}</p>
              </div>
            )}

            {!reportData.loading && !reportData.error && reportData.report && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#0B0E14] p-4 rounded-lg border border-gray-800 flex flex-col items-center justify-center text-center">
                    <span className="text-3xl font-bold text-white mb-1">{reportData.report.totalRuns}</span>
                    <span className="text-xs text-gray-400 uppercase tracking-wider">Total Runs</span>
                  </div>
                  <div className={`bg-[#0B0E14] p-4 rounded-lg border border-gray-800 flex flex-col items-center justify-center text-center ${reportData.report.flaggedRuns > 0 ? "border-red-500/50" : ""}`}>
                    <span className={`text-3xl font-bold mb-1 ${reportData.report.flaggedRuns > 0 ? "text-red-400" : "text-green-400"}`}>
                      {reportData.report.flaggedRuns}
                    </span>
                    <span className="text-xs text-gray-400 uppercase tracking-wider">Flagged Issues</span>
                  </div>
                </div>

                <div className="bg-[#0B0E14] p-4 rounded-lg border border-gray-800 mb-4 flex flex-col items-center">
                  <span className="text-4xl font-bold text-blue-400 mb-2">
                    {reportData.report.totalRuns === 0 ? "N/A" : `${(reportData.report.avgScore * 100).toFixed(0)}%`}
                  </span>
                  <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: reportData.report.totalRuns === 0 ? '0%' : `${reportData.report.avgScore * 100}%` }}></div>
                  </div>
                  <span className="text-xs text-gray-400 uppercase tracking-wider">Average Safety Score</span>
                </div>

                <p className="text-xs text-gray-500 text-center">
                  Generated at: {new Date(reportData.report.generatedAt).toLocaleString()}
                </p>

                <div className="mt-4 p-3 bg-blue-900/10 border border-blue-500/20 rounded text-xs text-blue-200">
                  <strong>Governance Note:</strong> This report acts as a compliance artifact for Trust & Ethics. It aggregates all AI node interactions for this workflow.
                </div>
              </div>
            )}

            {!reportData.loading && !reportData.error && !reportData.report && (
              <div className="text-gray-500 text-center p-4">No report data available yet. Try running the workflow first.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
