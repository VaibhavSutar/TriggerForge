"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, X, Send, Brain, Bot, MessageSquare, Zap } from "lucide-react";
import { WorkflowTemplate } from "@/data/templates";
import { ConnectorManifest } from "@/app/types/workflow";
import { getUserId } from "./WorkflowNode";

interface WorkflowAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTemplate: (template: WorkflowTemplate) => void;
  onModifyWorkflow: (nodes: any[], edges: any[]) => void;
  onReplaceWorkflow: (nodes: any[], edges: any[]) => void;
  onRunWorkflow: () => void;
  connectors: ConnectorManifest[];
  templates: WorkflowTemplate[];
  nodes: any[];
  edges: any[];
  logs: any[];
  isRunning: boolean;
}

export const WorkflowAssistant: React.FC<WorkflowAssistantProps> = ({
  isOpen,
  onClose,
  onAddTemplate,
  onModifyWorkflow,
  onReplaceWorkflow,
  onRunWorkflow,
  connectors,
  templates,
  nodes,
  edges,
  logs,
  isRunning
}) => {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasTriggeredRun, setHasTriggeredRun] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai', message: string, action?: string, suggestedTemplate?: string }[]>([]);

  // Monitor run completion for auto-analysis
  useEffect(() => {
    if (hasTriggeredRun && !isRunning && logs.length > 1) {
      setHasTriggeredRun(false);
      // Automatically ask AI to analyze the result
      handleAutoAnalyze();
    }
  }, [isRunning, hasTriggeredRun, logs.length]);

  const handleAutoAnalyze = async () => {
    const analysisPrompt = "The workflow run has completed. Please analyze the results in the latest execution logs and tell me if it was successful or if there are errors I need to fix.";

    setChatHistory(prev => [...prev, { role: 'ai', message: "Run complete! Analyzing the results for you..." }]);
    setIsGenerating(true);

    try {
      const userId = getUserId();
      const response = await fetch("http://localhost:4000/ai/generate-workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: analysisPrompt,
          userId,
          connectors: connectors.map(c => ({ id: c.id, title: c.title, defaultConfig: c.defaultConfig })),
          templates: templates.map(t => ({ id: t.id, name: t.name, description: t.description })),
          context: {
            nodes: nodes.map(n => ({ id: n.id, data: { label: n.data.label, nodeType: n.data.nodeType, config: n.data.config } })),
            edges: edges.map(e => ({ source: e.source, target: e.target, sourceHandle: e.sourceHandle })),
            logs: logs.slice(-10)
          }
        })
      });

      const data = await response.json();
      if (data.ok) {
        setChatHistory(prev => [...prev, {
          role: 'ai',
          message: data.message || "I've analyzed the logs. Here's what I found...",
          suggestedTemplate: data.suggestedTemplateId
        }]);
      }
    } catch (error: any) {
      console.error("Auto-analysis failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setChatHistory(prev => [...prev, { role: 'user', message: prompt }]);
    const currentPrompt = prompt;
    setPrompt("");

    try {
      let userId = "test-user-id";
      try {
        const userStr = localStorage.getItem("user");
        if (userStr) userId = JSON.parse(userStr).id || "test-user-id";
      } catch {
        userId = localStorage.getItem("user") || "test-user-id";
      }

      const res = await fetch("/api/ai/generate-workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: currentPrompt,
          userId,
          connectors: connectors.map(c => ({ id: c.id, title: c.title, defaultConfig: c.defaultConfig })),
          templates: templates.map(t => ({ id: t.id, name: t.name, description: t.description })),
          context: {
            nodes: nodes.map(n => ({ id: n.id, data: { label: n.data.label, nodeType: n.data.nodeType, config: n.data.config } })),
            edges: edges.map(e => ({ source: e.source, target: e.target, sourceHandle: e.sourceHandle })),
            logs: logs.slice(-30) // Increased for better context in looped workflows
          }
        }),
      });

      if (!res.ok) throw new Error(`API Error ${res.status}`);

      const data = await res.json();

      if (data.ok) {
        if (data.action === "REPLACE" && data.workflow) {
          onReplaceWorkflow(data.workflow.nodes, data.workflow.edges);
          setChatHistory(prev => [...prev, { role: 'ai', message: data.message || "I've rebuilt the workflow for you! Check the canvas." }]);
        } else if (data.action === "MODIFY" && data.workflow) {
          onModifyWorkflow(data.workflow.nodes, data.workflow.edges);
          setChatHistory(prev => [...prev, { role: 'ai', message: data.message || "I've updated the workflow as requested." }]);
        } else if (data.action === "RUN") {
          onRunWorkflow();
          setHasTriggeredRun(true);
          setChatHistory(prev => [...prev, { role: 'ai', message: data.message || "Starting the workflow execution now!" }]);
        } else {
          setChatHistory(prev => [...prev, {
            role: 'ai',
            message: data.message || "I've analyzed the workflow and logs. What would you like me to do next?",
            suggestedTemplate: data.suggestedTemplateId
          }]);
        }
      } else {
        setChatHistory(prev => [...prev, { role: 'ai', message: "Sorry, I encountered an issue: " + (data.error || "Unknown error") }]);
      }
    } catch (e: any) {
      setChatHistory(prev => [...prev, { role: 'ai', message: "Error: " + e.message }]);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-20 right-4 w-96 bg-[#151C2F] border border-gray-800 rounded-xl shadow-2xl z-[60] flex flex-col max-h-[75vh] animate-in fade-in slide-in-from-right-4 duration-300 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-[#0B0E14]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-[#0B0E14] rounded-full animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm tracking-tight">Agent Forge</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-1 h-1 bg-green-500 rounded-full" />
              <span className="text-[9px] text-gray-500 uppercase tracking-widest font-black">Active AI Agent</span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#0B0E14]/30">
        {chatHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 bg-purple-500/20 blur-2xl rounded-full" />
              <div className="relative p-5 bg-[#0B0E14] rounded-2xl border border-gray-800 shadow-xl">
                <Bot className="w-10 h-10 text-purple-500" />
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-white">How can I help today?</h4>
              <p className="text-[11px] text-gray-500 max-w-[220px] leading-relaxed mx-auto">
                I can create new workflows, edit existing nodes, or analyze logs to fix errors.
              </p>
            </div>

          </div>
        ) : (
          chatHistory.map((chat, i) => (
            <div key={i} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className={`max-w-[90%] p-3.5 rounded-2xl text-[11px] leading-relaxed shadow-sm ${chat.role === 'user'
                ? 'bg-purple-600 text-white rounded-tr-none'
                : 'bg-[#151C2F] text-gray-300 border border-gray-800 rounded-tl-none'
                }`}>
                {chat.message}
                {chat.suggestedTemplate && (
                  <div className="mt-3 p-3 bg-white/5 border border-white/10 rounded-xl space-y-2">
                    <p className="text-[10px] font-bold text-purple-400 uppercase tracking-tighter">Recommended Template</p>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-white max-w-[140px] truncate">{templates.find(t => t.id === chat.suggestedTemplate)?.name || chat.suggestedTemplate}</span>
                      <button
                        onClick={() => {
                          const t = templates.find(temp => temp.id === chat.suggestedTemplate);
                          if (t) onAddTemplate(t);
                        }}
                        className="px-2 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded text-[10px] font-bold transition-colors whitespace-nowrap"
                      >
                        Apply Template
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {isGenerating && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-[#151C2F] text-gray-400 border border-gray-800 p-3 rounded-2xl rounded-tl-none flex items-center gap-2.5">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-[9px] uppercase font-black tracking-widest text-purple-500/80">Agent Analyzing Context</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[#0B0E14] border-t border-gray-800">
        <div className="relative group">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleGenerate();
              }
            }}
            placeholder="Tell me what to build or fix..."
            className="w-full bg-[#151C2F] border border-gray-800 rounded-xl pl-4 pr-12 py-3 text-[11px] text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all resize-none h-24 shadow-inner"
          />
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="absolute right-2.5 bottom-2.5 p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-purple-500/20 group-hover:scale-105 active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-3 flex items-center justify-between text-[9px] font-bold text-gray-600">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-500/10 rounded-md border border-yellow-500/20">
              <Zap className="w-2.5 h-2.5 text-yellow-500" />
              <span className="text-yellow-500/80">{connectors.length} Nodes</span>
            </div>
            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-500/10 rounded-md border border-blue-500/20">
              <MessageSquare className="w-2.5 h-2.5 text-blue-500" />
              <span className="text-blue-500/80">{chatHistory.length} Turns</span>
            </div>
          </div>
          <span className="uppercase tracking-widest">Shift + Enter for new line</span>
        </div>
      </div>
    </div>
  );
};
