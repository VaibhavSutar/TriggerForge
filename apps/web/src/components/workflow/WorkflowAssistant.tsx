"use client";

import React, { useState } from "react";
import { Sparkles, X, Send, Brain, Bot, MessageSquare, Zap } from "lucide-react";
import { WorkflowTemplate } from "@/data/templates";
import { ConnectorManifest } from "@/app/types/workflow";

interface WorkflowAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTemplate: (template: WorkflowTemplate) => void;
  connectors: ConnectorManifest[];
}

export const WorkflowAssistant: React.FC<WorkflowAssistantProps> = ({
  isOpen,
  onClose,
  onAddTemplate,
  connectors
}) => {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai', message: string }[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setChatHistory(prev => [...prev, { role: 'user', message: prompt }]);
    
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
          prompt, 
          userId,
          // Pass connectors metadata for RAG-like generation
          connectors: connectors.map(c => ({ id: c.id, title: c.title }))
        }),
      });

      if (!res.ok) {
        throw new Error(`API Error ${res.status}`);
      }

      const data = await res.json();

      if (data.ok && data.workflow) {
        const template: WorkflowTemplate = {
          id: `ai-gen-${Date.now()}`,
          name: "Generated Workflow",
          description: prompt,
          nodes: data.workflow.nodes,
          edges: data.workflow.edges
        };
        
        onAddTemplate(template);
        setChatHistory(prev => [...prev, { role: 'ai', message: "I've generated the workflow for you! You can see it on the canvas now." }]);
        setPrompt("");
      } else {
        setChatHistory(prev => [...prev, { role: 'ai', message: "Sorry, I couldn't generate that workflow: " + (data.error || "Unknown error") }]);
      }
    } catch (e: any) {
      setChatHistory(prev => [...prev, { role: 'ai', message: "Error: " + e.message }]);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-20 right-4 w-96 bg-[#151C2F] border border-gray-800 rounded-xl shadow-2xl z-[60] flex flex-col max-h-[70vh] animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-[#0B0E14] rounded-t-xl">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-purple-500/20 rounded-lg">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">AI Workflow Assistant</h3>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Powered by Gemini RAG</p>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {chatHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center space-y-3">
            <div className="p-4 bg-purple-500/5 rounded-full border border-purple-500/10">
              <Brain className="w-8 h-8 text-purple-500/50" />
            </div>
            <p className="text-xs text-gray-400 max-w-[200px]">
              Describe your goal, and I'll build the workflow using available connectors.
            </p>
          </div>
        ) : (
          chatHistory.map((chat, i) => (
            <div key={i} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-lg text-xs leading-relaxed ${
                chat.role === 'user' 
                  ? 'bg-purple-600 text-white rounded-tr-none' 
                  : 'bg-[#0B0E14] text-gray-300 border border-gray-800 rounded-tl-none'
              }`}>
                {chat.message}
              </div>
            </div>
          ))
        )}
        {isGenerating && (
          <div className="flex justify-start">
            <div className="bg-[#0B0E14] text-gray-400 border border-gray-800 p-3 rounded-lg rounded-tl-none flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-tighter">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-800 bg-[#0B0E14] rounded-b-xl">
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleGenerate();
              }
            }}
            placeholder="Type your workflow goal..."
            className="w-full bg-[#151C2F] border border-gray-700 rounded-lg pl-3 pr-10 py-2.5 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500 transition-all resize-none h-20"
          />
          <button 
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="absolute right-2 bottom-2 p-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px] text-gray-500">
           <div className="flex items-center gap-1">
             <Zap className="w-3 h-3 text-yellow-500" />
             <span>{connectors.length} Connectors indexed</span>
           </div>
           <span>Press Enter to send</span>
        </div>
      </div>
    </div>
  );
};
