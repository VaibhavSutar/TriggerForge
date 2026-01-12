"use client";

import React, { useState } from 'react';
import { Plus, Save, Play, Settings, Download, Upload, Edit2, Check, X, Home } from 'lucide-react';
import { useRouter } from "next/navigation";
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

           
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center space-x-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
          >
            <Home className={`w-4 h-4 `} />
            <span className="text-sm">{'Home'}</span>
          </button>
          {/* <button
            onClick={() => router.push("/dashboard")}
            className="absolute top-4 left-4 p-2 bg-white hover:bg-gray-100 rounded-full shadow-md"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-600"
              fill="none"
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          </button>
           */}
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