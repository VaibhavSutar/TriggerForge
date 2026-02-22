"use client";

import { useEffect, useMemo, useState } from "react";
import type { ConnectorManifest } from "@/app/types/workflow";
import { WORKFLOW_TEMPLATES, WorkflowTemplate } from "@/data/templates";
import { Plus, LayoutTemplate, Box, Sparkles, Send } from "lucide-react";

export function NodeSidebar({
  isOpen,
  onClose,
  onAddNode,
  onAddTemplate,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAddNode: (connectorId: string, manifest?: ConnectorManifest) => void;
  onAddTemplate?: (template: WorkflowTemplate) => void;
}) {
  const [activeTab, setActiveTab] = useState<"nodes" | "templates" | "ai">("nodes");
  const [connectors, setConnectors] = useState<ConnectorManifest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // AI State
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    console.log("[NodeSidebar] Starting AI generation with prompt:", prompt);
    try {
      const userId = localStorage.getItem("triggerforge_user_id") || "test-user-id";
      console.log("[NodeSidebar] Sending request API...");
      const res = await fetch("/api/ai/generate-workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, userId }),
      });
      console.log("[NodeSidebar] Response status:", res.status);

      if (!res.ok) {
        const text = await res.text();
        console.error("[NodeSidebar] API Error Response:", text);
        throw new Error(`API Error ${res.status}: ${text.substring(0, 100)}`);
      }

      const data = await res.json();
      console.log("[NodeSidebar] Response data:", data);

      if (data.ok && data.workflow) {
        // Wrap in template structure
        console.log("[NodeSidebar] Constructing template...");
        const template: WorkflowTemplate = {
          id: `ai-gen-${Date.now()}`,
          name: "AI Generated Workflow",
          description: prompt,
          nodes: data.workflow.nodes,
          edges: data.workflow.edges
        };
        console.log("[NodeSidebar] Calling onAddTemplate...", template);
        onAddTemplate?.(template);
        console.log("[NodeSidebar] onAddTemplate returned.");
        if (onClose) onClose();
      } else {
        alert("Failed to generate: " + (data.error || "Unknown error"));
      }
    } catch (e: any) {
      console.error("[NodeSidebar] Generation error:", e);
      alert("Error: " + e.message);
    } finally {
      setIsGenerating(false);
    }
  };

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
      { id: "start", title: "Start Trigger", kind: "trigger", defaultConfig: { event: "manual" } },
      { id: "webhook", title: "Webhook", kind: "trigger", defaultConfig: { payload: {} } },
      { id: "cron", title: "Schedule (Cron)", kind: "trigger", defaultConfig: { expression: "* * * * *" } },
      { id: "print", title: "Print", kind: "action", defaultConfig: { message: "Hello World!" } },
      { id: "delay", title: "Delay", kind: "action", defaultConfig: { ms: 1000 } },
      { id: "http", title: "HTTP Request", kind: "action", defaultConfig: { url: "https://api.example.com", method: "GET" } },
      { id: "ai", title: "AI Text Gen", kind: "action", defaultConfig: { prompt: "Explain quantum physics", model: "gpt-4o" } },
      { id: "mcp_tool", title: "MCP Tool Call", kind: "action", defaultConfig: { serverName: "filesystem", toolName: "list_files", args: {} } },
      { id: "google_gmail", title: "Gmail: Send", kind: "action", defaultConfig: { to: "user@example.com", subject: "Hello", body: "Message" } },

      // RAG & Agent Nodes
      { id: "google_drive_trigger", title: "Google Drive Trigger", kind: "trigger", defaultConfig: { folderId: "" } },
      { id: "google_drive", title: "Google Drive", kind: "action", defaultConfig: { operation: "download", fileId: "" } },
      { id: "text_splitter", title: "Text Splitter", kind: "action", defaultConfig: { chunkSize: 1000, chunkOverlap: 200 } },
      { id: "gemini", title: "Google Gemini", kind: "action", defaultConfig: { operation: "chat", model: "gemini-pro", input: "" } },
      { id: "pinecone", title: "Pinecone", kind: "action", defaultConfig: { operation: "upsert", indexName: "my-index", vectors: [] } },
      { id: "vector_store_tool", title: "Vector Store Tool", kind: "action", defaultConfig: { name: "search_docs", description: "Search docs" } },
      { id: "memory_window", title: "Chat Memory", kind: "action", defaultConfig: { operation: "add", windowSize: 5 } },
      { id: "agent", title: "AI Agent", kind: "action", defaultConfig: { goal: "Answer user question", tools: [] } },
    ],
    []
  );

  const list = connectors.length > 0 ? connectors : fallbackConnectors;

  if (!isOpen) return null;

  return (
    <aside className="w-80 border-l border-gray-800 bg-[#151C2F] flex flex-col h-full shadow-2xl z-50 fixed right-0 top-0 bottom-0">
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <h3 className="font-semibold text-white">Library</h3>
        <button
          onClick={onClose}
          className="text-sm text-gray-400 hover:text-gray-200"
        >
          Close
        </button>
      </div>

      <div className="flex border-b border-gray-800">
        <button
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === "nodes" ? "text-blue-400 border-b-2 border-blue-400 bg-blue-500/5" : "text-gray-400 hover:text-gray-200"}`}
          onClick={() => setActiveTab("nodes")}
        >
          <Box className="w-4 h-4" />
          Nodes
        </button>
        <button
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === "templates" ? "text-blue-400 border-b-2 border-blue-400 bg-blue-500/5" : "text-gray-400 hover:text-gray-200"}`}
          onClick={() => setActiveTab("templates")}
        >
          <LayoutTemplate className="w-4 h-4" />
          Templates
        </button>
        <button
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === "ai" ? "text-purple-400 border-b-2 border-purple-400 bg-purple-500/5" : "text-gray-400 hover:text-gray-200"}`}
          onClick={() => setActiveTab("ai")}
        >
          <Sparkles className="w-4 h-4" />
          AI Assistant
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {activeTab === "nodes" ? (
          <>
            {loading && <p className="text-sm text-gray-400">Loading connectors...</p>}
            {error && <p className="text-sm text-red-400">⚠️ {error}</p>}

            {!loading && !error && (
              <div className="space-y-6">
                {/* Triggers */}
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Triggers</div>
                  <div className="space-y-2">
                    {list
                      .filter((m) => m.kind === "trigger")
                      .map((m) => (
                        <button
                          key={m.id}
                          className="w-full text-left p-3 rounded-lg border border-gray-800 bg-[#0B0E14] hover:bg-[#1f2937] hover:border-gray-700 transition-all group"
                          onClick={() => onAddNode(m.id, m)}
                        >
                          <div className="font-medium text-gray-200 group-hover:text-white">{m.title}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{m.id}</div>
                        </button>
                      ))}
                  </div>
                </div>

                {/* Actions */}
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Actions</div>
                  <div className="space-y-2">
                    {list
                      .filter((m) => m.kind === "action" || !m.kind)
                      .map((m) => (
                        <button
                          key={m.id}
                          className="w-full text-left p-3 rounded-lg border border-gray-800 bg-[#0B0E14] hover:bg-[#1f2937] hover:border-gray-700 transition-all group"
                          onClick={() => onAddNode(m.id, m)}
                        >
                          <div className="font-medium text-gray-200 group-hover:text-white">{m.title}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{m.id}</div>
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : activeTab === "templates" ? (
          <div className="space-y-4">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Pre-built Flows</div>
            {WORKFLOW_TEMPLATES.map((template) => (
              <button
                key={template.id}
                className="w-full text-left p-3 rounded-lg border border-gray-800 bg-[#0B0E14] hover:bg-[#1f2937] hover:border-gray-700 transition-all group relative overflow-hidden"
                onClick={() => onAddTemplate?.(template)}
              >
                <div className="relative z-10">
                  <div className="font-medium text-blue-400 group-hover:text-blue-300 mb-1">{template.name}</div>
                  <div className="text-xs text-gray-400 leading-relaxed">{template.description}</div>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700">
                      {template.nodes.length} Nodes
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex-1 space-y-4">
              <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-lg">
                <h4 className="text-purple-400 font-medium mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  AI Workflow Builder
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Describe the workflow you want to build, and AI will generate the nodes and connections for you.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-400">Describe your workflow</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full h-32 bg-[#0B0E14] border border-gray-700 rounded-lg p-3 text-sm text-gray-200 focus:outline-none focus:border-purple-500 transition-colors placeholder:text-gray-600 resize-none"
                  placeholder="e.g. Every day at 9am, check for new emails and save attachments to Google Drive..."
                />
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className={`mt-4 w-full py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all
                 ${isGenerating || !prompt.trim()
                  ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                  : "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/20"
                }`}
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Workflow
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </aside>
  );

}
