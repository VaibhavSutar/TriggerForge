import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import ReactJson from 'react-json-view';
import { Maximize2, Minimize2, X } from 'lucide-react';

interface DataInspectorProps {
    inputData: any;
    outputData: any;
    isVisible: boolean;
    onClose: () => void;
}

export const DataInspector: React.FC<DataInspectorProps> = ({ inputData, outputData, isVisible, onClose }) => {
    const [activeTab, setActiveTab] = useState<'input' | 'output'>('output');
    const [isExpanded, setIsExpanded] = useState(false);

    if (!isVisible) return null;

    const rawData = activeTab === 'input' ? inputData : outputData;
    const safeData = typeof rawData === 'object' && rawData !== null ? rawData : { value: rawData };

    const handleTabClick = (e: React.MouseEvent, tab: 'input' | 'output') => {
        e.stopPropagation();
        e.preventDefault();
        setActiveTab(tab);
    };

    const handleToggleExpand = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setIsExpanded(!isExpanded);
    };

    const handleClose = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        onClose();
    };

    const content = (
        <>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-[#151C2F]">
                <div className="flex space-x-4">
                    <button
                        onClick={(e) => handleTabClick(e, 'input')}
                        className={`text-sm font-semibold px-3 py-1.5 rounded transition-colors ${activeTab === 'input' ? 'bg-[#3D5CFF] text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        Input
                    </button>
                    <button
                        onClick={(e) => handleTabClick(e, 'output')}
                        className={`text-sm font-semibold px-3 py-1.5 rounded transition-colors ${activeTab === 'output' ? 'bg-[#3D5CFF] text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        Output
                    </button>
                </div>
                <div className="flex items-center space-x-4">
                    <button 
                        onClick={handleToggleExpand} 
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors flex items-center justify-center"
                        title={isExpanded ? "Minimize" : "Maximize"}
                    >
                        {isExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                    <button onClick={handleClose} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors flex items-center justify-center" title="Close">
                        <X className={isExpanded ? "w-6 h-6 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded" : "w-4 h-4"} />
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-auto p-6" onClick={(e) => e.stopPropagation()}>
                <ReactJson
                    src={safeData}
                    theme="ocean"
                    collapsed={isExpanded ? 2 : 1}
                    displayDataTypes={false}
                    enableClipboard={true}
                    style={{ backgroundColor: 'transparent', fontSize: isExpanded ? '15px' : '11px', fontFamily: 'monospace' }}
                />
            </div>
        </>
    );

    if (isExpanded) {
        // Portal it to document.body so it breaks out of React Flow node scaling/clipping completely
        return createPortal(
            <div 
                className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 nodrag"
                onClick={(e) => e.stopPropagation()}
                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', margin: 0, padding: 0 }}
            >
                <div 
                    className="flex flex-col bg-[#0B0E14] border border-gray-700/50 rounded-xl shadow-2xl text-white overflow-hidden transform transition-all"
                    style={{ width: '95vw', height: '95vh', maxWidth: 'none', margin: 'auto' }}
                >
                    {content}
                </div>
            </div>,
            document.body
        );
    }

    return (
        <div 
            className="flex flex-col h-64 border-t border-gray-800 bg-[#0B0E14] text-white nodrag"
            onClick={(e) => e.stopPropagation()}
        >
            {content}
        </div>
    );
};
