export type NodeConfig = Record<string, any>;

export interface WorkflowNode {
  id: string;
  type: string; // "print", "http", etc.
  config?: NodeConfig;
  next?: string;
}

export interface Workflow {
  id?: string;
  name?: string;
  nodes: WorkflowNode[];
  startNode?: string;
}

export interface ExecutionResult {
  success: boolean;
  logs: string[];
  output?: any;
  error?: string;
}
