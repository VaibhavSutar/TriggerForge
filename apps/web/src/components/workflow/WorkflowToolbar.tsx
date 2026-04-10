"use client";

import React, { useState } from 'react';
import { Plus, Save, Play, Settings, Download, Upload, Edit2, Check, X, Home, Sparkles, Clock, Shield } from 'lucide-react';
import { useRouter } from "next/navigation";

export interface WorkflowToolbarProps {
  workflowName: string;
  onSave: (nodesToSave?: any[]) => Promise<void>;
  onAddNode: () => void;
  onNameChange: (name: string) => void;
  onRun?: () => void;
  onStop?: () => void;
  isRunning?: boolean;
  onImport?: () => void;
  onExport?: () => void;
  onToggleAssistant?: () => void;
  isAssistantOpen?: boolean;
  onToggleWalkthrough?: () => void;
  onToggleHistory?: () => void;
  isHistoryOpen?: boolean;
  onToggleReport?: () => void;
  isReportOpen?: boolean;
}

export const WorkflowToolbar: React.FC<WorkflowToolbarProps> = (props) => {
  const {
    workflowName,
    onSave,
    onAddNode,
    onNameChange,
    onRun,
    onStop,
    isRunning
  } = props;
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(workflowName);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const handleNameSave = () => {
    onNameChange(tempName);
    setIsEditingName(false);
  };

  const handleNameCancel = () => {
    setTempName(workflowName);
    setIsEditingName(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSave();
    setIsSaving(false);
  };

  return (
    <div className="absolute top-4 left-4 right-4 z-[100] flex items-center justify-between pointer-events-none" data-tour="toolbar-main">
      {/* Main Toolbar */}
      <div className="bg-slate-900/70 backdrop-blur-xl shadow-2xl rounded-2xl border border-white/10 p-2 flex items-center space-x-3 transition-all duration-300 pointer-events-auto">
        
        {/* Home Button */}
        <button
          onClick={() => router.push("/dashboard")}
          className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 tooltip-trigger group relative"
          title="Home"
        >
          <Home className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
        </button>

        <div className="w-px h-6 bg-white/10" />

        {/* Workflow Name */}
        <div className="flex items-center min-w-[200px]">
          {isEditingName ? (
            <div className="flex items-center space-x-1.5 bg-black/40 p-1 rounded-xl border border-white/10 shadow-inner w-full">
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="text-[15px] font-medium bg-transparent text-white focus:outline-none w-full px-2 placeholder-white/30"
                placeholder="Workflow name..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNameSave();
                  if (e.key === 'Escape') handleNameCancel();
                }}
                autoFocus
              />
              <button
                onClick={handleNameSave}
                className="p-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 hover:text-emerald-300 rounded-lg transition-colors duration-200"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={handleNameCancel}
                className="p-1.5 bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 hover:text-rose-300 rounded-lg transition-colors duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              className="flex items-center space-x-2 cursor-pointer group px-3 py-1.5 rounded-xl hover:bg-white/5 transition-colors duration-200 border border-transparent hover:border-white/5 max-w-[300px]"
              onClick={() => setIsEditingName(true)}
            >
              <h1 className="text-[15px] font-medium text-slate-200 group-hover:text-white transition-colors truncate">
                {workflowName}
              </h1>
              <Edit2 className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors duration-200 flex-shrink-0" />
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-white/10" />

        {/* Primary Actions */}
        <div className="flex items-center space-x-2.5">
          <button
            data-tour="add-node-btn"
            onClick={onAddNode}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-500 hover:to-indigo-500 transition-all duration-300 shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 border border-indigo-500/30"
          >
            <Plus className="w-4 h-4 font-bold" />
            <span className="text-sm font-semibold tracking-wide">Add Node</span>
          </button>

          <button
            data-tour="assistant-toggle"
            onClick={props.onToggleAssistant}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 shadow-lg ${
              props.isAssistantOpen
                ? 'bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-[0_0_20px_rgba(192,38,211,0.4)] border border-fuchsia-500/50'
                : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:border-fuchsia-500/30 hover:text-fuchsia-300'
            }`}
          >
            <Sparkles className={`w-4 h-4 ${props.isAssistantOpen ? 'animate-pulse text-white' : 'text-fuchsia-400 group-hover:text-fuchsia-300'}`} />
            <span className="text-sm font-semibold tracking-wide">Assistant</span>
          </button>
        </div>

        <div className="w-px h-6 bg-white/10" />

        {/* Run/Stop & Save */}
        <div className="flex items-center space-x-2.5">
          {isRunning ? (
            <button
              data-tour="run-workflow-btn"
              onClick={onStop}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-rose-600 to-red-500 text-white rounded-xl hover:from-rose-500 hover:to-red-400 transition-all duration-300 shadow-[0_0_15px_rgba(225,29,72,0.3)] hover:shadow-[0_0_25px_rgba(225,29,72,0.5)] transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 border border-rose-500/30"
            >
              <X className="w-4 h-4 stroke-[3px]" />
              <span className="text-sm font-bold tracking-wider uppercase">Stop</span>
            </button>
          ) : (
            <button
              data-tour="run-workflow-btn"
              onClick={onRun}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-xl hover:from-emerald-500 hover:to-teal-400 transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 border border-emerald-500/30"
            >
              <Play className="w-4 h-4 fill-current stroke-current" />
              <span className="text-sm font-bold tracking-wider uppercase">Run</span>
            </button>
          )}

          <button
            data-tour="save-workflow-btn"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center space-x-2 px-4 py-2 text-slate-300 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:text-white transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">{isSaving ? 'Saving...' : 'Save'}</span>
          </button>
        </div>

        <div className="w-px h-6 bg-white/10" />

        {/* Secondary Actions */}
        <div className="flex items-center space-x-1">
          <button
            onClick={props.onToggleWalkthrough}
            className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-xl transition-all duration-200 group"
            title="Start Walkthrough"
          >
            <Sparkles className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
          </button>

          <button
            onClick={props.onToggleHistory}
            className={`p-2 rounded-xl transition-all duration-200 group ${props.isHistoryOpen ? 'text-blue-400 bg-blue-500/10' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
            title="Execution History"
          >
            <Clock className="w-4 h-4 group-hover:rotate-12 transition-transform" />
          </button>

          <button
            onClick={props.onToggleReport}
            className={`p-2 rounded-xl transition-all duration-200 group ${props.isReportOpen ? 'text-green-400 bg-green-500/10' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
            title="Safety Report"
          >
            <Shield className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </button>
          
          <button
            onClick={props.onExport}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 group"
            title="Export JSON"
          >
            <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
          </button>

          <button
            onClick={props.onImport}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 group"
            title="Import JSON"
          >
            <Upload className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
          </button>

          <button className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 group">
            <Settings className="w-4 h-4 group-hover:rotate-45 transition-transform duration-300" />
          </button>
        </div>
      </div>

      {/* Status indicator */}
      <div className="bg-slate-900/70 backdrop-blur-xl shadow-2xl rounded-2xl border border-white/10 px-4 py-2.5 flex items-center space-x-3 transition-all duration-300 pointer-events-auto">
        <div className="relative flex items-center justify-center">
          <div className={`w-2.5 h-2.5 rounded-full z-10 transition-colors duration-300 ${isRunning ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]' : 'bg-slate-500'}`}></div>
          {isRunning && (
            <div className="absolute w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping opacity-75"></div>
          )}
        </div>
        <span className={`text-[12px] font-bold uppercase tracking-wider transition-colors duration-300 ${isRunning ? 'text-emerald-400' : 'text-slate-400'}`}>
          {isRunning ? 'Running' : 'Ready'}
        </span>
      </div>
    </div>
  );
};