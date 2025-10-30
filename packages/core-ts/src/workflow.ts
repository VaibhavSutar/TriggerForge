import { Workflow, ExecutionResult, WorkflowNode } from "./types.js";
import { getConnector } from "@triggerforge/connectors";

/**
 * Executes a workflow sequentially by following edges (ReactFlow-style).
 * Automatically traverses the directed graph starting from a "start" node.
 */
export async function executeWorkflow(
  workflow: Workflow,
  input?: any
): Promise<ExecutionResult> {
  const logs: string[] = [];
  const state: Record<string, any> = { input };
  let lastOutput: any;

  // Build node map
  const nodeMap = new Map<string, WorkflowNode>();
  for (const node of workflow.nodes) nodeMap.set(node.id, node);

  // Build adjacency list (source → [targets])
  const adjacency = new Map<string, string[]>();
  for (const edge of workflow.edges ?? []) {
    const targets = adjacency.get(edge.source) ?? [];
    targets.push(edge.target);
    adjacency.set(edge.source, targets);
  }

  // Find start node (prefer type "start" or data.nodeType = "start")
  const startNode =
    workflow.nodes.find(
      (n) => n.type === "start" || n.data?.nodeType === "start"
    ) ?? workflow.nodes[0];

  if (!startNode)
    return { success: false, logs: ["No start node found"], error: "No nodes found" };

  const queue: WorkflowNode[] = [startNode];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current.id)) continue;
    visited.add(current.id);

    try {
      logs.push(`Running node ${current.id} (${current.type})`);

      const connector = getConnector(current.type || current.data?.nodeType);
      if (!connector) throw new Error(`Unsupported node type: ${current.type}`);

      const config = current.config ?? current.data?.config ?? {};
      const { success, output } = await connector.run(
        { state, input, logs },
        config
      );

      if (!success) throw new Error(`Connector '${current.type}' failed`);

      state[current.id] = output;
      lastOutput = output;

      // Find connected next nodes from edges
      const nextIds = adjacency.get(current.id) ?? [];
      for (const nextId of nextIds) {
        const nextNode = nodeMap.get(nextId);
        if (nextNode && !visited.has(nextNode.id)) queue.push(nextNode);
      }
    } catch (err: any) {
      logs.push(`Error in node ${current.id}: ${err.message}`);
      return { success: false, logs, error: err.message, output: lastOutput };
    }
  }

  logs.push("Workflow complete");
  return { success: true, logs, output: lastOutput };
}

/**
 * Helper: run workflow from JSON string
 */
export async function executeWorkflowFromJson(
  json: string,
  input?: any
): Promise<ExecutionResult> {
  const workflow = JSON.parse(json) as Workflow;
  return executeWorkflow(workflow, input);
}
