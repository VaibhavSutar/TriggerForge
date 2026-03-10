// workflow.ts

import {
  Workflow,
  WorkflowContext,
  ExecutionResult,
  WorkflowNode,
  NodeExecutionResult,
} from "./types";
import { getConnectorByType } from "./connectors";
import Mustache from "mustache";

// Disable Mustache HTML escaping to keep JSON raw
Mustache.escape = function (text) {
  return text;
};

/* ----------------------------------
   Execute a single node
----------------------------------- */
async function executeNode(
  node: WorkflowNode,
  context: WorkflowContext
): Promise<NodeExecutionResult> {
  const { id, type, config } = node;

  // 1. Resolve Inputs
  // In a graph traversal, "input" is what triggers the node.
  // But we might also want to access specific data from previous nodes via variables.
  // The 'context.input' here is the specific input passed to this node (e.g. from the edge),
  // OR the global input if it's a trigger.

  // For now, we use the accumulating context.nodeResults for variables.
  // The direct input to the run function is the data passed from the *previous* node.
  // But since a node can have multiple parents, 'input' is ambiguous in the generic sense.
  // We'll rely on the context.lastOutput OR the specific edge data.

  // Let's use the 'input' from the context which we set before calling this.
  const currentInput = context.input;

  /* ----------------------------------
   Create Enhanced View for Mustache
   ----------------------------------- */
  const view: any = {
    $node: { ...context.nodeResults },
    previous: currentInput,
    input: currentInput,
    state: context.state,
    env: process.env,
  };

  // Add Label-based access to $node
  if (context.nodeLabels) {
    for (const [nid, label] of Object.entries(context.nodeLabels)) {
      if (context.nodeResults[nid] !== undefined) {
        // Normalize label to be safe for Mustache (optional, but good practice)
        // For now, we assume the user accesses it via ["Label"] format in valid JS,
        // but Mustache {{ $node.Label }} requires a valid identifier.
        // We'll trust the safe substitution logic or map access.
        view.$node[label] = context.nodeResults[nid];
      }
    }
  }

  // Debug View
  // console.log("Resolving config with view keys:", Object.keys(view));

  const resolvedConfig = resolveExpressions(config, view);

  const connector = getConnectorByType(type);
  if (!connector) {
    throw new Error(`No connector registered for node type "${type}"`);
  }

  context.logs.push({
    nodeId: id,
    message: "Execution started",
    data: currentInput,
    timestamp: Date.now(),
  });

  try {
    const result: NodeExecutionResult = await connector.run(
      { input: currentInput, logs: context.logs, services: context.services, state: context.state },
      resolvedConfig
    );

    if (!result.success) {
      context.logs.push({
        nodeId: id,
        message: "Execution failed",
        data: result.error,
        timestamp: Date.now(),
      });
      // We return the failure result but don't throw, so the engine can decide to stop or handle error paths
      return result;
    }

    context.nodeResults[id] = result.output;

    context.logs.push({
      nodeId: id,
      message: "Execution completed",
      data: result.output,
      timestamp: Date.now(),
    });
    console.log(
      "[ENGINE]",
      id,
      `(${type})`,
      "completed"
    );

    return result;
  } catch (err: any) {
    console.error(`[ENGINE] Node ${id} crashed:`, err);
    context.logs.push({
      nodeId: id,
      message: "Execution crashed",
      data: err.message,
      timestamp: Date.now(),
    });
    return { success: false, error: err.message };
  }
}

/* ----------------------------------
   Core executor (Graph Traversal)
----------------------------------- */
export async function executeWorkflow(
  workflow: Workflow,
  input: any,
  services: Record<string, any> = {},
  initialState: Record<string, any> = {}
): Promise<ExecutionResult> {
  // This function is kept for backward compatibility but redirecting to JSON executor is preferred
  // if edges are missing. But 'Workflow' type doesn't have edges.
  // We'll perform a linear execution here as fallback.
  const context: WorkflowContext = {
    input,
    nodeResults: {},
    logs: [],
    services,
    state: initialState,
    nodeLabels: {},
  };

  for (const node of workflow.nodes) {
    if (node.data?.label) context.nodeLabels![node.id] = node.data.label;
  }

  for (const node of workflow.nodes) {
    context.input = input; // Basic linear pass
    await executeNode(node, context);
  }

  return { success: true, context };
}

/* ----------------------------------
   Execute from editor JSON (NEW ENGINE)
----------------------------------- */
export async function executeWorkflowFromJson(
  workflowJson: {
    id?: string;
    nodes: WorkflowNode[];
    edges?: any[];
  },
  initialInput: any,
  services: Record<string, any> = {},
  initialState: Record<string, any> = {},
  callbacks?: {
    onNodeStart?: (nodeId: string, input: any) => Promise<void>;
    onNodeFinish?: (nodeId: string, output: any) => Promise<void>;
    onNodeError?: (nodeId: string, error: any) => Promise<void>;
  }
): Promise<ExecutionResult> {
  if (!workflowJson || !Array.isArray(workflowJson.nodes)) {
    throw new Error("Invalid workflow JSON: nodes missing");
  }

  const nodes = workflowJson.nodes;
  const edges = workflowJson.edges || [];

  const context: WorkflowContext = {
    input: initialInput,
    nodeResults: {},
    logs: [],
    services,
    state: { ...initialState, workflowId: workflowJson.id }, // Inject workflow ID
    nodeLabels: {},
  };

  // 1. Build Lookup Maps
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const adjList = new Map<string, any[]>(); // sourcenode -> edges

  for (const edge of edges) {
    if (!adjList.has(edge.source)) adjList.set(edge.source, []);
    adjList.get(edge.source)!.push(edge);
  }

  // 2. Populate Labels
  for (const node of nodes) {
    if (node.data?.label) {
      context.nodeLabels![node.id] = node.data.label;
    }
  }

  // 3. Find Start Nodes
  // Nodes with no incoming edges OR specific Trigger nodes
  const incomingEdgeCount = new Map<string, number>();
  for (const edge of edges) {
    incomingEdgeCount.set(edge.target, (incomingEdgeCount.get(edge.target) || 0) + 1);
  }

  const queue: string[] = [];

  // Priority: "trigger", "webhook", "schedule" types are starts.
  // OR nodes with 0 incoming edges.
  for (const node of nodes) {
    const isTrigger = ["trigger", "webhook", "cron", "start"].includes(node.type);
    if (isTrigger) {
      queue.push(node.id);
    } else if (!incomingEdgeCount.has(node.id)) {
      // Also add orphans (or manual starts)
      // queue.push(node.id);
    }
  }

  // If no triggers found, fallback to 0-incoming
  if (queue.length === 0) {
    for (const node of nodes) {
      if (!incomingEdgeCount.has(node.id)) queue.push(node.id);
    }
  }

  // 4. BFS Traversal
  const visited = new Set<string>(); // node execution tracking? 
  // actually in a workflow, we might visit nodes multiple times if multiple branches merge? 
  // For now, let's assume DAG and simple execution. 
  // To handle Merge correctly, we should wait for all dependencies. 
  // But a simpler approach for this agentic request: Queue based.

  // We need to track *inputs* to nodes.
  // When a node finishes, it "fires" data to its children.
  // We'll use a queue of { nodeId, inputPayload }.
  const execQueue: { nodeId: string; input: any }[] = queue.map(id => ({ nodeId: id, input: initialInput }));

  const executedNodes = new Set<string>();

  while (execQueue.length > 0) {
    const { nodeId, input } = execQueue.shift()!;

    const node = nodeMap.get(nodeId);
    if (!node) continue;

    // Update context input for this node execution
    context.input = input;

    if (callbacks?.onNodeStart) await callbacks.onNodeStart(nodeId, input);
    console.log(`[ENGINE] Running ${nodeId} (${node.type})`);
    const result = await executeNode(node, context);

    executedNodes.add(nodeId);

    if (!result.success) {
      if (callbacks?.onNodeError) await callbacks.onNodeError(nodeId, result.error);
      console.warn(`[ENGINE] Node ${nodeId} failed. Stopping branch.`);
      continue;
    }

    if (callbacks?.onNodeFinish) await callbacks.onNodeFinish(nodeId, result.output);

    // Determine Next Nodes
    const outEdges = adjList.get(nodeId) || [];

    if (node.type === "condition") {
      // BRANCHING LOGIC
      // Condition output should be boolean (or truthy/falsy)
      const isTrue = !!result.output;

      for (const edge of outEdges) {
        // Check edge handle
        // We assume 'sourceHandle' is 'true' or 'false' (or 'a'/'b') 
        // If standard handle (null/undefined), we treat as True path?
        // Let's look for standard patterns.

        if (edge.sourceHandle === "true" || edge.sourceHandle === "a") {
          if (isTrue) execQueue.push({ nodeId: edge.target, input: result.output });
        } else if (edge.sourceHandle === "false" || edge.sourceHandle === "b") {
          if (!isTrue) execQueue.push({ nodeId: edge.target, input: result.output });
        } else {
          // Default handle -> treat as Pass Through (runs always? or only if true?)
          // Usually standard handle runs if success.
          // For condition, standard handle might be ambiguous.
          // Let's assume if it's a condition node, we MUST match handle.
          // If edge has NO handle id, maybe it's an old edge.
          // Default to: Run if true.
          if (isTrue) execQueue.push({ nodeId: edge.target, input: result.output });
        }
      }
    } else if (node.type === "loop" || node.data?.nodeType === "loop") {
      // LOOP LOGIC
      let items = result.output;
      if (typeof items === "string") {
        try { items = JSON.parse(items); } catch { }
      }
      if (Array.isArray(items)) {
        for (const item of items) {
          for (const edge of outEdges) {
            execQueue.push({ nodeId: edge.target, input: item });
          }
        }
      } else {
        console.warn(`[ENGINE] Loop node ${nodeId} output is not an array. Falling back to normal flow.`);
        for (const edge of outEdges) {
          execQueue.push({ nodeId: edge.target, input: items });
        }
      }
    } else {
      // NORMAL FLOW
      // Pass output to all children
      for (const edge of outEdges) {
        execQueue.push({ nodeId: edge.target, input: result.output });
      }
    }
  }

  return { success: true, context };
}

/* ----------------------------------
   Backward-compatible alias
----------------------------------- */
export async function runWorkflowFromJson(
  workflowJson: any,
  input: any
): Promise<ExecutionResult> {
  return executeWorkflowFromJson(workflowJson, input, {});
}

/* ----------------------------------
   Helper: Resolve Expressions (Recursively)
----------------------------------- */
function resolveExpressions(config: any, view: any): any {
  if (typeof config === "string") {
    // Check if it looks like a template
    if (config.includes("{{")) {
      try {
        // Pre-process safe keys
        const nodeMap: Record<string, string> = {};
        let counter = 0;

        const preprocessed = config.replace(
          /\[["']([^"']+)["']\]/g,
          (match, key) => {
            // 1. If strict match in view (best case)
            // We check $node
            if (view.$node && view.$node[key] !== undefined) {
              const safeKey = `__REF_${counter++}`;
              nodeMap[safeKey] = key;
              return `.${safeKey}`;
            }
            // 2. Fallback: might be accessing other properties 
            return "." + key;
          }
        );

        // Augment view with safe keys locally
        const localView = { ...view };
        if (localView.$node) localView.$node = { ...localView.$node }; // shallow copy node object

        for (const [safe, original] of Object.entries(nodeMap)) {
          if (localView.$node) {
            localView.$node[safe] = localView.$node[original];
          }
        }

        const rendered = Mustache.render(preprocessed, localView);
        return rendered;
      } catch (err) {
        console.warn(`[Expression] Failed to resolve "${config}":`, err);
        return config; // fallback to raw
      }
    }
    return config;
  }

  if (Array.isArray(config)) {
    return config.map((item) => resolveExpressions(item, view));
  }

  if (config !== null && typeof config === "object") {
    const next: any = {};
    for (const key in config) {
      next[key] = resolveExpressions(config[key], view);
    }
    return next;
  }

  return config;
}
