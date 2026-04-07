"use client";

export const getUserId = () => {
  try {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.id || "test-user-id";
    }
  } catch {
    return localStorage.getItem("user") || "test-user-id";
  }
  return "test-user-id";
};

import React, { memo, useState } from "react";
import { createPortal } from "react-dom";
import { Handle, Position, NodeProps, useReactFlow } from "reactflow";
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
  Brain,
  Navigation,
  Power,
  Download
} from "lucide-react";
import { DataInspector } from "./DataInspector";

/* ------------------------------------------------------------
 * 🔍 VARIABLE PICKER HELPERS
 * ------------------------------------------------------------ */
const getFieldsForNode = (node: any) => {
  const type = node.data?.nodeType;
  const op = node.data?.config?.operation;

  const common = [
    { label: "Full Output", path: "output" },
  ];

  switch (type) {
    case "google_gmail":
      if (op === "read_emails") {
        return [
          { label: "Email Subject", path: "output.subject" },
          { label: "Sender (From)", path: "output.from" },
          { label: "Message Body", path: "output.body" },
          { label: "Message ID", path: "output.id" },
          ...common
        ];
      }
      return common;
    case "ai":
      return [
        { label: "Generated Text", path: "output.text" },
        { label: "Detected Tags (v1)", path: "output.tags" },
        { label: "Detected Tags (v2)", path: "output.text.tags" },
        ...common
      ];
    case "webhook":
      return [
        { label: "Request Body", path: "output.body" },
        { label: "Query Parms", path: "output.query" },
        ...common
      ];
    case "cron":
      return [
        { label: "Trigger Time", path: "output.timestamp" },
        ...common
      ];
    case "google_sheets":
      return [
        { label: "Sheet Rows", path: "output.values" },
        ...common
      ];
    case "pexels":
      return [
        { label: "Asset URL", path: "output.link" },
        { label: "Detailed Metadata", path: "output.asset" },
        ...common
      ];
    case "shotstack":
      return [
        { label: "Final Video URL", path: "output.url" },
        { label: "Render ID", path: "output.renderId" },
        { label: "Status", path: "output.status" },
        ...common
      ];
    case "tts":
      return [
        { label: "Audio URL", path: "output.audioUrl" },
        ...common
      ];
    case "video_renderer_local":
      return [
        { label: "Public Video URL", path: "output.url" },
        { label: "Local Output Path", path: "output.localPath" },
        { label: "Status", path: "output.status" },
        ...common
      ];
    case "elevenlabs":
      return [
        { label: "Audio URL", path: "output.audioUrl" },
        { label: "Local Path", path: "output.localPath" },
        ...common
      ];
    case "google_drive":
      return [
        { label: "WebView Link", path: "output.webViewLink" },
        { label: "File ID", path: "output.id" },
        ...common
      ];
    default:
      return common;
  }
};

const VariablePicker = ({ onSelect, currentNodeId }: { onSelect: (val: string) => void, currentNodeId: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { getNodes } = useReactFlow();

  // Sort by Y position to show "earlier" nodes first
  const nodes = getNodes()
    .filter(n => n.id !== currentNodeId)
    .sort((a, b) => a.position.y - b.position.y);

  return (
    <div className="relative inline-block">
      <button
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className="p-1 px-1.5 text-indigo-400 hover:bg-indigo-500/10 rounded border border-indigo-500/30 transition-colors flex items-center space-x-1"
        title="Insert Variable"
      >
        <Database className="w-3 h-3" />
        <span className="text-[9px] font-black tracking-widest">DATA</span>
      </button>

      {isOpen && (
        <div className="fixed sm:absolute z-100001 mt-1 right-0 w-72 bg-[#0B0E14] border border-gray-700/50 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-3 border-b border-gray-800 bg-[#151C2F] flex items-center space-x-2">
            <Search className="w-4 h-4 text-indigo-500" />
            <input
              autoFocus
              type="text"
              placeholder="Search variables..."
              className="bg-transparent border-none text-xs text-white placeholder-gray-600 focus:outline-none w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-72 overflow-y-auto p-2 custom-scrollbar space-y-3">
            {nodes.length === 0 && <div className="p-4 text-xs text-gray-500 text-center italic">No upstream data available</div>}
            {nodes.filter(n => n.data?.label?.toLowerCase().includes(search.toLowerCase()) || n.data?.nodeType?.includes(search)).map(node => {
              const fields = getFieldsForNode(node);
              return (
                <div key={node.id} className="bg-[#151C2F]/50 rounded-lg p-1 border border-gray-800/50">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-indigo-400 flex items-center justify-between">
                    <span className="truncate max-w-[140px]">{node.data?.label || node.id}</span>
                    <span className="text-[8px] text-gray-600 font-mono">{node.data?.nodeType}</span>
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {fields.map(v => (
                      <button
                        key={v.path}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(`{{$node.${node.id}.${v.path}}}`);
                          setIsOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-[11px] text-gray-400 hover:bg-indigo-500 hover:text-white rounded-md transition-all flex justify-between items-center group"
                      >
                        <span>{v.label}</span>
                        <span className="text-[8px] opacity-0 group-hover:opacity-50 font-mono">{v.path}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

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
    case "serpapi":
      return <Search className="w-4 h-4" />;
    case "website_scraper":
      return <Globe className="w-4 h-4" />;
    case "google_maps_deep_scraper":
      return <Navigation className="w-4 h-4" />;
    case "pexels":
      return <Search className="w-4 h-4" />;
    case "shotstack":
      return <Monitor className="w-4 h-4" />;
    case "video_renderer_local":
      return <Monitor className="w-4 h-4" />;
    case "elevenlabs":
      return <MessageSquare className="w-4 h-4" />;
    case "tts":
      return <MessageSquare className="w-4 h-4" />;
    case "google_drive":
      return <Layout className="w-4 h-4" />;
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
    case "serpapi":
      return "bg-indigo-500";
    case "website_scraper":
      return "bg-sky-400";
    case "google_maps_deep_scraper":
      return "bg-rose-500";
    case "pexels":
      return "bg-green-400";
    case "shotstack":
      return "bg-indigo-600";
    case "video_renderer_local":
      return "bg-slate-700";
    case "elevenlabs":
      return "bg-indigo-500";
    case "tts":
      return "bg-sky-400";
    case "google_drive":
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
  google_gmail: {
    credential: "",
    operation: "send_email",
    to: "",
    subject: "",
    body: "",
    query: "is:unread",
    messageId: "",
    addLabels: "",
    removeLabels: ""
  },
  google_sheets: { credential: "", operation: "read_sheet", spreadsheetId: "", range: "Sheet1!A1:B10", values: "" },
  google_docs: { credential: "", operation: "read_text", documentId: "", content: "" },
  hugging_face: { apiKey: "", model: "meta-llama/Llama-3.2-1B-Instruct", inputs: "Translate English to French: Hello", parameters: "{}" },
  slack: { webhookUrl: "", message: "Hello from Workflow!" },
  telegram: { botToken: "", chatId: "", message: "Hello from Workflow!" },
  twitter: { apiKey: "", apiSecret: "", text: "Hello world!" },
  teams: { webhookUrl: "", message: "Hello from Workflow!" },
  serpapi: { query: "", engine: "google", apiKey: "", location: "", num: 10 },
  website_scraper: { url: "" },
  google_maps_deep_scraper: { query: "", limit: 5, max_scrolls: 10, headless: true },
  pexels: { apiKey: "", query: "sports", type: "videos", per_page: 3, orientation: "portrait" },
  shotstack: { apiKey: "", env: "sandbox", waitForCompletion: true, timeline: { tracks: [{ clips: [] }] } },
  video_renderer_local: { operation: "stitch", videoUrls: [], audioUrl: "", text: "", outputName: "reel.mp4" },
  elevenlabs: { apiKey: "", voiceId: "21m00Tcm4TlvDq8ikWAM", model_id: "eleven_multilingual_v2", text: "Hello from ElevenLabs!", stability: 0.5, similarity_boost: 0.75 },
  tts: { text: "Hello", lang: "en" },
  google_drive: { operation: "upload", url: "", fileName: "video.mp4" }
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
    const userId = getUserId();
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

export const CRON_PRESETS: Record<string, string> = {
  "Every Minute": "* * * * *",
  "Every 5 Minutes": "*/5 * * * *",
  "Every 15 Minutes": "*/15 * * * *",
  "Every Hour": "0 * * * *",
  "Every Day (Midnight)": "0 0 * * *",
  "Every Week (Sunday)": "0 0 * * 0",
  "Custom": "custom"
};

const ResultPreview = ({ output }: { output: any }) => {
  if (!output) return null;
  
  const renderItem = (item: any, isBatch = false) => {
    const url = item.url || item.link || item.audioUrl;
    if (!url || typeof url !== 'string' || url.includes('{{')) return null;

    const isVideo = url.endsWith('.mp4') || url.endsWith('.webm') || url.includes('video');
    const isAudio = url.endsWith('.mp3') || url.endsWith('.wav') || url.includes('audio');
    const isImage = url.endsWith('.png') || url.endsWith('.jpg') || url.endsWith('.jpeg') || url.includes('image');

    return (
      <div key={url} className={`${isBatch ? "mb-1" : "mt-3"} p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300 nodrag`}>
        <div className="flex items-center justify-between mb-2">
          {!isBatch && <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Generated Output</span>}
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-1 px-2 bg-indigo-500 text-white rounded text-[9px] font-bold hover:bg-indigo-600 transition-colors flex items-center space-x-1 ml-auto"
          >
            <Globe className="w-2.5 h-2.5" />
            <span>OPEN</span>
          </a>
        </div>
        
        {isVideo && (
          <div className="relative group cursor-pointer overflow-hidden rounded-md border border-gray-800 bg-black aspect-video flex items-center justify-center min-h-[40px]">
             <video src={url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" muted loop onMouseOver={e => e.currentTarget.play()} onMouseOut={e => e.currentTarget.pause()} />
             <div className="absolute inset-0 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play className={`${isBatch ? "w-4 h-4" : "w-6 h-6"} text-white drop-shadow-lg`} />
             </div>
          </div>
        )}

        {isImage && (
          <div className="rounded-md border border-gray-800 overflow-hidden bg-black aspect-video">
             <img src={url} className="w-full h-full object-contain" alt="Preview" />
          </div>
        )}

        {isAudio && (
          <div className="flex items-center space-x-2 p-1 bg-black/40 rounded border border-gray-800">
             <MessageSquare className="w-3 h-3 text-indigo-400" />
             <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                <div className="w-1/3 h-full bg-indigo-500 animate-pulse" />
             </div>
             <a href={url} download className="p-1 text-gray-400 hover:text-white">
                <Download className="w-2.5 h-2.5" />
             </a>
          </div>
        )}

        <div className="mt-2 text-[8px] text-gray-500 truncate font-mono bg-black/20 p-1 rounded">
          {url}
        </div>
      </div>
    );
  };

  const outputArr = Array.isArray(output) ? output : null;
  if (!outputArr && (output.url || output.link || output.audioUrl)) {
    return renderItem(output);
  }

  if (outputArr) {
    return (
      <div className="mt-3 space-y-2">
        <div className="px-1 flex justify-between items-center bg-indigo-500/20 p-1 rounded border border-indigo-500/30">
           <span className="text-[10px] font-black text-indigo-400 uppercase">Batch Success ({outputArr.length})</span>
           <Zap className="w-3 h-3 text-indigo-500 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
          {outputArr.map(item => renderItem(item, true))}
        </div>
      </div>
    );
  }

  return null;
};

export const WorkflowNode = memo(({ id, data, selected }: NodeProps<NodeData>) => {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(data.label);
  const [tempConfig, setTempConfig] = useState<Record<string, any>>({
    ...defaultConfigs[data.nodeType],
    ...data.config,
  });

  const [inspectorData, setInspectorData] = useState<{ input: any; output: any } | null>(null);
  const [showInspector, setShowInspector] = useState(false);

  const handleNameSave = () => {
    if (data.onUpdate) data.onUpdate(id, { label: tempName });
    setIsEditingName(false);
  };

  const handleNameCancel = () => {
    setTempName(data.label);
    setIsEditingName(false);
  };

  const handleConfigUpdate = (key: string, value: any) => {
    const newConfig = { ...tempConfig, [key]: value };
    setTempConfig(newConfig);
    if (data.onUpdate) data.onUpdate(id, { config: newConfig });
  };

  const handleRun = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const btn = e.currentTarget;
    const originalText = btn.innerText;
    btn.innerText = "Running...";
    btn.disabled = true;

    try {
      const userId = getUserId();
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
        output: json.output || json
      });
      setShowInspector(true);
      if (!isConfigOpen) setIsConfigOpen(true);

    } catch (err: any) {
      alert("Run failed: " + err.message);
    } finally {
      btn.innerText = originalText;
      btn.disabled = false;
    }
  };

  const renderConfigInput = (key: string, value: any) => {
    if (key.toLowerCase().includes("password") || key.toLowerCase().includes("apikey") || key.toLowerCase().includes("api_key") || key.toLowerCase().includes("token")) {
      return (
        <div key={key} className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-gray-300 capitalize">
              {key}
            </label>
            <VariablePicker
              currentNodeId={id}
              onSelect={(val) => handleConfigUpdate(key, (value || "") + val)}
            />
          </div>
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
                const width = 500;
                const height = 600;
                const left = window.screen.width / 2 - width / 2;
                const top = window.screen.height / 2 - height / 2;

                const userId = getUserId();
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

    if (key === "operation") {
      let options: string[] = [];
      if (data.nodeType === "google_sheets") {
        options = ["read_sheet", "append_row", "clear_sheet"];
      } else if (data.nodeType === "google_docs") {
        options = ["create_doc", "read_text", "append_text"];
      } else if (data.nodeType === "google_gmail") {
        options = ["send_email", "read_emails", "modify_labels", "move_to_spam"];
      } else {
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

    if (key === "content" && data.nodeType === "google_docs") {
      const op = tempConfig["operation"] || "read_text";
      if (op === "read_text") return null;
    }
    if (key === "values" && data.nodeType === "google_sheets") {
      const op = tempConfig["operation"] || "read_sheet";
      if (["read_sheet", "clear_sheet"].includes(op)) return null;
    }
    if (data.nodeType === "ai" && ["system", "baseURL"].includes(key)) {
      return null;
    }

    if (data.nodeType === "google_gmail") {
      const op = tempConfig["operation"] || "send_email";
      if (op === "send_email" && ["query", "messageId", "addLabels", "removeLabels", "maxLabels"].includes(key)) return null;
      if (op === "read_emails" && ["to", "subject", "body", "messageId", "addLabels", "removeLabels"].includes(key)) return null;
      if (op === "modify_labels" && ["to", "subject", "body", "query"].includes(key)) return null;
      if (op === "move_to_spam" && ["to", "subject", "body", "query", "addLabels", "removeLabels", "maxLabels"].includes(key)) return null;

      if (key === "query" && op === "read_emails") {
        return (
          <div key={key} className="mb-2">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-gray-300">Search Query</label>
              <VariablePicker
                currentNodeId={id}
                onSelect={(val) => handleConfigUpdate(key, (value || "") + val)}
              />
            </div>
            <input
              type="text"
              value={value || "is:unread"}
              onChange={(e) => handleConfigUpdate(key, e.target.value)}
              className="w-full px-2 py-1 text-xs bg-[#0B0E14] text-white border border-gray-700 rounded focus:ring-1 focus:ring-[#3D5CFF] focus:border-[#3D5CFF] focus:outline-none nodrag"
              placeholder="e.g. is:unread"
            />
            <div className="text-[10px] text-gray-500 mt-1">Use -has:userlabels to avoid re-processing.</div>
          </div>
        );
      }

      if (key === "maxLabels") {
        return (
          <div key={key} className="mb-2">
            <label className="block text-xs font-medium text-gray-300 mb-1">Max Top Tags</label>
            <input
              type="number"
              value={value || 2}
              onChange={(e) => handleConfigUpdate(key, parseInt(e.target.value))}
              className="w-full px-2 py-1 text-xs bg-[#0B0E14] text-white border border-gray-700 rounded focus:ring-1 focus:ring-[#3D5CFF] focus:border-[#3D5CFF] focus:outline-none nodrag"
              placeholder="2"
            />
            <div className="text-[10px] text-gray-500 mt-1">Limits the number of AI tags added per email.</div>
          </div>
        );
      }
    }

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
          "meta-llama/Llama-3.3-70B-Instruct",
          "HuggingFaceH4/zephyr-7b-beta",
          "mistralai/Mistral-7B-Instruct-v0.3",
          "mistralai/Mixtral-8x7B-Instruct-v0.1",
          "deepseek-ai/DeepSeek-R1-Distill-Qwen-32B",
          "deepseek-ai/DeepSeek-R1-Distill-Llama-70B",
          "Qwen/Qwen2.5-72B-Instruct",
          "google/gemma-2-2b-it",
          "google/gemma-2-9b-it"
        ];
      } else if (data.nodeType === "ai") {
        models = [
          "gemini-2.5-flash",
          "gemini-2.5-pro",
          "gemini-2.5-flash-lite",
          "gemini-2.0-flash",
          "gemini-2.0-flash-001",
          "gemini-2.0-flash-lite",
          "gemini-2.0-flash-lite-001",
          "gemini-1.5-pro",
          "gemini-1.5-flash",
          "gemini-1.5-flash-8b"
        ];
      }

      const isThinkingSupported = value.includes("pro") || value.includes("2.5") || value.includes("thinking");

      return (
        <div key={key} className="mb-2">
          <label className="block text-xs font-medium text-gray-300 mb-1 capitalize">
            Model
          </label>
          <div className="flex flex-col gap-2">
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

            {isThinkingSupported && (
              <div className="flex items-center justify-between p-2 bg-[#0B0E14]/50 border border-gray-800 rounded">
                <div className="flex flex-col">
                  <span className="text-[10px] font-medium text-gray-300">Reasoning Mode (Thinking)</span>
                  <span className="text-[9px] text-gray-500 italic">Increases accuracy for complex tasks</span>
                </div>
                <div
                  className={`w-8 h-4 flex items-center bg-gray-700 rounded-full p-1 cursor-pointer transition-colors ${tempConfig.thinking ? 'bg-indigo-500' : ''}`}
                  onClick={() => handleConfigUpdate("thinking", !tempConfig.thinking)}
                >
                  <div className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${tempConfig.thinking ? 'translate-x-3' : 'translate-x-0'}`}></div>
                </div>
              </div>
            )}
          </div>
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

          <div className="mt-2 pt-2 border-t border-gray-800/50 flex flex-col gap-1">
            {value === "* * * * *" ? (
              <div className="text-[10px] text-indigo-400 font-medium animate-pulse flex justify-between">
                <span>Next run:</span>
                <span>{new Date(Math.ceil(Date.now() / 60000) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}:00</span>
              </div>
            ) : value ? (
              <div className="text-[10px] text-indigo-400 font-medium">
                Schedules at the next {currentPreset.toLowerCase().replace('every ', '')} mark.
              </div>
            ) : null}
          </div>
        </div>
      );
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

    // 7. SerpApi Engine Selector
    if (key === "engine" && data.nodeType === "serpapi") {
      const engines = [
        "google", "google_maps", "google_news", "google_scholar",
        "google_videos", "google_shopping", "google_images",
        "bing", "yahoo", "yandex", "duckduckgo", "naver", "baidu"
      ];

      return (
        <div key={key} className="mb-2">
          <label className="block text-xs font-medium text-gray-300 mb-1 capitalize">
            Search Engine
          </label>
          <select
            value={value || "google"}
            onChange={(e) => handleConfigUpdate(key, e.target.value)}
            className="w-full px-2 py-1 text-xs bg-[#0B0E14] text-white border border-gray-700 rounded focus:ring-1 focus:ring-[#3D5CFF] focus:border-[#3D5CFF] focus:outline-none nodrag"
          >
            {engines.map(eng => (
              <option key={eng} value={eng}>{eng.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>
      );
    }

    // 8. Boolean Toggle
    if (typeof value === "boolean") {
      return (
        <div key={key} className="mb-2 flex items-center justify-between">
          <label className="block text-xs font-medium text-gray-300 capitalize">
            {key.replace(/([A-Z])/g, " $1").trim()}
          </label>
          <div
            className={`w-8 h-4 flex items-center bg-gray-700 rounded-full p-1 cursor-pointer transition-colors ${value ? 'bg-indigo-500' : 'bg-gray-600'}`}
            onClick={() => handleConfigUpdate(key, !value)}
          >
            <div className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${value ? 'translate-x-3' : 'translate-x-0'}`}></div>
          </div>
        </div>
      );
    }

    if (key === "model_id" && data.nodeType === "elevenlabs") {
      const models = [
        { id: "eleven_multilingual_v2", name: "Multilingual V2 (New Default)" },
        { id: "eleven_turbo_v2", name: "Turbo V2 (Fastest)" },
        { id: "eleven_flash_v2", name: "Flash V2 (Cheapest)" },
        { id: "eleven_monolingual_v1", name: "Mono V1 (Legacy - Paid Only)" }
      ];
      return (
        <div key={key} className="mb-4">
          <label className="block text-xs font-semibold text-gray-300 mb-2">ElevenLabs Model</label>
          <select
            value={value || "eleven_multilingual_v2"}
            onChange={(e) => handleConfigUpdate(key, e.target.value)}
            className="w-full px-2 py-1.5 text-[10px] bg-[#0B0E14] text-white border border-gray-700 rounded focus:ring-1 focus:ring-[#3D5CFF] focus:outline-none"
          >
            {models.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <p className="text-[9px] text-gray-500 mt-1 italic">V2 is now required for Free Tier users.</p>
        </div>
      );
    }

    if (key === "voiceId" && data.nodeType === "elevenlabs") {
      const voices = [
        { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel (Female)" },
        { id: "pNInz6obpgDQGcFmaJgB", name: "Adam (Male)" },
        { id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh (Male)" },
        { id: "ErXwobaYiN019PkySvjV", name: "Antoni (Male)" },
        { id: "AZnzlk1XhkUvSbiU7S2S", name: "Nicole (Female)" },
        { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella (Female)" }
      ];

      return (
        <div key={key} className="mb-4">
          <label className="block text-xs font-semibold text-gray-300 mb-2">Select Voice</label>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {voices.map(v => (
              <button
                key={v.id}
                onClick={() => handleConfigUpdate(key, v.id)}
                className={`flex items-center space-x-2 p-2 rounded border transition-all text-left ${value === v.id ? 'bg-[#3D5CFF] border-[#3D5CFF] text-white shadow-[0_0_10px_rgba(61,92,255,0.4)]' : 'bg-[#0B0E14] border-gray-800 text-gray-400 hover:border-gray-600'}`}
              >
                <div className={`w-2 h-2 rounded-full ${value === v.id ? 'bg-white blink' : 'bg-gray-600'}`}></div>
                <span className="text-[10px] font-medium">{v.name}</span>
              </button>
            ))}
          </div>
          <div className="mt-2">
            <input
              type="text"
              value={value}
              onChange={(e) => handleConfigUpdate(key, e.target.value)}
              placeholder="Custom Voice ID..."
              className="w-full px-2 py-1.5 text-[10px] bg-[#0B0E14] text-white border border-gray-700 rounded focus:ring-1 focus:ring-[#3D5CFF] focus:outline-none placeholder-gray-600"
            />
          </div>
          <div className="mt-3 bg-indigo-500/10 border border-indigo-500/20 p-2 rounded">
            <p className="text-[10px] text-indigo-300">
              ⚠️ <strong>Free Tier Note:</strong> Some voices might require a paid plan. If the generation fails, try <strong>Rachel</strong> or <strong>Adam</strong> with <strong>Mono V1</strong>.
            </p>
          </div>
        </div>
      );
    }

    // 8. Default Input
    return (
      <div key={key} className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-medium text-gray-300 capitalize">
            {key.replace(/([A-Z])/g, " $1").trim()}
          </label>
          <VariablePicker
            currentNodeId={id}
            onSelect={(val) => handleConfigUpdate(key, (value || "") + val)}
          />
        </div>
        <input
          type={inputType}
          value={value || ""}
          onChange={(e) =>
            handleConfigUpdate(
              key,
              inputType === "number" ? Number(e.target.value) : e.target.value
            )
          }
          className="w-full px-2 py-1 text-xs bg-[#0B0E14] text-white border border-gray-700 rounded focus:ring-1 focus:ring-[#3D5CFF] focus:border-[#3D5CFF] focus:outline-none nodrag"
          placeholder={`Enter ${key}...`}
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
            data.lastRun?.status === 'RUNNING' ? "border-blue-500 animate-run-glow animate-scanning shadow-blue-900/40" :
              selected ? "border-[#3D5CFF] shadow-blue-900/20" : "border-gray-800 hover:border-gray-700"
        }
        ${isConfigOpen ? "shadow-xl" : ""}
        ${!(tempConfig.active ?? true) ? "opacity-60 grayscale-[0.5] border-dashed" : ""}
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
          <div className="flex items-center space-x-2">
            <div className="text-xs text-gray-400 capitalize">
              {data.nodeType}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleConfigUpdate("active", !(tempConfig.active ?? true));
              }}
              className={`p-0.5 rounded-full transition-all duration-200 ${(tempConfig.active ?? true) ? "text-green-500 hover:bg-green-500/10" : "text-gray-500 hover:bg-red-500/10 hover:text-red-500"
                }`}
              title={(tempConfig.active ?? true) ? "Deactivate Step" : "Activate Step"}
            >
              <Power className={`w-3 h-3 ${!(tempConfig.active ?? true) ? "opacity-30" : "opacity-100"}`} />
            </button>
          </div>
          {data.nodeType === "cron" && (tempConfig.active ?? true) && (
            <div className="mt-1 text-[10px] text-indigo-400 font-bold animate-pulse flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
              <span>Next: {new Date(Math.ceil(Date.now() / 60000) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}:00</span>
            </div>
          )}
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

      {/* Configuration Panel - Full Screen Modal */}
      {isConfigOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 nodrag"
          onClick={(e) => { e.stopPropagation(); setIsConfigOpen(false); }}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', margin: 0, padding: 0 }}
        >
          <div
            className="flex flex-col bg-[#0B0E14] border border-gray-700/50 rounded-xl shadow-2xl text-white overflow-hidden transform transition-all"
            style={{ width: '95vw', height: '95vh', maxWidth: 'none', margin: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#151C2F]">
              <div className="flex items-center space-x-3">
                <div className={`${getNodeColor(data.nodeType)} p-2 rounded-full text-white`}>
                  {getNodeIcon(data.nodeType)}
                </div>
                <h2 className="text-xl font-semibold text-white">Configuration: {data.label}</h2>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setIsConfigOpen(false); }} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors flex items-center justify-center" title="Close">
                <X className="w-6 h-6 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-auto p-6 md:p-10 bg-[#0B0E14]">
              <div className="max-w-4xl mx-auto space-y-8">
                <div className="bg-[#151C2F] p-6 rounded-lg border border-gray-800 space-y-6">
                  <h3 className="text-lg font-medium text-white mb-4 border-b border-gray-800 pb-2">Core Settings</h3>
                  <div className="space-y-4">
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
                    onClick={(e) => {
                      e.stopPropagation();
                      const newKey = prompt("Enter configuration key:");
                      if (newKey && !tempConfig[newKey]) {
                        handleConfigUpdate(newKey, "");
                      }
                    }}
                    className="w-full py-3 text-sm font-medium text-[#3D5CFF] border-2 border-dashed border-[#3D5CFF]/30 rounded-lg hover:bg-[#3D5CFF]/10 transition-colors duration-200 mt-6"
                  >
                    + Add Configuration
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-800 bg-[#151C2F] flex justify-end">
              <button onClick={(e) => { e.stopPropagation(); setIsConfigOpen(false); }} className="px-6 py-2 bg-[#3D5CFF] text-white rounded hover:bg-blue-600 transition-colors">
                Done
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Result Preview Area */}
      {data.lastRun?.status === 'success' && (
        <ResultPreview output={data.lastRun.output} />
      )}

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
