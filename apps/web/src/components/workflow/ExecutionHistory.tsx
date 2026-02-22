
import React, { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle2, XCircle, Clock, Loader2, RefreshCw } from "lucide-react";

interface Execution {
    id: string;
    status: "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELED";
    createdAt: string;
    input?: any;
    output?: any;
    logs?: any[];
}

export function ExecutionHistory({ workflowId }: { workflowId: string }) {
    const [executions, setExecutions] = useState<Execution[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null);

    const fetchExecutions = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/workflows/${workflowId}/executions`);
            const data = await res.json();
            if (data.ok) {
                setExecutions(data.executions);
            }
        } catch (err) {
            console.error("Failed to fetch history", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (workflowId) fetchExecutions();
    }, [workflowId]);

    return (
        <div className="flex h-full border-t border-gray-800 bg-[#0B0E14] text-white">
            {/* List */}
            <div className="w-1/3 border-r border-gray-800 flex flex-col">
                <div className="p-3 border-b border-gray-800 flex justify-between items-center bg-[#151C2F]">
                    <h3 className="font-semibold text-xs uppercase tracking-wider text-gray-400">Execution History</h3>
                    <button onClick={fetchExecutions} className="p-1 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-white">
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {executions.length === 0 && !loading && (
                        <div className="p-4 text-center text-gray-500 text-xs">No executions yet.</div>
                    )}
                    {executions.map((ex) => (
                        <button
                            key={ex.id}
                            onClick={() => setSelectedExecution(ex)}
                            className={`w-full text-left p-3 border-b border-gray-800 hover:bg-[#151C2F] transition-colors flex items-center justify-between group ${selectedExecution?.id === ex.id ? "bg-[#151C2F] border-l-2 border-l-[#3D5CFF]" : "border-l-2 border-l-transparent"
                                }`}
                        >
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    {ex.status === "SUCCEEDED" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                    {ex.status === "FAILED" && <XCircle className="w-4 h-4 text-red-500" />}
                                    {(ex.status === "RUNNING" || ex.status === "PENDING") && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
                                    <span className={`text-sm font-medium ${ex.status === "SUCCEEDED" ? "text-green-400" :
                                        ex.status === "FAILED" ? "text-red-400" : "text-blue-400"
                                        }`}>
                                        {ex.status}
                                    </span>
                                </div>
                                <div className="text-[10px] text-gray-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatDistanceToNow(new Date(ex.createdAt), { addSuffix: true })}
                                </div>
                            </div>
                            <div className="text-[10px] text-gray-600 font-mono group-hover:text-gray-400">
                                {ex.id.slice(0, 6)}...
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Detail View */}
            <div className="flex-1 flex flex-col bg-[#0B0E14] h-full overflow-hidden">
                {selectedExecution ? (
                    <div className="flex flex-col h-full">
                        <div className="p-3 border-b border-gray-800 bg-[#151C2F] flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <span className="font-mono text-xs text-gray-500">#{selectedExecution.id}</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${selectedExecution.status === "SUCCEEDED" ? "bg-green-500/10 text-green-500" :
                                    selectedExecution.status === "FAILED" ? "bg-red-500/10 text-red-500" :
                                        "bg-blue-500/10 text-blue-500"
                                    }`}>
                                    {selectedExecution.status}
                                </span>
                            </div>
                            <div className="text-xs text-gray-400">
                                {new Date(selectedExecution.createdAt).toLocaleString()}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-6">
                            {/* Input */}
                            <div>
                                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Input</h4>
                                <pre className="bg-[#151C2F] p-3 rounded border border-gray-800 text-xs font-mono text-gray-300 overflow-x-auto">
                                    {JSON.stringify(selectedExecution.input, null, 2)}
                                </pre>
                            </div>

                            {/* Output */}
                            <div>
                                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Output</h4>
                                <pre className="bg-[#151C2F] p-3 rounded border border-gray-800 text-xs font-mono text-gray-300 overflow-x-auto">
                                    {JSON.stringify(selectedExecution.output, null, 2)}
                                </pre>
                            </div>

                            {/* Logs */}
                            <div>
                                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Logs</h4>
                                <div className="space-y-1 font-mono text-xs">
                                    {Array.isArray(selectedExecution.logs) && selectedExecution.logs.map((log: any, i: number) => (
                                        <div key={i} className="flex gap-2 text-gray-400 border-b border-gray-800/50 pb-1 mb-1 last:border-0">
                                            <span className="text-gray-600 w-24 shrink-0">{new Date(log.timestamp || Date.now()).toLocaleTimeString()}</span>
                                            <span className={`font-bold ${log.nodeId === 'system' ? 'text-yellow-500' : 'text-blue-400'}`}>
                                                [{log.nodeId || 'system'}]
                                            </span>
                                            <span className="text-gray-300">{log.message}</span>
                                        </div>
                                    ))}
                                    {(!selectedExecution.logs || selectedExecution.logs.length === 0) && (
                                        <div className="text-gray-600 italic">No logs available</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
                        Select an execution to view details
                    </div>
                )}
            </div>
        </div>
    );
}
