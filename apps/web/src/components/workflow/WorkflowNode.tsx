"use client";

import React, { memo, useState } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import {
  Settings,
  Trash2,
  Play,
  Clock,
  Mail,
  Webhook,
  Database,
  Code,
  Filter,
  Edit2,
  Check,
  X,
  Bot,
  Terminal,
  Mail as MailIcon,
  FileSpreadsheet,
  FileText,
  Hash,
  Send,
  Twitter,
  Copy,
  Monitor,
  Layout,
  MessageSquare,
  Search,
  Globe,
  Bell,
  Calendar,
  Zap,
  Users,
  Brain
} from "lucide-react";
import { DataInspector } from "./DataInspector";

/* ------------------------------------------------------------
 * 🔹 ICON + COLOR HELPERS
 * ------------------------------------------------------------ */

const getNodeIcon = (nodeType: string) => {
  switch (nodeType) {
    case "trigger":
      return <Play className="w-4 h-4" />;
    case "timer":
      return <Clock className="w-4 h-4" />;
    case "email":
      return <Mail className="w-4 h-4" />;
    case "webhook":
      return <Webhook className="w-4 h-4" />;
    case "database":
      return <Database className="w-4 h-4" />;
    case "print":
      return <Code className="w-4 h-4" />;
    case "http":
      return <Webhook className="w-4 h-4" />;
    case "condition":
      return <Filter className="w-4 h-4" />;
    case "delay":
      return <Clock className="w-4 h-4" />;
    case "random":
      return <Settings className="w-4 h-4" />;
    case "ai":
      return <Bot className="w-4 h-4" />;
    case "mcp_tool":
      return <Terminal className="w-4 h-4" />;
    case "google_gmail":
      return <MailIcon className="w-4 h-4" />;
    case "google_sheets":
      return <FileSpreadsheet className="w-4 h-4" />;
    case "google_docs":
      return <FileText className="w-4 h-4" />;
    case "hugging_face":
      return <Brain className="w-4 h-4" />;
    case "slack":
      return <Hash className="w-4 h-4" />;
    case "telegram":
      return <Send className="w-4 h-4" />;
    case "twitter":
      return <Twitter className="w-4 h-4" />;
    case "teams":
      return <Users className="w-4 h-4" />;
    default:
      return <Settings className="w-4 h-4" />;
  }
};

const getNodeColor = (nodeType: string) => {
  switch (nodeType) {
    case "trigger":
      return "bg-green-500";
    case "timer":
    case "delay":
      return "bg-blue-500";
    case "email":
      return "bg-red-500";
    case "webhook":
    case "http":
      return "bg-purple-500";
    case "database":
      return "bg-yellow-500";
    case "print":
      return "bg-gray-600";
    case "condition":
      return "bg-orange-500";
    case "random":
      return "bg-indigo-500";
    case "ai":
      return "bg-rose-500";
    case "mcp_tool":
      return "bg-teal-500";
    case "google_gmail":
      return "bg-red-600";
    case "google_sheets":
      return "bg-green-600";
    case "google_docs":
      return "bg-blue-600";
    case "hugging_face":
      return "bg-yellow-600";
    case "slack":
      return "bg-fuchsia-600";
    case "telegram":
      return "bg-sky-500";
    case "twitter":
      return "bg-sky-600";
    case "teams":
      return "bg-indigo-600";
    default:
      return "bg-gray-500";
  }
};

/* ------------------------------------------------------------
 * 🔹 CONFIGURATION PRESETS FOR NODE TYPES
 * ------------------------------------------------------------ */

const defaultConfigs: Record<string, Record<string, any>> = {
  print: { message: "Hello World" },
  http: { url: "https://api.example.com", method: "GET" },
  condition: { expression: "{{state.user.age}} > 18" },
  delay: { seconds: 5 },
  database: { query: "SELECT * FROM users" },
  random: { min: 1, max: 10 },
  trigger: { event: "manual" },
  cron: { expression: "* * * * *" },
  discord: {
    webhookUrl: "https://discord.com/api/webhooks/1234567890",
    message: "Hello from Discord!",
  },
  webhook: { active: true, payload: {} },
  email: {
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    email: "your-email@gmail.com",
    password: "your-app-password",
    from: "Your App <your-email@gmail.com>",
    to: "recipient@example.com",
    subject: "Workflow Notification",
    body: `
      <p>Your task <strong>{{state.task.title}}</strong> has been completed successfully.</p>
      <p>Regards,<br/>TriggerForge</p>    `,
  },
  ai: {
    prompt: "Write a poem",
    model: "gpt-4o",
    system: "You are a helpful assistant.",
    baseURL: "",
    apiKey: ""
  },
  mcp_tool: { serverName: "filesystem", toolName: "read_file", args: { path: "/tmp/test" }, instructions: "", context: "" },
  google_gmail: { credential: "", to: "", subject: "", body: "" },
  google_sheets: { credential: "", operation: "read_sheet", spreadsheetId: "", range: "Sheet1!A1:B10", values: "" },
  google_docs: { credential: "", operation: "read_text", documentId: "", content: "" },
  hugging_face: { apiKey: "", model: "meta-llama/Llama-3.2-1B-Instruct", inputs: "Translate English to French: Hello", parameters: "{}" },
  slack: { webhookUrl: "", message: "Hello from Workflow!" },
  telegram: { botToken: "", chatId: "", message: "Hello from Workflow!" },
  twitter: { apiKey: "", apiSecret: "", text: "Hello world!" },
  teams: { webhookUrl: "", message: "Hello from Workflow!" },
};

/* ------------------------------------------------------------
 * 🔹 INTERFACES
 * ------------------------------------------------------------ */

interface NodeData {
  label: string;
  nodeType: string;
  config: Record<string, any>;
  lastRun?: {
    input?: any;
    output?: any;
    status: 'success' | 'error' | 'RUNNING';
  };
  workflowId?: string; // Injected
  onUpdate?: (id: string, data: Partial<NodeData>) => void;
}

/* ------------------------------------------------------------
 * 🔹 SUB-COMPONENTS
 * ------------------------------------------------------------ */

const FileSelector = ({
  nodeType,
  value,
  onChange
}: {
  nodeType: string;
  value: string;
  onChange: (val: string) => void;
}) => {
  const [files, setFiles] = useState<any[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  const fetchFiles = async () => {
    setIsLoadingFiles(true);
    const userId = localStorage.getItem("triggerforge_user_id") || "test-user-id";
    let mimeType = "";
    if (nodeType === "google_sheets") mimeType = "application/vnd.google-apps.spreadsheet";
    else if (nodeType === "google_docs") mimeType = "application/vnd.google-apps.document";

    try {
      const res = await fetch(`http://localhost:4000/connectors/google/files?userId=${userId}&mimeType=${mimeType}`);
      const json = await res.json();
      if (json.ok) {
        setFiles(json.files);
      } else {
        alert("Failed to load files: " + json.error);
      }
    } catch (err: any) {
      alert("Error loading files: " + err.message);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  return (
    <div className="flex space-x-2">
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 nodrag"
      >
        <option value="">Select a file...</option>
        {files.map((f: any) => (
          <option key={f.id} value={f.id}>{f.name}</option>
        ))}
        {value && !files.find(f => f.id === value) && <option value={value}>{value}</option>}
      </select>
      <button
        onClick={fetchFiles}
        disabled={isLoadingFiles}
        className="px-2 py-1 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 text-xs nodrag"
        title="Refresh File List"
      >
        {isLoadingFiles ? "..." : "↻"}
      </button>
    </div>
  );
};

/* ------------------------------------------------------------
 * 🔹 COMPONENT
 * ------------------------------------------------------------ */

// 🔹 COMPONENT
export const CRON_PRESETS: Record<string, string> = {
  "Every Minute": "* * * * *",
  "Every 5 Minutes": "*/5 * * * *",
  "Every 15 Minutes": "*/15 * * * *",
  "Every Hour": "0 * * * *",
  "Every Day (Midnight)": "0 0 * * *",
  "Every Week (Sunday)": "0 0 * * 0",
  "Custom": "custom"
};

export const WorkflowNode = memo(({ id, data, selected }: NodeProps<NodeData>) => {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(data.label);
  const [tempConfig, setTempConfig] = useState<Record<string, any>>({
    ...defaultConfigs[data.nodeType],
    ...data.config,
  });

  // State for Inspector
  const [inspectorData, setInspectorData] = useState<{ input: any; output: any } | null>(null);
  const [showInspector, setShowInspector] = useState(false);

  /* -----------------------------------
   * 🧩 Name Editing
   * ----------------------------------- */
  const handleNameSave = () => {
    if (data.onUpdate) data.onUpdate(id, { label: tempName });
    setIsEditingName(false);
  };

  const handleNameCancel = () => {
    setTempName(data.label);
    setIsEditingName(false);
  };

  /* -----------------------------------
   * ⚙️ Config Editing
   * ----------------------------------- */
  const handleConfigUpdate = (key: string, value: any) => {
    const newConfig = { ...tempConfig, [key]: value };
    setTempConfig(newConfig);
    if (data.onUpdate) data.onUpdate(id, { config: newConfig });
  };

  /* -----------------------------------
   * ⚡ Run Handler
   * ----------------------------------- */
  const handleRun = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const btn = e.currentTarget;
    const originalText = btn.innerText;
    btn.innerText = "Running...";
    btn.disabled = true;

    try {
      const userId = localStorage.getItem("triggerforge_user_id") || "test-user-id";
      const res = await fetch("http://localhost:4000/connectors/run-node", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          type: data.nodeType,
          config: tempConfig
        })
      });
      const json = await res.json();

      setInspectorData({
        input: json.input || tempConfig,
        output: json.output || json // Fallback if output key missing
      });
      setShowInspector(true);
      // Also open config if it was closed, so we can see the result panel
      if (!isConfigOpen) setIsConfigOpen(true);

    } catch (err: any) {
      alert("Run failed: " + err.message);
    } finally {
      btn.innerText = originalText;
      btn.disabled = false;
    }
  };

  /* -----------------------------------
   * 🔧 Config Field Renderer
   * ----------------------------------- */
  const renderConfigInput = (key: string, value: any) => {
    // Hide sensitive passwords
    if (key.toLowerCase().includes("password")) {
      return (
        <div key={key} className="mb-2">
          <label className="block text-xs font-medium text-gray-300 mb-1">
            {key}
          </label>
          <input
            type="password"
            value={value || ""}
            onChange={(e) => handleConfigUpdate(key, e.target.value)}
            className="w-full px-2 py-1 text-xs bg-[#0B0E14] text-white border border-gray-700 rounded focus:ring-1 focus:ring-[#3D5CFF] focus:border-[#3D5CFF] focus:outline-none"
            placeholder="Enter password"
          />
        </div>
      );
    }

    // Credential / Connection UI
    if (key === "credential" || key === "connection") {
      const isConnected = !!value;
      return (
        <div key={key} className="mb-2">
          <label className="block text-xs font-medium text-gray-300 mb-1 capitalize">
            {key}
          </label>
          {isConnected ? (
            <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded text-xs nodrag">
              <span className="text-green-700 font-medium">Connected</span>
              <button
                onClick={() => handleConfigUpdate(key, "")}
                className="text-gray-400 hover:text-red-400"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                // Real OAuth Pop-up
                const width = 500;
                const height = 600;
                const left = window.screen.width / 2 - width / 2;
                const top = window.screen.height / 2 - height / 2;

                // Construct Authentication URL
                const userId = localStorage.getItem("triggerforge_user_id") || "test-user-id";
                const authUrl = `http://localhost:4000/auth/google?userId=${userId}`;

                const popup = window.open(
                  authUrl,
                  "Connect Google",
                  `width=${width},height=${height},top=${top},left=${left}`
                );

                const interval = setInterval(() => {
                  if (popup?.closed) {
                    clearInterval(interval);
                  }
                }, 1000);

                // Listen for success message
                const handler = (event: MessageEvent) => {
                  if (event.data?.type === 'OAUTH_SUCCESS' && event.data?.provider === 'google') {
                    clearInterval(interval);
                    handleConfigUpdate(key, "connected");
                    alert("Successfully connected to Google!");
                    window.removeEventListener('message', handler);
                  }
                };
                window.addEventListener('message', handler);
              }}
              className="w-full flex items-center justify-center space-x-2 py-1.5 px-3 bg-white border border-gray-300 rounded hover:bg-gray-50 text-xs font-medium text-gray-700 transition-colors nodrag"
            >
              <span className="w-2 h-2 rounded-full bg-gray-500" />
              <span>Connect Account</span>
            </button>
          )}
        </div>
      );
    }

    // 3. Operation Selection
    if (key === "operation") {
      let options: string[] = [];
      if (data.nodeType === "google_sheets") {
        options = ["read_sheet", "append_row", "clear_sheet"];
      } else if (data.nodeType === "google_docs") {
        options = ["create_doc", "read_text", "append_text"];
      } else {
        // fallback or generic operations
        options = ["read", "write", "update", "delete"];
      }

      return (
        <div key={key} className="mb-2">
          <label className="block text-xs font-medium text-gray-700 mb-1 capitalize">Operation</label>
          <select
            value={value || ""}
            onChange={(e) => handleConfigUpdate(key, e.target.value)}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 nodrag"
          >
            {options.map(opt => (
              <option key={opt} value={opt}>{opt.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>
      );
    }

    // 4. File Selection (Spreadsheet/Docs)
    if (["spreadsheetId", "documentId", "fileId"].includes(key)) {
      return (
        <div key={key} className="mb-2">
          <label className="block text-xs font-medium text-gray-700 mb-1 capitalize">
            {key.replace(/([A-Z])/g, " $1").trim()}
          </label>
          <div className="nodrag">
            <FileSelector
              nodeType={data.nodeType}
              value={value}
              onChange={(val) => handleConfigUpdate(key, val)}
            />
          </div>
          <input
            type="text"
            value={value || ""}
            onChange={(e) => handleConfigUpdate(key, e.target.value)}
            className="w-full mt-1 px-2 py-1 text-xs border border-gray-300 rounded text-gray-400 nodrag"
            placeholder="Or enter ID manually"
          />
        </div>
      );
    }

    // 5. Hide irrelevant fields
    if (key === "content" && data.nodeType === "google_docs") {
      const op = tempConfig["operation"] || "read_text";
      if (op === "read_text") return null;
    }
    if (key === "values" && data.nodeType === "google_sheets") {
      const op = tempConfig["operation"] || "read_sheet";
      if (["read_sheet", "clear_sheet"].includes(op)) return null;
    }

    // 6. Model Selector (Hugging Face or AI)
    if (key === "model" && (data.nodeType === "hugging_face" || data.nodeType === "ai")) {
      let models = [
        "gpt-4o",
        "gpt-4-turbo",
        "gpt-3.5-turbo"
      ];

      if (data.nodeType === "hugging_face") {
        models = [
          "meta-llama/Llama-3.2-1B-Instruct",
          "meta-llama/Llama-3.2-3B-Instruct",
          "meta-llama/Llama-3.1-70B-Instruct",
          "HuggingFaceH4/zephyr-7b-beta",
          "google/flan-t5-base",
          "mistralai/Mistral-7B-Instruct-v0.3",
          "deepseek-ai/DeepSeek-R1-Distill-Llama-70B"
        ];
      } else if (data.nodeType === "ai") {
        models = [
          "gpt-4o",
          "gpt-4-turbo",
          "gpt-3.5-turbo",
          "anthropic/claude-3-opus",
          "anthropic/claude-3-sonnet",
          "anthropic/claude-3-haiku",
          "google/gemini-pro",
          "mistralai/mistral-large",
        ];
      }

      return (
        <div key={key} className="mb-2">
          <label className="block text-xs font-medium text-gray-300 mb-1 capitalize">
            Model
          </label>
          <div className="flex space-x-1">
            <select
              value={models.includes(value) ? value : "custom"}
              onChange={(e) => {
                const val = e.target.value;
                if (val !== "custom") handleConfigUpdate(key, val);
              }}
              className="flex-1 px-2 py-1 text-xs bg-[#0B0E14] text-white border border-gray-700 rounded focus:ring-1 focus:ring-[#3D5CFF] focus:border-[#3D5CFF] focus:outline-none nodrag"
            >
              {models.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
              <option value="custom">Custom...</option>
            </select>
            {(!models.includes(value) || value === "custom") && (
              <input
                type="text"
                value={value || ""}
                onChange={(e) => handleConfigUpdate(key, e.target.value)}
                placeholder="Custom model..."
                className="flex-1 px-2 py-1 text-xs bg-[#0B0E14] text-white border border-gray-700 rounded focus:ring-1 focus:ring-[#3D5CFF] focus:outline-none nodrag"
              />
            )}
          </div>
        </div>
      );
    }

    // (Old Webhook UI removed - handled explicitly in render)


    // Textarea for message or body
    if (key.toLowerCase() === "message" || key.toLowerCase() === "body") {
      return (
        <div key={key} className="mb-2">
          <label className="block text-xs font-medium text-gray-300 mb-1">
            {key}
          </label>
          <textarea
            value={value || ""}
            onChange={(e) => handleConfigUpdate(key, e.target.value)}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 nodrag"
            rows={3}
            placeholder={`Enter ${key}`}
          />
        </div>
      );
    }

    const inputType = typeof value === "number" ? "number" : "text";

    // Cron Expression Hint
    if (key === "expression" && data.nodeType === "cron") {
      // Determine current preset
      const currentPreset = Object.entries(CRON_PRESETS).find(([_, val]) => val === value)?.[0] || "Custom";

      return (
        <div key={key} className="mb-2">
          <label className="block text-xs font-medium text-gray-300 mb-1 capitalize">
            Schedule
          </label>
          <select
            value={currentPreset}
            onChange={(e) => {
              const newVal = CRON_PRESETS[e.target.value];
              if (newVal !== "custom") {
                handleConfigUpdate(key, newVal);
              } else {
                // If switching to custom, keep current value but user can edit
                // or maybe clear it? Let's just keep it for now or set to default if empty
                if (!value) handleConfigUpdate(key, "* * * * *");
              }
            }}
            className="w-full mb-2 px-2 py-1 text-xs bg-[#0B0E14] text-white border border-gray-700 rounded focus:ring-1 focus:ring-[#3D5CFF] focus:border-[#3D5CFF] focus:outline-none nodrag"
          >
            {Object.keys(CRON_PRESETS).map(k => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>

          {currentPreset === "Custom" && (
            <>
              <input
                type="text"
                value={value || ""}
                onChange={(e) => handleConfigUpdate(key, e.target.value)}
                className="w-full px-2 py-1 text-xs bg-[#0B0E14] text-white border border-gray-700 rounded focus:ring-1 focus:ring-[#3D5CFF] focus:border-[#3D5CFF] focus:outline-none font-mono nodrag"
                placeholder="* * * * *"
              />
              <div className="text-[10px] text-gray-500 mt-1">
                Min Hour Day Month DayOfWeek
              </div>
            </>
          )}
        </div>
      )
    }

    // 7. MCP Tool Config
    if (data.nodeType === "mcp_tool") {
      if (key === "instructions" || key === "context") {
        return (
          <div key={key} className="mb-2">
            <label className="block text-xs font-medium text-gray-300 mb-1 capitalize">
              {key} {key === "instructions" ? "(AI)" : ""}
            </label>
            <textarea
              value={value || ""}
              onChange={(e) => handleConfigUpdate(key, e.target.value)}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 nodrag font-mono"
              rows={key === "instructions" ? 4 : 2}
              placeholder={key === "instructions" ? "Describe what you want to do..." : "Optional context data..."}
            />
          </div>
        );
      }
      // Hide serverName/toolName/args if instructions are used? No, keep them as manual override or fallback
      // But maybe we want args to be a JSON text area
      if (key === "args") {
        const jsonString = typeof value === "string" ? value : JSON.stringify(value, null, 2);
        return (
          <div key={key} className="mb-2">
            <label className="block text-xs font-medium text-gray-300 mb-1 capitalize">
              Arguments (JSON)
            </label>
            <textarea
              value={jsonString}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  handleConfigUpdate(key, parsed);
                } catch {
                  // Allow typing invalid json, but maybe store as string temporarily?
                  // For this simple implementation, we might just struggle with invalid JSON
                  // Better to store as string in temp state and parse on blur or run?
                  // For now, let's just assume valid JSON or use a proper editor later.
                  // We will just pass the string to update, but the state expects object?
                  // Let's rely on valid JSON for now.
                }
              }}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 nodrag font-mono"
              rows={3}
              placeholder="{}"
            />
            <div className="text-[10px] text-gray-500 text-right">
              Manual overrides
            </div>
          </div>
        );
      }
    }

    return (
      <div key={key} className="mb-2">
        <label className="block text-xs font-medium text-gray-300 mb-1 capitalize">
          {key.replace(/([A-Z])/g, " $1").trim()}
        </label>
        <input
          type={inputType}
          value={value || ""}
          onChange={(e) =>
            handleConfigUpdate(
              key,
              inputType === "number" ? Number(e.target.value) : e.target.value
            )
          }
          className="w-full px-2 py-1 text-xs bg-[#0B0E14] text-white border border-gray-700 rounded focus:ring-1 focus:ring-[#3D5CFF] focus:border-[#3D5CFF] focus:outline-none"
          placeholder={`Enter ${key} `}
        />
      </div>
    );
  };

  /* ------------------------------------------------------------
   * 🧱 UI STRUCTURE
   * ------------------------------------------------------------ */
  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg bg-[#151C2F] border-2 min-w-[200px] max-w-[300px]
        transform transition-all duration-300 ease-in-out hover:scale-[1.02]
        ${data.lastRun?.status === 'error' ? "border-red-500 shadow-red-900/20" :
          data.lastRun?.status === 'success' ? "border-green-500 shadow-green-900/20" :
            data.lastRun?.status === 'RUNNING' ? "border-yellow-500 shadow-yellow-900/20 animate-pulse" :
              selected ? "border-[#3D5CFF] shadow-blue-900/20" : "border-gray-800 hover:border-gray-700"
        }
        ${isConfigOpen ? "shadow-xl" : ""}
`}
    >
      {/* Top handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 transition-all duration-200 hover:scale-125"
        style={{ background: "#6366f1" }}
      />

      {/* Header */}
      <div className="flex items-center space-x-3 mb-2">
        <div
          className={`${getNodeColor(
            data.nodeType
          )} p-2 rounded-full text-white transform transition-all duration-300 ${selected ? "scale-110 shadow-md" : ""
            } `}
        >
          {getNodeIcon(data.nodeType)}
        </div>

        <div className="flex-1 min-w-0">
          {isEditingName ? (
            <div className="flex items-center space-x-1">
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="flex-1 text-sm font-medium bg-transparent text-white border-b border-[#3D5CFF] focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleNameSave();
                  if (e.key === "Escape") handleNameCancel();
                }}
                autoFocus
              />
              <button
                onClick={handleNameSave}
                className="p-1 text-green-500 hover:bg-green-500/10 rounded transition-colors duration-200"
              >
                <Check className="w-3 h-3" />
              </button>
              <button
                onClick={handleNameCancel}
                className="p-1 text-red-500 hover:bg-red-500/10 rounded transition-colors duration-200"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div
              className="flex items-center space-x-1 cursor-pointer group"
              onClick={() => setIsEditingName(true)}
            >
              <div className="text-sm font-medium text-white truncate">
                {data.label}
              </div>
              <Edit2 className="w-3 h-3 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </div>
          )}
          <div className="text-xs text-gray-400 capitalize">
            {data.nodeType}
          </div>
        </div>

        <button
          onClick={() => setIsConfigOpen(!isConfigOpen)}
          className={`p-1.5 rounded transition-all duration-200 ${isConfigOpen
            ? "bg-[#3D5CFF]/20 text-[#3D5CFF]"
            : "text-gray-500 hover:bg-gray-800"
            } `}
        >
          <Settings className="w-3 h-3" />
        </button>
      </div>

      {/* Configuration Panel - expands fully */}
      <div
        className={`transition-all duration-300 ease-in-out ${isConfigOpen ? "opacity-100" : "opacity-0 max-h-0"
          } `}
        style={{ maxHeight: isConfigOpen ? "none" : 0 }}
      >
        {isConfigOpen && (
          <div className="pt-2 border-t border-gray-800">
            <div className="text-xs font-medium text-gray-300 mb-2">
              Configuration
            </div>
            <div className="space-y-3">
              {/* Webhook Special UI */}
              {data.nodeType === "webhook" && (
                <div className="mb-4 bg-gray-800/30 p-3 rounded border border-gray-700/50">
                  <div className="flex items-center justify-between mb-3 p-2 bg-[#0B0E14] rounded border border-gray-800">
                    <span className="text-gray-300 font-medium text-xs">Active</span>
                    <div
                      className={`w-8 h-4 flex items-center bg-gray-700 rounded-full p-1 cursor-pointer transition-colors ${data.config?.active !== false ? 'bg-green-500' : ''}`}
                      onClick={() => {
                        const isActive = data.config?.active !== false;
                        handleConfigUpdate("active", !isActive);
                      }}
                    >
                      <div className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${data.config?.active !== false ? 'translate-x-3' : 'translate-x-0'}`}></div>
                    </div>
                  </div>

                  <div className="mb-2">
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Webhook URL</label>
                    <div className="flex items-center space-x-2">
                      <code className="flex-1 p-2 bg-black/50 border border-gray-700 rounded text-[10px] text-blue-300 font-mono break-all leading-tight">
                        {data.workflowId
                          ? `http://localhost:4000/hooks/${data.workflowId}`
                          : "Save workflow to generate URL"}
                      </code>
                      <button
                        onClick={() => {
                          if (data.workflowId) {
                            navigator.clipboard.writeText(`http://localhost:4000/hooks/${data.workflowId}`);
                            alert("URL Copied!");
                          }
                        }}
                        className="p-2 bg-gray-700 hover:bg-gray-600 rounded border border-gray-600 transition-colors text-white"
                        title="Copy URL"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <label className="text-xs font-medium text-gray-300">Active Status</label>
              <button
                onClick={() => handleConfigUpdate("active", !(tempConfig.active ?? true))}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${(tempConfig.active ?? true) ? 'bg-green-500' : 'bg-gray-600'
                  }`}
              >
                <span
                  className={`${(tempConfig.active ?? true) ? 'translate-x-5' : 'translate-x-1'
                    } inline-block h-3 w-3 transform rounded-full bg-white transition-transform`}
                />
              </button>
            </div>

            {/* Last Payload */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1 flex justify-between">
                <span>Last Payload</span>
                <span className="text-[9px] font-normal text-gray-500 uppercase">Input Data</span>
              </label>
              {data.lastRun?.input ? (
                <pre className="bg-black/80 p-2 rounded border border-gray-700 text-[9px] text-green-400 font-mono overflow-auto max-h-32 scrollbar-thin scrollbar-thumb-gray-700">
                  {JSON.stringify(data.lastRun.input, null, 2)}
                </pre>
              ) : (
                <div className="text-[10px] text-gray-500 italic p-2 border border-dashed border-gray-700 rounded bg-black/20 text-center">
                  Waiting for data...
                </div>
              )}
            </div>

            {Object.entries(defaultConfigs[data.nodeType] ?? tempConfig).map(
              ([key, value]) => {
                if (data.nodeType === "webhook" && ["active", "payload"].includes(key)) return null;
                return renderConfigInput(key, tempConfig[key] ?? value);
              }
            )}

            <button
              onClick={() => {
                const newKey = prompt("Enter configuration key:");
                if (newKey && !tempConfig[newKey]) {
                  handleConfigUpdate(newKey, "");
                }
              }}
              className="w-full py-1 text-xs text-[#3D5CFF] border border-dashed border-[#3D5CFF]/30 rounded hover:bg-[#3D5CFF]/10 transition-colors duration-200"
            >
              + Add Configuration
            </button>
          </div>
        )}
      </div>

      {/* Status indicator */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-800">
        <div className="flex items-center space-x-2">
          {data.lastRun?.status === 'RUNNING' ? (
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-ping"></div>
          ) : (
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          )}
          <span className="text-xs text-gray-400">
            {data.lastRun?.status === 'RUNNING' ? "Running..." : "Ready"}
          </span>
        </div>
        {
          Object.keys(tempConfig).length > 0 && (
            <span className="text-xs text-gray-500">
              {Object.keys(tempConfig).length} config
              {Object.keys(tempConfig).length !== 1 ? "s" : ""}
            </span>
          )
        }
      </div >

      {/* Bottom handle */}
      {/* Bottom handle (Conditional vs Default) */}
      {
        data.nodeType === "condition" ? (
          <div className="absolute -bottom-3 left-0 w-full flex justify-between px-4">
            <div className="relative group">
              <Handle
                type="source"
                position={Position.Bottom}
                id="true"
                className="w-3 h-3 bg-green-500 hover:scale-125 transition-all"
                style={{ left: "25%" }}
              />
              <span className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] text-green-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                TRUE
              </span>
            </div>
            <div className="relative group">
              <Handle
                type="source"
                position={Position.Bottom}
                id="false"
                className="w-3 h-3 bg-red-500 hover:scale-125 transition-all"
                style={{ left: "75%" }}
              />
              <span className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] text-red-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                FALSE
              </span>
            </div>
          </div>
        ) : (
          <Handle
            type="source"
            position={Position.Bottom}
            className="w-3 h-3 transition-all duration-200 hover:scale-125"
            style={{ background: "#6366f1" }}
          />
        )
      }

      {/* Test Run Section */}
      <div className="border-t border-gray-800 rounded-b-lg">
        <div className="flex justify-between items-center p-2 bg-gray-50 border-b border-gray-100 dark:bg-gray-900 dark:border-gray-800">
          <span className="text-xs font-semibold text-gray-400">Test Node</span>
          <button
            onClick={handleRun}
            className="px-2 py-1 bg-[#3D5CFF] text-white text-xs rounded hover:bg-[#2A4BCC] nodrag"
          >
            ▶ Run
          </button>
        </div>

        {/* Last Full Workflow Execution Result */}
        {data.lastRun && (
          <div className={`p-2 border-t mt-auto ${data.lastRun.status === 'success' ? 'bg-green-900/20 border-green-900/50' : 'bg-red-900/20 border-red-900/50'}`}>
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center space-x-1">
                <span className={`w-2 h-2 rounded-full ${data.lastRun.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className={`text-[10px] font-bold uppercase tracking-wide ${data.lastRun.status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                  {data.lastRun.status === 'success' ? 'Success' : 'Failed'}
                </span>
              </div>
              <button
                onClick={() => {
                  setInspectorData({
                    input: data.lastRun?.input,
                    output: data.lastRun?.output,
                  });
                  setShowInspector(true);
                  if (!isConfigOpen) setIsConfigOpen(true);
                }}
                className="text-[10px] text-white/50 hover:text-white underline underline-offset-2 nodrag"
              >
                View Details
              </button>
            </div>
            {data.lastRun.status === 'error' && (
              <div className="text-[10px] text-red-300 break-words line-clamp-2" title={JSON.stringify(data.lastRun.output)}>
                {typeof data.lastRun.output === 'string' ? data.lastRun.output : (data.lastRun.output?.message || JSON.stringify(data.lastRun.output))}
              </div>
            )}
          </div>
        )}

        {showInspector && inspectorData && (
          <div className="nodrag">
            <DataInspector
              inputData={inspectorData.input}
              outputData={inspectorData.output}
              isVisible={true}
              onClose={() => setShowInspector(false)}
            />
          </div>
        )}
      </div>
    </div >
  );
});

WorkflowNode.displayName = "WorkflowNode";
