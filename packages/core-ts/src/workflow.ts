import { Workflow, ExecutionResult, WorkflowNode } from "./types.js";
import { getConnector } from "@triggerforge/connectors";

/**
 * Executes a workflow sequentially.
 * Input can be passed in; available as state.input
 */
export async function executeWorkflow(
  workflow: Workflow,
  input?: any
): Promise<ExecutionResult> {
  const logs: string[] = [];
  const state: Record<string, any> = { input };
  let lastOutput: any;

  const index = new Map<string, WorkflowNode>();
  for (const node of workflow.nodes) index.set(node.id, node);

  let current = workflow.startNode ? index.get(workflow.startNode) : workflow.nodes[0];
  if (!current) return { success: false, logs: ["No starting node"], error: "No nodes found" };

  while (current) {
    try {
      logs.push(`Running node ${current.id} (${current.type})`);

      const connector = getConnector(current.type);
      if (!connector) throw new Error(`Unsupported node type: ${current.type}`);

      const { success, output } = await connector.run(
        { state, input, logs },
        current.config ?? {}
      );

      if (!success) throw new Error(`Connector '${current.type}' failed`);

      state[current.id] = output;
      lastOutput = output;

      // Handle next node
      if (!current.next) {
        logs.push("Workflow complete");
        break;
      }

      const nextId = current.next;
      const nextNode = index.get(nextId);
      if (!nextNode) throw new Error(`Next node '${nextId}' not found`);

      current = nextNode;
    } catch (err: any) {
      logs.push(`Error in node ${current?.id ?? "unknown"}: ${err.message}`);
      return { success: false, logs, error: err.message, output: lastOutput };
    }
  }

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
