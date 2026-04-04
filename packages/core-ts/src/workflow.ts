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
  context: WorkflowContext,
  iterationResults: Record<string, any> = {}
): Promise<NodeExecutionResult> {
  const { id, config } = node;
  const type = node.type === "workflowNode" ? node.data?.nodeType : node.type;

  const currentInput = context.input;

  /* ----------------------------------
   Create Enhanced View for Mustache
   ----------------------------------- */
  // Merge global results with iteration-specific results
  const combinedResults = { ...context.nodeResults, ...iterationResults };

  const view: any = {
    $node: combinedResults,
    item: context.item || currentInput,
    previous: currentInput,
    input: currentInput,
    state: context.state,
    env: process.env,
  };

  // Add Label-based access to $node
  if (context.nodeLabels) {
    for (const [nid, label] of Object.entries(context.nodeLabels)) {
      if (combinedResults[nid] !== undefined) {
        view.$node[label] = combinedResults[nid];
      }
    }
  }

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
      {
        input: currentInput,
        item: context.item,
        logs: context.logs,
        services: context.services,
        state: context.state
      },
      resolvedConfig
    );

    // Sanitize logs...
    for (let i = 0; i < context.logs.length; i++) {
      if (typeof context.logs[i] === 'string') {
        context.logs[i] = { nodeId: id, message: context.logs[i] as any, timestamp: Date.now() };
      }
    }

    if (!result.success) {
      context.logs.push({ nodeId: id, message: "Execution failed", data: result.error, timestamp: Date.now() });
      return result;
    }

    const nodeOutput = result.output;
    let storedResult: any;
    if (typeof nodeOutput === 'object' && nodeOutput !== null) {
      if (Array.isArray(nodeOutput)) {
        storedResult = nodeOutput;
        (storedResult as any).output = nodeOutput;
      } else {
        storedResult = { ...nodeOutput, output: nodeOutput };
      }
    } else {
      storedResult = { output: nodeOutput, value: nodeOutput };
    }

    // Update global results AND iteration results
    context.nodeResults[id] = storedResult;
    iterationResults[id] = storedResult;

    context.logs.push({
      nodeId: id,
      message: "Execution completed",
      data: result.output,
      timestamp: Date.now(),
    });

    return result;
  } catch (err: any) {
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
    const type = node.type === "workflowNode" ? node.data?.nodeType : node.type;
    const isTrigger = ["trigger", "webhook", "cron", "start"].includes(type);
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
  // We'll use a queue of { nodeId, inputPayload, item, iterationResults }.
  const execQueue: { nodeId: string; input: any; item?: any; iterationResults: Record<string, any> }[] =
    queue.map(id => ({ nodeId: id, input: initialInput, iterationResults: {} }));

  while (execQueue.length > 0) {
    const { nodeId, input: currentInput, item, iterationResults } = execQueue.shift()!;
    const node = nodeMap.get(nodeId);
    if (!node) continue;

    const nodeType = node.data?.nodeType || node.type;

    // Pass everything to executeNode
    const nodeContext: WorkflowContext = { ...context, input: currentInput, item };
    const result = await executeNode(node, nodeContext, iterationResults);

    if (!result.success) continue;

    if (callbacks?.onNodeFinish) await callbacks.onNodeFinish(nodeId, result.output);

    const outEdges = adjList.get(nodeId) || [];

    if (nodeType === "condition") {
      const res = result.output;
      const isTrue = res && typeof res === 'object' && 'passed' in res ? res.passed : !!res;
      const nextInput = res && typeof res === 'object' && 'data' in res ? res.data : res;

      for (const edge of outEdges) {
        const nextIterationResults = { ...iterationResults }; // Snapshot
        if (edge.sourceHandle === "true" || edge.sourceHandle === "a") {
          if (isTrue) execQueue.push({ nodeId: edge.target, input: nextInput, item, iterationResults: nextIterationResults });
        } else if (edge.sourceHandle === "false" || edge.sourceHandle === "b") {
          if (!isTrue) execQueue.push({ nodeId: edge.target, input: nextInput, item, iterationResults: nextIterationResults });
        } else {
          if (isTrue) execQueue.push({ nodeId: edge.target, input: nextInput, item, iterationResults: nextIterationResults });
        }
      }
    } else if (nodeType === "loop") {
      let items = result.output;
      if (Array.isArray(items)) {
        for (const loopItem of items) {
          for (const edge of outEdges) {
            execQueue.push({
              nodeId: edge.target,
              input: loopItem,
              item: loopItem,
              iterationResults: { ...iterationResults } // Start isolated body
            });
          }
        }
      } else {
        for (const edge of outEdges) {
          execQueue.push({ nodeId: edge.target, input: items, item, iterationResults: { ...iterationResults } });
        }
      }
    } else {
      for (const edge of outEdges) {
        execQueue.push({ nodeId: edge.target, input: result.output, item, iterationResults: { ...iterationResults } });
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
        // Pre-process bracket notation like [0] or ["key"] into .0 or .key
        // to make them compatible with Mustache paths.
        const localView = { ...view };
        if (localView.$node) localView.$node = { ...localView.$node };

        const preprocessed = config.replace(
          /\[["']?([^"'\]]+)["']?\]/g,
          (match, key) => {
            // If the key is a node ID or label, ensure it's in the local view for easy access
            if (view.$node && view.$node[key] !== undefined) {
              // No need for a random ref, just ensuring key is reachable
            }
            return "." + key;
          }
        );

        // Deep clone function to override toString on objects and arrays
        function stringifyObjects(obj: any): any {
          if (obj === null || typeof obj !== "object") return obj;

          if (Array.isArray(obj)) {
            const arr = [...obj].map(item => stringifyObjects(item));
            // Add a toString that returns the JSON representation
            (arr as any).toString = () => JSON.stringify(obj);
            return arr;
          } else {
            const clone: any = { ...obj };
            // Ensure properties which are objects/arrays are also processed
            for (const key in clone) {
              if (Object.prototype.hasOwnProperty.call(clone, key)) {
                clone[key] = stringifyObjects(clone[key]);
              }
            }
            // Add a toString that returns the JSON representation
            // This allows {{variable}} to output a JSON string for complex objects
            clone.toString = () => JSON.stringify(obj);
            return clone;
          }
        }

        const stringifiedView = stringifyObjects(localView);

        // We temporarily intercept Mustache escape logic during THIS render call to guarantee JSON string output
        const originalEscape = Mustache.escape;
        Mustache.escape = function (text) { return text; };

        const rendered = Mustache.render(preprocessed, stringifiedView);

        Mustache.escape = originalEscape;
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
