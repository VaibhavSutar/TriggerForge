"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Globe } from '@/components/ui/Globe';

export default function Page() {
  return (
    <div className="min-h-screen bg-[#0B0E14] text-white selection:bg-[#3D5CFF] selection:text-white overflow-hidden font-sans">
      {/* Dynamic Background subtle glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_#1a2340_0%,_transparent_50%)] opacity-60 pointer-events-none" />
      
      {/* Navbar Placeholder to match dashboard feel */}
      <nav className="border-b border-gray-800/50 bg-[#0B0E14]/70 backdrop-blur-md fixed w-full z-50 top-0 transition-all">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="text-xl font-bold tracking-tight flex items-center gap-2"
          >
            <div className="w-6 h-6 rounded bg-gradient-to-br from-[#3D5CFF] to-purple-600 shadow-[0_0_10px_rgba(61,92,255,0.5)]" />
            TriggerForge
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-x-6 text-sm flex items-center"
          >
            <Link href="/login" className="text-gray-400 hover:text-white transition-colors">Sign In</Link>
            <Link href="/signup" className="relative group overflow-hidden bg-[#3D5CFF] hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg transition-all shadow-[0_0_15px_rgba(61,92,255,0.3)] hover:shadow-[0_0_25px_rgba(61,92,255,0.5)]">
               <span className="relative z-10 font-medium">Get Started</span>
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* Main Hero Section with Globe */}
      <main className="relative pt-32 pb-16 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-8">
            
            {/* Left Content */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex-1 text-center lg:text-left z-10 max-w-2xl"
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                TriggerForge 1.0 is Live
              </motion.div>
              
              <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight leading-[1.1]">
                Automate The <br className="hidden lg:block"/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3D5CFF] to-purple-500">
                  Entire World.
                </span>
              </h1>
              
              <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-light">
                The next-generation workflow automation platform. Build, deploy, and scale your automated pipelines globally with zero friction.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link
                  href="/signup"
                  className="w-full sm:w-auto bg-[#3D5CFF] text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-600 transition-all shadow-[0_0_20px_rgba(61,92,255,0.4)] hover:shadow-[0_0_35px_rgba(61,92,255,0.6)] flex items-center justify-center gap-2 group"
                >
                  Start Building Free
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-gray-800 transition-all flex items-center justify-center"
                >
                  View Documentation
                </Link>
              </div>
            </motion.div>

            {/* Right Interactive Globe */}
            <div className="flex-1 w-full max-w-[600px] lg:max-w-none relative z-0">
               <div className="absolute inset-0 bg-[#3D5CFF] blur-[120px] rounded-full opacity-20 animate-pulse"></div>
               <Globe className="relative z-10" />
            </div>

          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="relative py-24 bg-[#0B0E14] border-t border-gray-800/50">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="text-[#3D5CFF] text-sm font-bold tracking-widest uppercase mb-3 block">Infinite Capabilities</span>
            <h2 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
              Powerful By Design
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Visual Workflow Builder",
                desc: "Create complex workflows with our intuitive, lightning-fast drag-and-drop interface.",
                icon: <svg className="w-7 h-7 text-[#3D5CFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>,
                color: "from-blue-500/10 to-transparent",
                border: "group-hover:border-blue-500/50"
              },
              {
                title: "Multi-Platform Connectors",
                desc: "Seamlessly integrate with Google Docs, Slack, Webhooks, AI Models, and more instantly.",
                icon: <svg className="w-7 h-7 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
                color: "from-purple-500/10 to-transparent",
                border: "group-hover:border-purple-500/50"
              },
              {
                title: "Real-time Execution",
                desc: "Execute workflows in real-time with our high-performance, edge-optimized engine.",
                icon: <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
                color: "from-emerald-500/10 to-transparent",
                border: "group-hover:border-emerald-500/50"
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className={`relative bg-[#151C2F]/80 backdrop-blur-sm border border-gray-800 p-8 rounded-3xl transition-all duration-300 group hover:-translate-y-2 ${feature.border} hover:shadow-2xl hover:shadow-[#0B0E14] overflow-hidden`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-black/40 border border-gray-700 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-semibold mb-3 text-white tracking-tight">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed font-light">
                    {feature.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}