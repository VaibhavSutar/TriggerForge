import React, { useState } from 'react';
import ReactJson from 'react-json-view';

interface DataInspectorProps {
    inputData: any;
    outputData: any;
    isVisible: boolean;
    onClose: () => void;
}

export const DataInspector: React.FC<DataInspectorProps> = ({ inputData, outputData, isVisible, onClose }) => {
    const [activeTab, setActiveTab] = useState<'input' | 'output'>('output');

    if (!isVisible) return null;

    return (
        <div className="flex flex-col h-64 border-t border-gray-800 bg-[#0B0E14] text-white">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-[#151C2F]">
                <div className="flex space-x-4">
                    <button
                        onClick={() => setActiveTab('input')}
                        className={`text-xs font-semibold px-2 py-1 rounded ${activeTab === 'input' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        Input
                    </button>
                    <button
                        onClick={() => setActiveTab('output')}
                        className={`text-xs font-semibold px-2 py-1 rounded ${activeTab === 'output' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        Output
                    </button>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-white">
                    ✕
                </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
                <ReactJson
                    src={activeTab === 'input' ? inputData : outputData}
                    theme="ocean"
                    collapsed={1}
                    displayDataTypes={false}
                    enableClipboard={true}
                    style={{ backgroundColor: 'transparent', fontSize: '11px' }}
                />
            </div>
        </div>
    );
};
