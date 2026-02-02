import {
  Connector,
  ConnectorContext,
  ConnectorResult,
} from "./types";
import { getConnector } from "@triggerforge/connectors";

/* ----------------------------------
   Get Connector by Node Type
----------------------------------- */
export function getConnectorByType(type: string): Connector | undefined {
  return getConnector(type);
}

