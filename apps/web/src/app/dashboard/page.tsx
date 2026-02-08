"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LOCAL_STORAGE_KEYS, ROUTES } from "@/config/constants";
import { Plus, Search, Filter, MoreVertical, Play, Edit, Trash2 } from "lucide-react";

interface WorkflowCard {
  id: string;
  name: string;
  description: string;
  status: "active" | "inactive" | "draft";
  lastModified: string;
  triggers: number;
  actions: number;
}

export default function DashboardPage() {
  const [user, setUser] = useState<{ id: string; name?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [workflows, setWorkflows] = useState<WorkflowCard[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [busyIds, setBusyIds] = useState<Record<string, boolean>>({});
  const router = useRouter();

  // map backend workflow -> UI card
  const toCard = (w: any): WorkflowCard => {
    const nodes = Array.isArray(w?.json?.nodes) ? w.json.nodes : [];
    const edges = Array.isArray(w?.json?.edges) ? w.json.edges : [];
    return {
      id: w.id,
      name: w.name,
      description: w.json?.description ?? "",
      status: (w.json?.status ?? "draft") as WorkflowCard["status"],
      lastModified: new Date(w.updatedAt).toLocaleString(),
      triggers: nodes.filter((n: any) => n.type === "trigger").length,
      actions: nodes.filter((n: any) => n.type === "action").length,
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

          <button
            onClick={createNewWorkflow}
            className="flex items-center space-x-2 px-4 py-2 bg-[#3D5CFF] text-white rounded-lg hover:bg-blue-600 transition-colors shadow-[0_0_15px_rgba(61,92,255,0.3)]"
          >
            <Plus className="w-4 h-4" />
            <span>New Workflow</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4 sm:px-0">
          {filteredWorkflows.map((workflow) => (
            <div key={workflow.id} className="bg-[#151C2F] rounded-lg shadow-sm border border-gray-800 p-6 hover:border-gray-700 transition-all hover:shadow-lg hover:shadow-blue-900/10">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">{workflow.name}</h3>
                  <p className="text-gray-400 text-sm line-clamp-2">{workflow.description || "No description provided."}</p>
                </div>
                <div className="relative">
                  <button className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white" aria-label="more">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${workflow.status === 'active' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                  workflow.status === 'inactive' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                    'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                  }`}>
                  {workflow.status}
                </span>
                <span className="text-xs text-gray-500">{workflow.lastModified}</span>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4 bg-[#0B0E14] p-3 rounded-lg border border-gray-800">
                <span>{workflow.triggers} triggers</span>
                <span>{workflow.actions} actions</span>
              </div>

              <div className="flex items-center space-x-2">
                <Link
                  href={`/dashboard/workflow/${workflow.id}`}
                  className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-[#3D5CFF]/10 text-[#3D5CFF] border border-[#3D5CFF]/20 rounded-lg hover:bg-[#3D5CFF] hover:text-white transition-all"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </Link>

                <button
                  onClick={() => runWorkflow(workflow.id)}
                  disabled={!!busyIds[workflow.id]}
                  className="flex items-center justify-center px-3 py-2 border border-gray-700 text-gray-400 rounded-lg hover:bg-gray-800 hover:text-green-400 transition-colors disabled:opacity-60"
                  title="Run"
                >
                  <Play className="w-4 h-4" />
                </button>

                <button
                  onClick={() => deleteWorkflow(workflow.id)}
                  disabled={!!busyIds[workflow.id]}
                  className="flex items-center justify-center px-3 py-2 border border-gray-700 text-gray-400 rounded-lg hover:bg-gray-800 hover:text-red-400 transition-colors disabled:opacity-60"
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
