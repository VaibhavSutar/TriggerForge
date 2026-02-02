export interface ConnectorContext {
    state: Record<string, any>;
    input?: any;
    logs: any[];
    services?: Record<string, any>;
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
