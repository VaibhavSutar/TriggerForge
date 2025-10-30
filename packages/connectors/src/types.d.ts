export interface ConnectorContext {
    state: Record<string, any>;
    input?: any;
    logs: string[];
}
export interface ConnectorResult {
    success: boolean;
    output: any;
}
export interface Connector {
    id: string;
    name: string;
    type?: string;
    run(ctx: ConnectorContext, config: Record<string, any>): Promise<ConnectorResult>;
}
