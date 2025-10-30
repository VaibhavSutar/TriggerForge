"use client";
import React, { useState } from 'react';
import { X, Play, Clock, Mail, Webhook, Database, Code, Filter, Search } from 'lucide-react';
const nodeTypes = [
    {
        id: 'trigger',
        name: 'Trigger',
        description: 'Start your workflow',
        icon: <Play className="w-5 h-5"/>,
        color: 'bg-green-500',
        category: 'Core',
        config: { event: 'manual' }
    },
    {
        id: 'print',
        name: 'Print',
        description: 'Print messages to console',
        icon: <Code className="w-5 h-5"/>,
        color: 'bg-gray-600',
        category: 'Core',
        config: { message: 'Hello World!' }
    },
    {
        id: 'delay',
        name: 'Delay',
        description: 'Add delays to workflow',
        icon: <Clock className="w-5 h-5"/>,
        color: 'bg-blue-500',
        category: 'Core',
        config: { ms: 1000 }
    },
    {
        id: 'condition',
        name: 'Condition',
        description: 'Conditional logic branching',
        icon: <Filter className="w-5 h-5"/>,
        color: 'bg-orange-500',
        category: 'Logic',
        config: { expression: '{{input}} > 0' }
    },
    {
        id: 'random',
        name: 'Random',
        description: 'Generate random numbers',
        icon: <Code className="w-5 h-5"/>,
        color: 'bg-indigo-500',
        category: 'Utilities',
        config: { min: 1, max: 10 }
    },
    {
        id: 'http',
        name: 'HTTP Request',
        description: 'Make HTTP requests',
        icon: <Webhook className="w-5 h-5"/>,
        color: 'bg-purple-500',
        category: 'Network',
        config: { url: 'https://api.example.com', method: 'GET' }
    },
    {
        id: 'email',
        name: 'Email',
        description: 'Send emails',
        icon: <Mail className="w-5 h-5"/>,
        color: 'bg-red-500',
        category: 'Communication',
        config: { to: '', subject: '', body: '' }
    },
    {
        id: 'database',
        name: 'Database',
        description: 'Database operations',
        icon: <Database className="w-5 h-5"/>,
        color: 'bg-yellow-500',
        category: 'Data',
        config: { query: 'SELECT * FROM table', connection: '' }
    },
];
export const NodeSidebar = ({ isOpen, onClose, onAddNode }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const categories = ['All', ...Array.from(new Set(nodeTypes.map(node => node.category)))];
    const filteredNodes = nodeTypes.filter(node => {
        const matchesSearch = node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            node.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || node.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });
    const handleAddNode = (nodeType) => {
        onAddNode(nodeType.id);
    };
    return (<div className={`
      fixed right-0 top-0 h-full w-80 bg-white shadow-2xl border-l border-gray-200 z-20
      transform transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : 'translate-x-full'}
    `}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Add Node</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg transition-colors duration-200">
              <X className="w-5 h-5 text-gray-500"/>
            </button>
          </div>
          
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"/>
            <input type="text" placeholder="Search nodes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"/>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (<button key={category} onClick={() => setSelectedCategory(category)} className={`
                  px-3 py-1 text-xs rounded-full border transition-all duration-200
                  ${selectedCategory === category
                ? 'bg-blue-100 border-blue-300 text-blue-700'
                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}
                `}>
                {category}
              </button>))}
          </div>
        </div>
        
        {/* Node List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {filteredNodes.map((nodeType, index) => (<div key={nodeType.id} className={`
                  transform transition-all duration-300 ease-out
                  ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'}
                `} style={{ transitionDelay: `${index * 50}ms` }}>
                <button onClick={() => handleAddNode(nodeType)} className="w-full p-4 text-left border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 hover:shadow-md transition-all duration-200 transform hover:scale-[1.02] group">
                  <div className="flex items-center space-x-3">
                    <div className={`
                      p-3 rounded-xl ${nodeType.color} text-white 
                      group-hover:scale-110 transition-transform duration-200
                    `}>
                      {nodeType.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                        {nodeType.name}
                      </div>
                      <div className="text-sm text-gray-500 line-clamp-2">
                        {nodeType.description}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {nodeType.category}
                      </div>
                    </div>
                  </div>
                </button>
              </div>))}
          </div>

          {filteredNodes.length === 0 && (<div className="text-center py-8">
              <div className="text-gray-500 mb-2">No nodes found</div>
              <div className="text-sm text-gray-400">Try adjusting your search or category filter</div>
            </div>)}
        </div>
      </div>
    </div>);
};
