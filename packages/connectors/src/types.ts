export interface ConnectorContext {
  state: Record<string, any>;
  input?: any;
  item?: any; // [NEW] Added for loop iteration context
  logs: any[];
  services?: Record<string, any>; // [NEW] injected services
}

export interface ConnectorResult {
  success: boolean;
  output: any;
  error?: string;
}

export interface Connector {
  id: string;
  name: string;
  type?: string;
  run(ctx: ConnectorContext, config: Record<string, any>): Promise<ConnectorResult>;
}
