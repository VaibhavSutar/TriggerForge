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
} from "lucide-react";

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
  discord: {
    webhookUrl: "https://discord.com/api/webhooks/1234567890",
    message: "Hello from Discord!",
  },
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
  ai: { prompt: "Write a poem", model: "gpt-4o", system: "You are a helpful assistant." },
  mcp_tool: { serverName: "filesystem", toolName: "read_file", args: { path: "/tmp/test" } },
  google_gmail: { credential: "", to: "", subject: "", body: "" },
  google_sheets: { credential: "", operation: "read_sheet", spreadsheetId: "", range: "Sheet1!A1:B10", values: "" },
  google_docs: { credential: "", operation: "read_text", documentId: "", content: "" },
};

/* ------------------------------------------------------------
 * 🔹 INTERFACES
 * ------------------------------------------------------------ */

interface NodeData {
  label: string;
  nodeType: string;
  config: Record<string, any>;
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

export const WorkflowNode = memo(({ id, data, selected }: NodeProps<NodeData>) => {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(data.label);
  const [tempConfig, setTempConfig] = useState<Record<string, any>>({
    ...defaultConfigs[data.nodeType],
    ...data.config,
  });

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
        ${selected ? "border-[#3D5CFF] shadow-blue-900/20" : "border-gray-800 hover:border-gray-700"}
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
              {Object.entries(defaultConfigs[data.nodeType] ?? tempConfig).map(
                ([key, value]) => renderConfigInput(key, tempConfig[key] ?? value)
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
          </div>
        )}
      </div>

      {/* Status indicator */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-800">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-400">Ready</span>
        </div>
        {Object.keys(tempConfig).length > 0 && (
          <span className="text-xs text-gray-500">
            {Object.keys(tempConfig).length} config
            {Object.keys(tempConfig).length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Bottom handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 transition-all duration-200 hover:scale-125"
        style={{ background: "#6366f1" }}
      />
    </div>
  );
});

WorkflowNode.displayName = "WorkflowNode";
