"use client";

import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Settings, Trash2, Play, Clock, Mail, Webhook, Database, Code, Filter, Edit2, Check, X } from 'lucide-react';

const getNodeIcon = (nodeType: string) => {
  switch (nodeType) {
    case 'trigger':
      return <Play className="w-4 h-4" />;
    case 'timer':
      return <Clock className="w-4 h-4" />;
    case 'email':
      return <Mail className="w-4 h-4" />;
    case 'webhook':
      return <Webhook className="w-4 h-4" />;
    case 'database':
      return <Database className="w-4 h-4" />;
    case 'print':
      return <Code className="w-4 h-4" />;
    case 'http':
      return <Webhook className="w-4 h-4" />;
    case 'condition':
      return <Filter className="w-4 h-4" />;
    case 'delay':
      return <Clock className="w-4 h-4" />;
    case 'random':
      return <Settings className="w-4 h-4" />;
    default:
      return <Settings className="w-4 h-4" />;
  }
};

const getNodeColor = (nodeType: string) => {
  switch (nodeType) {
    case 'trigger':
      return 'bg-green-500';
    case 'timer':
    case 'delay':
      return 'bg-blue-500';
    case 'email':
      return 'bg-red-500';
    case 'webhook':
    case 'http':
      return 'bg-purple-500';
    case 'database':
      return 'bg-yellow-500';
    case 'print':
      return 'bg-gray-600';
    case 'condition':
      return 'bg-orange-500';
    case 'random':
      return 'bg-indigo-500';
    default:
      return 'bg-gray-500';
  }
};

interface NodeData {
  label: string;
  nodeType: string;
  config: Record<string, any>;
  onUpdate?: (id: string, data: Partial<NodeData>) => void;
}

export const WorkflowNode = memo(({ id, data, selected }: NodeProps<NodeData>) => {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(data.label);
  const [tempConfig, setTempConfig] = useState(data.config);

  const handleNameSave = () => {
    if (data.onUpdate) {
      data.onUpdate(id, { label: tempName });
    }
    setIsEditingName(false);
  };

  const handleNameCancel = () => {
    setTempName(data.label);
    setIsEditingName(false);
  };

  const handleConfigUpdate = (key: string, value: any) => {
    const newConfig = { ...tempConfig, [key]: value };
    setTempConfig(newConfig);
    if (data.onUpdate) {
      data.onUpdate(id, { config: newConfig });
    }
  };

  const renderConfigInput = (key: string, value: any) => {
    const inputType = typeof value === 'number' ? 'number' : 'text';
    
    return (
      <div key={key} className="mb-2">
        <label className="block text-xs font-medium text-gray-700 mb-1 capitalize">
          {key.replace(/([A-Z])/g, ' $1').trim()}
        </label>
        <input
          type={inputType}
          value={value || ''}
          onChange={(e) => handleConfigUpdate(key, inputType === 'number' ? Number(e.target.value) : e.target.value)}
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          placeholder={`Enter ${key}`}
        />
      </div>
    );
  };

  return (
    <div className={`
      px-4 py-3 shadow-lg rounded-lg bg-white border-2 min-w-[180px] max-w-[280px]
      transform transition-all duration-300 ease-in-out hover:scale-105
      ${selected ? 'border-blue-500 shadow-blue-200' : 'border-gray-200 hover:border-gray-300'}
      ${isConfigOpen ? 'shadow-xl' : ''}
    `}>
      <Handle 
        type="target" 
        position={Position.Top} 
        className="w-3 h-3 transition-all duration-200 hover:scale-125" 
        style={{ background: '#6366f1' }}
      />
      
      <div className="flex items-center space-x-3 mb-2">
        <div className={`
          p-2 rounded-full ${getNodeColor(data.nodeType)} text-white 
          transform transition-all duration-300 ease-in-out
          ${selected ? 'scale-110 shadow-md' : ''}
        `}>
          {getNodeIcon(data.nodeType)}
        </div>
        
        <div className="flex-1 min-w-0">
          {isEditingName ? (
            <div className="flex items-center space-x-1">
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="flex-1 text-sm font-medium bg-transparent border-b border-blue-500 focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNameSave();
                  if (e.key === 'Escape') handleNameCancel();
                }}
                autoFocus
              />
              <button
                onClick={handleNameSave}
                className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors duration-200"
              >
                <Check className="w-3 h-3" />
              </button>
              <button
                onClick={handleNameCancel}
                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div 
              className="flex items-center space-x-1 cursor-pointer group"
              onClick={() => setIsEditingName(true)}
            >
              <div className="text-sm font-medium text-gray-900 truncate">{data.label}</div>
              <Edit2 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </div>
          )}
          <div className="text-xs text-gray-500 capitalize">{data.nodeType}</div>
        </div>
        
        <button
          onClick={() => setIsConfigOpen(!isConfigOpen)}
          className={`
            p-1.5 rounded transition-all duration-200
            ${isConfigOpen ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}
          `}
        >
          <Settings className="w-3 h-3" />
        </button>
      </div>

      {/* Configuration Panel */}
      <div className={`
        overflow-hidden transition-all duration-300 ease-in-out
        ${isConfigOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
      `}>
        <div className="pt-2 border-t border-gray-100">
          <div className="text-xs font-medium text-gray-700 mb-2">Configuration</div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {Object.entries(tempConfig).map(([key, value]) => renderConfigInput(key, value))}
            
            {/* Add new config field */}
            <button
              onClick={() => {
                const newKey = prompt('Enter configuration key:');
                if (newKey && !tempConfig[newKey]) {
                  handleConfigUpdate(newKey, '');
                }
              }}
              className="w-full py-1 text-xs text-blue-600 border border-dashed border-blue-300 rounded hover:bg-blue-50 transition-colors duration-200"
            >
              + Add Configuration
            </button>
          </div>
        </div>
      </div>

      {/* Status indicator */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-500">Ready</span>
        </div>
        {Object.keys(tempConfig).length > 0 && (
          <span className="text-xs text-gray-400">
            {Object.keys(tempConfig).length} config{Object.keys(tempConfig).length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="w-3 h-3 transition-all duration-200 hover:scale-125" 
        style={{ background: '#6366f1' }}
      />
    </div>
  );
});

WorkflowNode.displayName = 'WorkflowNode';