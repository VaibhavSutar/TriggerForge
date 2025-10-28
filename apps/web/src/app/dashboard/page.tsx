"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LOCAL_STORAGE_KEYS, ROUTES } from '@/config/constants';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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
      </main>
    </div>
  );
}