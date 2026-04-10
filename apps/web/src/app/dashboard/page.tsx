"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LOCAL_STORAGE_KEYS, ROUTES } from "@/config/constants";
import { Plus, Search, Filter, MoreVertical, Play, Edit, Trash2, ExternalLink, Sparkles } from "lucide-react";

interface WorkflowCard {
  id: string;
  name: string;
  description: string;
  status: string;
  lastModified: string;
  triggers: number;
  actions: number;
  totalRuns: number;
  lastRunStatus?: string;
  connectors: string[];
}

export default function DashboardPage() {
  const [user, setUser] = useState<{ id: string; name?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [workflows, setWorkflows] = useState<WorkflowCard[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [busyIds, setBusyIds] = useState<Record<string, boolean>>({});
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const router = useRouter();

  // Close menu when clicking away
  useEffect(() => {
    const handleClick = () => setActiveMenuId(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  // map backend workflow -> UI card
  const toCard = (w: any): WorkflowCard => {
    const nodes = Array.isArray(w?.json?.nodes) ? w.json.nodes : [];
    const edges = Array.isArray(w?.json?.edges) ? w.json.edges : [];

    // Extract unique connectors
    const connectorSet = new Set<string>();
    nodes.forEach((n: any) => {
      const type = n.data?.nodeType || n.type;
      if (type && type !== "start" && type !== "workflowNode") connectorSet.add(type);
    });

    return {
      id: w.id,
      name: w.name,
      description: w.json?.description ?? "",
      status: w.executions?.[0]?.status ?? "DRAFT",
      lastModified: new Date(w.updatedAt).toLocaleDateString() + ' ' + new Date(w.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      triggers: nodes.filter((n: any) => n.data?.nodeType === "cron" || n.data?.nodeType === "webhook").length,
      actions: nodes.filter((n: any) => n.data?.nodeType !== "cron" && n.data?.nodeType !== "webhook" && n.data?.nodeType !== "condition" && n.data?.nodeType !== "loop").length,
      totalRuns: w._count?.executions ?? 0,
      lastRunStatus: w.executions?.[0]?.status,
      connectors: Array.from(connectorSet)
    };
  };

  // --- auth + initial load ---
  useEffect(() => {
    const token = localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN);
    console.log("DashboardPage: Retrieved token:", token);
    if (!token) {
      router.push(ROUTES.LOGIN);
      return;
    }

    (async () => {
      try {
        const me = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }).then((r) => r.json());
        console.log("DashboardPage: /api/auth/me response:", me);
        if (!me?.user?.id) throw new Error("unauthorized");
        setUser({ id: me.user.id, name: me.user.name });

        // load workflows for this user
        const list = await fetch(`/api/workflows?userId=${me.user.id}`, { cache: "no-store" })
          .then((r) => r.json());

        console.log("Workflows API response:", list);
        if (list?.ok && Array.isArray(list.items)) {
          setWorkflows(list.items.map(toCard));
        }
      } catch {
        // localStorage.removeItem(LOCAL_STORAGE_KEYS.TOKEN);
        // router.push(ROUTES.LOGIN);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.TOKEN);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.USER);
    router.push(ROUTES.LOGIN);
  };

  const createNewWorkflow = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          name: "Untitled Workflow",
          nodes: [],
          edges: [],
        }),
      });
      const data = await res.json();
      if (data?.ok && data.workflow?.id) {
        // optimistic add to list
        setWorkflows((prev) => [toCard(data.workflow), ...prev]);
        router.push(`/dashboard/workflow/${data.workflow.id}`);
      } else {
        alert(data?.error ?? "Failed to create workflow");
      }
    } catch (e) {
      alert("Failed to create workflow");
    }
  };

  const deleteWorkflow = async (wfId: string) => {
    if (!user?.id) return;
    if (!confirm("Delete this workflow?")) return;
    setBusyIds((b) => ({ ...b, [wfId]: true }));
    try {
      const res = await fetch(`/api/workflows/${wfId}?userId=${user.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data?.ok) setWorkflows((prev) => prev.filter((w) => w.id !== wfId));
      else alert(data?.error ?? "Delete failed");
    } catch {
      alert("Delete failed");
    } finally {
      setBusyIds((b) => ({ ...b, [wfId]: false }));
    }
  };

  const runWorkflow = async (wfId: string) => {
    if (!user?.id) return;
    setBusyIds((b) => ({ ...b, [wfId]: true }));
    try {
      // call server directly via NEXT_PUBLIC_API_BASE or add a proxy route if you prefer
      const base = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000";
      const res = await fetch(`${base}/workflow/${wfId}/run?userId=${user.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ triggeredFrom: "dashboard" }),
      });
      const data = await res.json();
      if (!data?.ok) alert(data?.error ?? "Run failed");
      // you could toast success / show result modal here
    } catch {
      alert("Run failed");
    } finally {
      setBusyIds((b) => ({ ...b, [wfId]: false }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-red-100 text-red-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredWorkflows = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return workflows.filter(
      (w) => w.name.toLowerCase().includes(q) || w.description.toLowerCase().includes(q)
    );
  }, [workflows, searchTerm]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white">
      <nav className="bg-[#151C2F] border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-white">TriggerForge Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-300">Welcome, {user?.name ?? "User"}</span>
              {/* <Link href="/dashboard/eval" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
                AI Evaluations
              </Link> */}
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('triggerforge:start-tour'))}
                className="flex items-center space-x-2 px-3 py-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md hover:bg-indigo-500/20 transition-colors"
                title="Watch Tour"
              >
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">Tour</span>
              </button>
              <button onClick={handleLogout} className="bg-red-500/10 text-red-500 border border-red-500/20 px-4 py-2 rounded-md hover:bg-red-500/20 transition-colors">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {filteredWorkflows.length === 0 && (
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-800 rounded-lg h-96 flex flex-col items-center justify-center bg-[#151C2F]/50">
              <div className="text-center max-w-lg">
                <h2 className="text-3xl font-bold text-white mb-4">Welcome to TriggerForge!</h2>
                <p className="text-gray-400 mb-8 text-lg">Your workflow automation dashboard is waiting for you. create your first workflow to get started.</p>
                <button
                  onClick={createNewWorkflow}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-[#3D5CFF] text-white rounded-lg hover:bg-blue-600 transition-colors shadow-lg shadow-blue-900/20 text-md font-medium"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create your first workflow</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8 px-4 sm:px-0">
          <h1 className="text-3xl font-bold text-white mb-2">Workflows</h1>
          <p className="text-gray-400">Create and manage your automation workflows</p>
        </div>

        <div className="flex items-center justify-between mb-6 px-4 sm:px-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search workflows..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-[#151C2F] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3D5CFF] focus:border-transparent w-80"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('triggerforge:start-tour'))}
              className="flex items-center space-x-2 px-4 py-2 bg-white/5 border border-white/10 text-slate-300 rounded-lg hover:bg-white/10 hover:text-white transition-all duration-200"
            >
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-medium">Show Tour</span>
            </button>
            <button
              onClick={createNewWorkflow}
              className="flex items-center space-x-2 px-4 py-2 bg-[#3D5CFF] text-white rounded-lg hover:bg-blue-600 transition-colors shadow-[0_0_15px_rgba(61,92,255,0.3)]"
            >
              <Plus className="w-4 h-4" />
              <span>New Workflow</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4 sm:px-0">
          {filteredWorkflows.map((workflow) => (
            <div key={workflow.id} className="bg-[#151C2F] rounded-lg shadow-sm border border-gray-800 p-6 hover:border-gray-700 transition-all hover:shadow-lg hover:shadow-blue-900/10">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">{workflow.name}</h3>
                  {/* <p className="text-gray-400 text-sm line-clamp-2">{workflow.description || "No description provided."}</p> */}
                </div>
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuId(activeMenuId === workflow.id ? null : workflow.id);
                    }}
                    className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition-colors"
                    aria-label="more"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {activeMenuId === workflow.id && (
                    <div className="absolute right-0 mt-2 w-48 bg-[#151C2F] border border-gray-800 rounded-lg shadow-xl z-10 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                      <button
                        onClick={() => window.open(`/dashboard/workflow/${workflow.id}`, '_blank')}
                        className="w-full flex items-center space-x-2 px-4 py-2 text-xs text-gray-300 hover:bg-[#3D5CFF]/10 hover:text-white transition-colors text-left"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open in New Tab</span>
                      </button>
                      <button
                        onClick={() => deleteWorkflow(workflow.id)}
                        className="w-full flex items-center space-x-2 px-4 py-2 text-xs text-red-500 hover:bg-red-500/10 transition-colors text-left"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Workflow</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border ${workflow.status === 'SUCCEEDED' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                    workflow.status === 'FAILED' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                      workflow.status === 'RUNNING' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                        'bg-gray-500/10 text-gray-400 border-gray-500/20'
                  }`}>
                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${workflow.status === 'SUCCEEDED' ? 'bg-green-500' :
                      workflow.status === 'FAILED' ? 'bg-red-500' :
                        workflow.status === 'RUNNING' ? 'bg-blue-500 animate-pulse' :
                          'bg-gray-500'
                    }`} />
                  {workflow.status}
                </span>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">{workflow.totalRuns} TOTAL RUNS</span>
                  <span className="text-[10px] text-gray-600 font-medium">MODIFIED {workflow.lastModified}</span>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mb-1.5">Connector Stack</div>
                <div className="flex flex-wrap gap-1.5">
                  {workflow.connectors.length > 0 ? (
                    workflow.connectors.map(c => (
                      <span key={c} className="px-2 py-1 bg-[#0B0E14] text-gray-400 border border-gray-800 rounded text-[9px] font-bold uppercase tracking-tight">
                        {c.replace(/_/g, ' ')}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-gray-700 italic">No connectors used</span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Link
                  href={`/dashboard/workflow/${workflow.id}`}
                  className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-[#3D5CFF] text-white rounded-lg hover:bg-blue-600 transition-all font-bold text-[11px] uppercase tracking-wide shadow-lg shadow-blue-900/20"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Open Editor</span>
                </Link>

                <button
                  onClick={() => deleteWorkflow(workflow.id)}
                  disabled={!!busyIds[workflow.id]}
                  className="flex items-center justify-center px-3 py-2 bg-[#151C2F] border border-gray-800 text-gray-500 rounded-lg hover:text-red-500 hover:border-red-500/30 transition-all disabled:opacity-60"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
