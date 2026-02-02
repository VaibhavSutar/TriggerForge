import Link from 'next/link';

export default function Page() {
  return (
    <div className="min-h-screen bg-[#0B0E14] text-white selection:bg-[#3D5CFF] selection:text-white">
      {/* Navbar Placeholder to match dashboard feel */}
      <nav className="border-b border-gray-800 bg-[#0B0E14]/50 backdrop-blur fixed w-full z-10 top-0">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="text-xl font-bold tracking-tight">NeuraFlow</div>
          <div className="space-x-6 text-sm">
            <Link href="/login" className="text-gray-400 hover:text-white transition-colors">Sign In</Link>
            <Link href="/signup" className="bg-[#3D5CFF] hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors">Get Started</Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 pt-32 pb-16">
        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
            Trigger<span className="text-[#3D5CFF]">Forge</span>
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed">
            The next-generation workflow automation platform.
            Build, deploy, and manage your automation workflows with ease.
          </p>

          <div className="space-x-4">
            <Link
              href="/signup"
              className="bg-[#3D5CFF] text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-all shadow-[0_0_20px_rgba(61,92,255,0.3)] hover:shadow-[0_0_30px_rgba(61,92,255,0.5)]"
            >
              Get Started
            </Link>
          </div>
        </div>

        {/* Features Section Styled like the image */}
        <div className="relative">
          <div className="text-center mb-12">
            <span className="text-[#3D5CFF] text-sm font-bold tracking-widest uppercase mb-2 block">Features</span>
            <h2 className="text-3xl md:text-4xl font-bold">
              AI-Driven <span className="text-[#3D5CFF]">Features</span>
            </h2>
            <div className="h-1 w-24 bg-[#3D5CFF] mx-auto mt-4 rounded-full opacity-50"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-[#151C2F] border border-gray-800 p-8 rounded-2xl hover:border-gray-700 transition-all group">
              <div className="w-12 h-12 bg-[#3D5CFF]/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-[#3D5CFF]/20 transition-colors">
                <svg className="w-6 h-6 text-[#3D5CFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Visual Workflow Builder</h3>
              <p className="text-gray-400 leading-relaxed">
                Create complex workflows with our intuitive drag-and-drop interface.
              </p>
            </div>
            <div className="bg-[#151C2F] border border-gray-800 p-8 rounded-2xl hover:border-gray-700 transition-all group">
              <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-purple-500/20 transition-colors">
                <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Multi-Platform</h3>
              <p className="text-gray-400 leading-relaxed">
                Available as web app, desktop application, and mobile companion.
              </p>
            </div>
            <div className="bg-[#151C2F] border border-gray-800 p-8 rounded-2xl hover:border-gray-700 transition-all group">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-emerald-500/20 transition-colors">
                <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Real-time Execution</h3>
              <p className="text-gray-400 leading-relaxed">
                Execute workflows in real-time with our high-performance engine.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}