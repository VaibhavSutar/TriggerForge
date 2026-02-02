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
): Promise<void> {
  const { id, type, config } = node;

  const input = config?.inputFrom
    ? context.nodeResults[config.inputFrom]
    : context.input;

  if (config?.inputFrom && input === undefined) {
    throw new Error(
      `Node "${id}" expected input from "${config.inputFrom}" but none found`
    );
  }

  // Expression Resolution
  // We expose a "$node" object that map nodeIDs -> output
  // e.g. {{ $node["trigger"].data.event }}
  const view: any = {
    $node: context.nodeResults,
    // also expose flattened previous input as "state" or "previous" if convenient
    previous: input,
    input: input,
  };

  // Recursively resolve config
  const resolvedConfig = resolveExpressions(config, view);

  const connector = getConnectorByType(type);
  if (!connector) {
    throw new Error(`No connector registered for node type "${type}"`);
  }

  context.logs.push({
    nodeId: id,
    message: "Execution started",
    data: input,
    timestamp: Date.now(),
  });

  const result: NodeExecutionResult = await connector.run(
    { input, logs: context.logs, services: context.services, state: context.state },
    resolvedConfig
  );

  if (!result.success) {
    context.logs.push({
      nodeId: id,
      message: "Execution failed",
      data: result.error,
      timestamp: Date.now(),
    });
    throw new Error(result.error || "Node execution failed");
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
    "input =",
    JSON.stringify(input)
  );

}

/* ----------------------------------
   Core executor (ordered nodes)
----------------------------------- */
export async function executeWorkflow(
  workflow: Workflow,
  input: any,
  services: Record<string, any> = {}
): Promise<ExecutionResult> {
  const context: WorkflowContext = {
    input,
    nodeResults: {},
    logs: [],
    services,
    state: {},
  };

  for (const node of workflow.nodes) {
    await executeNode(node, context);
  }

  return {
    success: true,
    context,
  };
}

/* ----------------------------------
   Execute from editor JSON (NEW SOURCE OF TRUTH)
----------------------------------- */
export async function executeWorkflowFromJson(
  workflowJson: {
    id?: string;
    nodes: WorkflowNode[];
    edges?: any[];
  },
  input: any,
  services: Record<string, any> = {}
): Promise<ExecutionResult> {
  if (!workflowJson || !Array.isArray(workflowJson.nodes)) {
    throw new Error("Invalid workflow JSON: nodes missing");
  }

  // ⚠️ IMPORTANT:
  // For now we assume nodes are already ordered.
  // Later this is where edge-based ordering will go.
  const workflow: Workflow = {
    id: workflowJson.id ?? "runtime-workflow",
    nodes: workflowJson.nodes,
  };

  // Topological Sort
  const nodeMap = new Map(workflow.nodes.map((n) => [n.id, n]));
  const sortedNodes: WorkflowNode[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  function visit(nodeId: string) {
    if (visited.has(nodeId)) return;
    if (visiting.has(nodeId)) {
      throw new Error(`Circular dependency detected at node ${nodeId}`);
    }

    visiting.add(nodeId);

    const node = nodeMap.get(nodeId);
    if (node) {
      if (node.config?.inputFrom) {
        visit(node.config.inputFrom);
      }
      sortedNodes.push(node);
    }

    visiting.delete(nodeId);
    visited.add(nodeId);
  }

  for (const node of workflow.nodes) {
    visit(node.id);
  }

  workflow.nodes = sortedNodes;

  return executeWorkflow(workflow, input, services);
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
        const rendered = Mustache.render(config, view);
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
