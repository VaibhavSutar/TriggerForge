"use client";

import React, { useCallback, useState, useEffect } from 'react';
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
} from 'reactflow';
import 'reactflow/dist/style.css';
import { WorkflowNode } from '@/components/workflow/WorkflowNode';
import { WorkflowToolbar } from '@/components/workflow/WorkflowToolbar';
import { NodeSidebar } from '@/components/workflow/NodeSidebar';

const nodeTypes: NodeTypes = {
  workflowNode: WorkflowNode,
};

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'workflowNode',
    position: { x: 250, y: 100 },
    data: { 
      label: 'Start Trigger',
      nodeType: 'trigger',
      config: { event: 'manual' }
    },
  },
];

const initialEdges: Edge[] = [];

export default function WorkflowEditor({ params }: { params: Promise<{ id: string }> }) {
  const [workflowId, setWorkflowId] = useState<string>('');
  const [workflowName, setWorkflowName] = useState<string>('Untitled Workflow');
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Resolve params Promise
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setWorkflowId(resolvedParams.id);
      setWorkflowName(`Workflow ${resolvedParams.id}`);
    };
    resolveParams();
  }, [params]);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge({
      ...params,
      animated: true,
      style: { stroke: '#6366f1', strokeWidth: 2 },
    }, eds)),
    [setEdges],
  );

  const updateNodeData = useCallback((nodeId: string, newData: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...newData } } : node
      )
    );
  }, [setNodes]);

  const addNode = useCallback((nodeType: string) => {
    const nodeConfig = {
      trigger: { event: 'manual' },
      print: { message: 'Hello World!' },
      delay: { ms: 1000 },
      condition: { expression: '{{input}} > 0' },
      random: { min: 1, max: 10 },
      http: { url: 'https://api.example.com', method: 'GET' },
      email: { to: '', subject: '', body: '' },
      database: { query: 'SELECT * FROM table', connection: '' },
    };

    const newNode: Node = {
      id: `node_${Date.now()}`,
      type: 'workflowNode',
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 300 + 200,
      },
      data: {
        label: nodeType.charAt(0).toUpperCase() + nodeType.slice(1),
        nodeType: nodeType,
        config: nodeConfig[nodeType as keyof typeof nodeConfig] || {},
        onUpdate: updateNodeData,
      },
    };
    setNodes((nds) => nds.concat(newNode));
    setIsSidebarOpen(false);
  }, [setNodes, updateNodeData]);

  // Update existing nodes to include the update function
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onUpdate: updateNodeData,
        },
      }))
    );
  }, [updateNodeData, setNodes]);

  const saveWorkflow = useCallback(async () => {
    if (!workflowId) return;
    
    const workflowData = {
      id: workflowId,
      name: workflowName,
      nodes,
      edges,
    };
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workflow/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workflowData),
      });
      
      if (response.ok) {
        console.log('Workflow saved successfully');
      }
    } catch (error) {
      console.error('Error saving workflow:', error);
    }
  }, [workflowId, workflowName, nodes, edges]);

  const runWorkflow = useCallback(async () => {
    if (!workflowId) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workflow/run/${workflowId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Workflow executed:', result);
      }
    } catch (error) {
      console.error('Error running workflow:', error);
    }
  }, [workflowId]);

  // Show loading state while params are being resolved
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
    <div className="h-screen w-full flex bg-white">
      <div className="flex-1 relative">
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
    </div>
  );
}