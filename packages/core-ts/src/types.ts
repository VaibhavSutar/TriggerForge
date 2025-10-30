export type NodeConfig = Record<string, any>;

export interface WorkflowNode {
  id: string;
  type: string; // "print", "http", etc.
  config?: NodeConfig;
  next?: string;
  data?: Record<string, any>;
}

export interface Workflow {
  id?: string;
  name?: string;
  userId: string;
  data?: Record<string, any>;
  nodes: WorkflowNode[];
  startNode?: string;
  edges?: Edge[];
}
export interface Edge {
  id: string;
  from: string;
  to: string;
  source: string;
  target: string;
}
export interface ExecutionResult {
  success: boolean;
  logs: string[];
  output?: any;
  error?: string;
}
