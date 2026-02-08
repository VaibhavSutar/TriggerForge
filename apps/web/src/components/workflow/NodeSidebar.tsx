"use client";

import { useEffect, useMemo, useState } from "react";
import type { ConnectorManifest } from "@/app/types/workflow";

export function NodeSidebar({
  isOpen,
  onClose,
  onAddNode,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAddNode: (connectorId: string, manifest?: ConnectorManifest) => void;
}) {
  const [connectors, setConnectors] = useState<ConnectorManifest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch connectors from backend
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);

    fetch("/api/connectors", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        console.log("Fetched connectors:", data);

        if (!res.ok) throw new Error(data?.error || "Failed to fetch connectors");

        // ✅ Normalize data into expected shape
        const mapped: ConnectorManifest[] = (data.items || []).map((c: any) => ({
          id: c.id,
          title: c.name || c.title || c.id,
          kind:
            c.type === "trigger"
              ? "trigger"
              : c.type === "action"
                ? "action"
                : "action", // treat unknown as action
          defaultConfig: c.defaultConfig || {},
        }));

        setConnectors(mapped);
      })
      .catch((err) => {
        console.error("Connector fetch failed:", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [isOpen]);

  // Fallback if API fails
  const fallbackConnectors: ConnectorManifest[] = useMemo(
    () => [
      { id: "trigger", title: "Start Trigger", kind: "trigger", defaultConfig: { event: "manual" } },
      { id: "print", title: "Print", kind: "action", defaultConfig: { message: "Hello World!" } },
      { id: "delay", title: "Delay", kind: "action", defaultConfig: { ms: 1000 } },
      { id: "delay", title: "Delay", kind: "action", defaultConfig: { ms: 1000 } },
      { id: "http", title: "HTTP Request", kind: "action", defaultConfig: { url: "https://api.example.com", method: "GET" } },
      { id: "ai", title: "AI Text Gen", kind: "action", defaultConfig: { prompt: "Explain quantum physics", model: "gpt-4o" } },
      { id: "mcp_tool", title: "MCP Tool Call", kind: "action", defaultConfig: { serverName: "filesystem", toolName: "list_files", args: {} } },
      { id: "google_gmail", title: "Gmail: Send", kind: "action", defaultConfig: { to: "user@example.com", subject: "Hello", body: "Message" } },
    ],
    []
  );

  const list = connectors.length > 0 ? connectors : fallbackConnectors;

  if (!isOpen) return null;

  return (
    <aside className="w-80 border-l border-gray-800 bg-[#151C2F] p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-white">Add Node</h3>
        <button
          onClick={onClose}
          className="text-sm text-gray-400 hover:text-gray-200"
        >
          Close
        </button>
      </div>

      {loading && <p className="text-sm text-gray-400">Loading connectors...</p>}
      {error && <p className="text-sm text-red-400">⚠️ {error}</p>}

      {!loading && !error && (
        <div className="space-y-3">
          {/* Triggers */}
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Triggers</div>
            {list
              .filter((m) => m.kind === "trigger")
              .map((m) => (
                <button
                  key={m.id}
                  className="w-full text-left px-3 py-2 rounded border border-gray-800 hover:bg-[#0B0E14] hover:border-gray-700 transition-colors mb-2"
                  onClick={() => onAddNode(m.id, m)}
                >
                  <div className="font-medium text-gray-200">{m.title}</div>
                  <div className="text-xs text-gray-500">{m.id}</div>
                </button>
              ))}
          </div>

          {/* Actions */}
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Actions</div>
            {list
              .filter((m) => m.kind === "action")
              .map((m) => (
                <button
                  key={m.id}
                  className="w-full text-left px-3 py-2 rounded border border-gray-800 hover:bg-[#0B0E14] hover:border-gray-700 transition-colors mb-2"
                  onClick={() => onAddNode(m.id, m)}
                >
                  <div className="font-medium text-gray-200">{m.title}</div>
                  <div className="text-xs text-gray-500">{m.id}</div>
                </button>
              ))}
          </div>
        </div>
      )}
    </aside>
  );
  
}
