"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Play, AlertCircle, CheckCircle2, XCircle, Code2 } from "lucide-react";

interface EvalResult {
    id: string;
    prompt: string;
    score: number;
    passed: boolean;
    generatedOutput?: string;
    error?: string;
}

export default function EvalDashboard() {
    const [running, setRunning] = useState(false);
    const [results, setResults] = useState<EvalResult[] | null>(null);
    const [summary, setSummary] = useState<{ total: number, passed: number, failed: number } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const runEvaluations = async () => {
        setRunning(true);
        setError(null);
        setResults(null);
        setSummary(null);

        try {
            const base = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000";
            const res = await fetch(`${base}/eval/run`);

            if (!res.ok) {
                throw new Error(`Server returned ${res.status}`);
            }

            const data = await res.json();
            if (data.ok) {
                setResults(data.results);
                setSummary(data.summary);
            } else {
                setError(data.error || "Evaluation failed with unknown error.");
            }
        } catch (e: any) {
            setError(`Failed to connect to backend: ${e.message}`);
        } finally {
            setRunning(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0B0E14] text-white">
            {/* Navbar */}
            <nav className="bg-[#151C2F] border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center h-16">
                        <Link href="/dashboard" className="flex items-center text-gray-400 hover:text-white transition-colors">
                            <ArrowLeft className="w-5 h-5 mr-2" />
                            Back to Dashboard
                        </Link>
                        <h1 className="text-xl font-semibold text-white ml-auto">AI Evaluation Suite</h1>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">

                <div className="bg-[#151C2F] border border-gray-800 rounded-lg p-6 mb-8 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold mb-2">Automated Golden Set Evaluation</h2>
                        <p className="text-gray-400">Run the predefined test cases (Golden Set) against the active LLM workflow generator. Uses LLM-as-a-judge to grade output intelligence.</p>
                    </div>
                    <button
                        onClick={runEvaluations}
                        disabled={running}
                        className="flex items-center space-x-2 px-6 py-3 bg-[#3D5CFF] text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg"
                    >
                        {running ? <div className="w-5 h-5 border-2 border-white rounded-full animate-spin border-t-transparent" /> : <Play className="w-5 h-5" />}
                        <span>{running ? "Running Tests..." : "Run Evaluations"}</span>
                    </button>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-lg flex items-start gap-3 text-red-400 mb-8">
                        <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                        <div>
                            <h3 className="font-semibold text-white mb-1">Evaluation Error</h3>
                            <p className="font-mono text-sm">{error}</p>
                        </div>
                    </div>
                )}

                {summary && (
                    <div className="grid grid-cols-3 gap-6 mb-8">
                        <div className="bg-[#151C2F] border border-gray-800 p-6 rounded-lg text-center">
                            <div className="text-gray-400 text-sm uppercase tracking-wider mb-2">Total Tests</div>
                            <div className="text-4xl font-bold">{summary.total}</div>
                        </div>
                        <div className="bg-[#151C2F] border border-green-500/30 p-6 rounded-lg text-center">
                            <div className="text-green-400 text-sm uppercase tracking-wider mb-2">Passed</div>
                            <div className="text-4xl font-bold text-green-400">{summary.passed}</div>
                        </div>
                        <div className="bg-[#151C2F] border border-red-500/30 p-6 rounded-lg text-center">
                            <div className="text-red-400 text-sm uppercase tracking-wider mb-2">Failed</div>
                            <div className="text-4xl font-bold text-red-400">{summary.failed}</div>
                        </div>
                    </div>
                )}

                {results && (
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold mb-4">Detailed Results</h3>
                        {results.map((res) => (
                            <div key={res.id} className="bg-[#151C2F] border border-gray-800 rounded-lg overflow-hidden">
                                <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-[#0B0E14]/50">
                                    <div className="flex items-center gap-3">
                                        {res.passed ? <CheckCircle2 className="w-6 h-6 text-green-400" /> : <XCircle className="w-6 h-6 text-red-400" />}
                                        <span className="font-mono font-bold">{res.id}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-400 uppercase tracking-wider">Score:</span>
                                        <span className={`text-xl font-bold ${res.passed ? "text-green-400" : "text-red-400"}`}>{res.score}/10</span>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="mb-4">
                                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Test Prompt</div>
                                        <p className="text-gray-300 italic">"{res.prompt}"</p>
                                    </div>

                                    {res.error ? (
                                        <div className="bg-red-500/10 text-red-400 p-3 rounded font-mono text-xs border border-red-500/20">
                                            {res.error}
                                        </div>
                                    ) : (
                                        <div>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider mb-2">
                                                <Code2 className="w-4 h-4" /> Generated Workflow Logic
                                            </div>
                                            <pre className="bg-[#0B0E14] border border-gray-800 p-3 rounded text-xs text-gray-400 font-mono overflow-x-auto max-h-60 overflow-y-auto">
                                                {res.generatedOutput}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
