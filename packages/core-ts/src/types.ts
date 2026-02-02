// types.ts

export type NodeId = string;
export type NodeType = string;

/* ----------------------------------
   Workflow Context (shared state)
----------------------------------- */
export interface WorkflowContext {
  input: any;
  state: Record<string, any>;
  nodeResults: Record<string, any>;
  logs: {
    nodeId: string;
    message: string;
    data?: any;
    timestamp: number;
  }[];
  services?: Record<string, any>; // [NEW] Dependency injection
}

/* ----------------------------------
   Logs
----------------------------------- */
export interface WorkflowLog {
  nodeId: NodeId;
  message: string;
  data?: any;
  timestamp: number;
}

/* ----------------------------------
   Node Config
----------------------------------- */
export interface NodeConfig {
  inputFrom?: NodeId; // previous node ID
  [key: string]: any;
}

/* ----------------------------------
   Node Execution Result
----------------------------------- */
export interface NodeExecutionResult {
  success: boolean;
  output?: any;
  error?: string;
}

/* ----------------------------------
   Node Definition
----------------------------------- */
export interface WorkflowNode {
  id: string;
  type: string;
  config: {
    inputFrom?: string;
    [key: string]: any;
  };
}


/* ----------------------------------
   Connector Interfaces
----------------------------------- */
export interface ConnectorContext {
  input: any;
  state: Record<string, any>;
  logs: WorkflowLog[];
  services?: Record<string, any>; // [NEW] Access to services
}

export interface ConnectorResult {
  success: boolean;
  output?: any;
  error?: string;
}

export interface Connector {
  id: string;
  name: string;
  run(ctx: ConnectorContext, config: any): Promise<ConnectorResult>;
}

/* ----------------------------------
   Workflow Definition
----------------------------------- */
export interface Workflow {
  id: string;
  nodes: WorkflowNode[];
}

/* ----------------------------------
   Execution Result
----------------------------------- */
export interface ExecutionResult {
  success: boolean;
  context: WorkflowContext;
}
