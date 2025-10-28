import Link from 'next/link';

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            TriggerForge
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            The next-generation workflow automation platform. 
            Build, deploy, and manage your automation workflows with ease.
          </p>
          
          <div className="space-x-4">
            <Link 
              href="/signup"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Get Started
            </Link>
            <Link 
              href="/login"
              className="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-3">Visual Workflow Builder</h3>
            <p className="text-gray-600">
              Create complex workflows with our intuitive drag-and-drop interface.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-3">Multi-Platform</h3>
            <p className="text-gray-600">
              Available as web app, desktop application, and mobile companion.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-3">Real-time Execution</h3>
            <p className="text-gray-600">
              Execute workflows in real-time with our high-performance engine.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}