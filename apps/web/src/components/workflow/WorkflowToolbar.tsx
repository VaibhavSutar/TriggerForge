"use client";

import React, { useState } from 'react';
import { Plus, Save, Play, Settings, Download, Upload, Edit2, Check, X } from 'lucide-react';

interface WorkflowToolbarProps {
  workflowName: string;
  onSave: () => void;
  onAddNode: () => void;
  onNameChange: (name: string) => void;
  onRun?: () => void;
}

export const WorkflowToolbar: React.FC<WorkflowToolbarProps> = ({ 
  workflowName, 
  onSave, 
  onAddNode, 
  onNameChange,
  onRun 
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(workflowName);
  const [isSaving, setIsSaving] = useState(false);

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
    <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
      <div className="bg-white shadow-lg rounded-lg border border-gray-200 p-3 flex items-center space-x-4">
        {/* Workflow Name */}
        <div className="flex items-center space-x-2">
          {isEditingName ? (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="text-lg font-semibold bg-transparent border-b-2 border-blue-500 focus:outline-none min-w-[200px]"
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
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={handleNameCancel}
                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div 
              className="flex items-center space-x-2 cursor-pointer group"
              onClick={() => setIsEditingName(true)}
            >
              <h1 className="text-lg font-semibold text-gray-900">{workflowName}</h1>
              <Edit2 className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-gray-200" />

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onAddNode}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Add Node</span>
          </button>
          
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center space-x-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
          >
            <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
            <span className="text-sm">{isSaving ? 'Saving...' : 'Save'}</span>
          </button>
          
          {onRun && (
            <button
              onClick={onRun}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
            >
              <Play className="w-4 h-4" />
              <span className="text-sm">Run</span>
            </button>
          )}
          
          <button className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200 transform hover:scale-105">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Status indicator */}
      <div className="bg-white shadow-lg rounded-lg border border-gray-200 px-3 py-2">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">Ready</span>
        </div>
      </div>
    </div>
  );
};