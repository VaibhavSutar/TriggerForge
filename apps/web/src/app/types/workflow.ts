export type ConnectorManifest = {
  id: string;               // e.g. "http", "delay"
  title: string;            // e.g. "HTTP"
  kind: "trigger" | "action";
  defaultConfig: Record<string, any>;
};
