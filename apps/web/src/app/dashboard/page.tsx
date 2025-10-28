"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LOCAL_STORAGE_KEYS, ROUTES } from '@/config/constants';
import React from 'react';
import { Plus, Search, Filter, MoreVertical, Play, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'draft';
  lastModified: string;
  triggers: number;
  actions: number;
}

const mockWorkflows: Workflow[] = [
  {
    id: '1',
    name: 'Email Notification System',
    description: 'Automated email notifications for new user registrations',
    status: 'active',
    lastModified: '2 hours ago',
    triggers: 1,
    actions: 3,
  },
  {
    id: '2',
    name: 'Data Sync Workflow',
    description: 'Sync data between CRM and email marketing platform',
    status: 'inactive',
    lastModified: '1 day ago',
    triggers: 2,
    actions: 5,
  },
  {
    id: '3',
    name: 'Weekly Reports',
    description: 'Generate and send weekly performance reports',
    status: 'draft',
    lastModified: '3 days ago',
    triggers: 1,
    actions: 2,
  },
];

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [workflows, setWorkflows] = useState<Workflow[]>(mockWorkflows);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN);
    if (!token) {
      router.push(ROUTES.LOGIN);
      return;
    }

    // Fetch user data
    fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
        } else {
          localStorage.removeItem(LOCAL_STORAGE_KEYS.TOKEN);
          router.push(ROUTES.LOGIN);
        }
      })
      .catch(() => {
        localStorage.removeItem(LOCAL_STORAGE_KEYS.TOKEN);
        router.push(ROUTES.LOGIN);
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.TOKEN);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.USER); // Clear user data too
    router.push(ROUTES.LOGIN);
  };

  const createNewWorkflow = async () => {
    const newWorkflowId = Date.now().toString();
    // In a real app, you'd make an API call here
    // For now, we'll just navigate to the new workflow
    window.location.href = `/dashboard/workflow/${newWorkflowId}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredWorkflows = workflows.filter(workflow =>
    workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workflow.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">TriggerForge Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.name}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Welcome to TriggerForge!
              </h2>
              <p className="text-gray-600">
                Your workflow automation dashboard will be here.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Workflows</h1>
          <p className="text-gray-600">Create and manage your automation workflows</p>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search workflows..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-80"
              />
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </button>
          </div>
          
          <button
            onClick={createNewWorkflow}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Workflow</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkflows.map((workflow) => (
            <div key={workflow.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{workflow.name}</h3>
                  <p className="text-gray-600 text-sm">{workflow.description}</p>
                </div>
                <div className="relative">
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <MoreVertical className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(workflow.status)}`}>
                  {workflow.status}
                </span>
                <span className="text-xs text-gray-500">{workflow.lastModified}</span>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                <span>{workflow.triggers} triggers</span>
                <span>{workflow.actions} actions</span>
              </div>

              <div className="flex items-center space-x-2">
                <Link
                  href={`/dashboard/workflow/${workflow.id}`}
                  className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </Link>
                <button className="flex items-center justify-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <Play className="w-4 h-4" />
                </button>
                <button className="flex items-center justify-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredWorkflows.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">No workflows found</div>
            <button
              onClick={createNewWorkflow}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create your first workflow</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}