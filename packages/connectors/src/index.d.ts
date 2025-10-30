import type { Connector } from "./types.js";
/** Base registry: keys are our canonical ids (lowercase, no spaces, no hyphens/underscores). */
export declare const connectors: Record<string, Connector>;
/** Public API */
export declare function registerConnector(connector: Connector): void;
export default function hasConnector(type: string): boolean;
export declare function getConnector(type: string): Connector | undefined;
export declare function listConnectors(): Connector[];
export * from "./types.js";
