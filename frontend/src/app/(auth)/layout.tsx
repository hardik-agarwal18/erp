"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const isSignup = pathname === "/signup";

  return (
    <main className="h-screen w-full flex flex-col bg-slate-50 relative overflow-hidden font-sans">
      {/* Vibrant Animated Mesh Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-fuchsia-500 to-orange-500 opacity-90 mix-blend-multiply z-0"></div>
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
         <div className="absolute top-[-10%] left-[-10%] w-[50rem] h-[50rem] bg-indigo-500 rounded-full mix-blend-screen filter blur-[100px] animate-[pulse_10s_ease-in-out_infinite]"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[50rem] h-[50rem] bg-rose-500 rounded-full mix-blend-screen filter blur-[100px] animate-[pulse_12s_ease-in-out_infinite_reverse]"></div>
         <div className="absolute top-[40%] left-[40%] w-[30rem] h-[30rem] bg-orange-400 rounded-full mix-blend-screen filter blur-[120px] animate-[pulse_8s_ease-in-out_infinite_reverse]"></div>
      </div>

      {/* Top Navbar */}
      <nav className="relative w-full p-4 sm:p-6 lg:px-8 flex items-center justify-between z-50 shrink-0 animate-in fade-in slide-in-from-top-4 duration-1000">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 shadow-sm group-hover:scale-105 transition-transform duration-300">
            <svg className="w-6 h-6 text-white drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <span className="text-white font-bold text-xl tracking-tight drop-shadow-md">Precision Ledger</span>
        </Link>
        <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-white/80 drop-shadow-sm">
          <Link href="/help" className="hover:text-white transition-colors">Help</Link>
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
        </div>
      </nav>

      {/* Main Container Wrapper */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 min-h-0 z-10 w-full">
        {/* Main Panel */}
        <div className="relative w-full max-w-5xl h-full max-h-[700px] bg-transparent backdrop-blur-3xl border border-white/40 rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden flex max-lg:flex-col max-lg:rounded-xl max-lg:border-none">
          
          {/* Form Container (Clean & Minimal) */}
          <div 
            className={`absolute top-0 w-1/2 h-full flex flex-col justify-center px-8 py-6 lg:px-12 bg-white transition-transform duration-700 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] overflow-y-auto max-lg:relative max-lg:w-full max-lg:p-6 z-0 ${
              mounted && isSignup ? "translate-x-0" : "translate-x-full max-lg:translate-x-0"
            }`}
          >
             <div className="w-full max-w-sm mx-auto">
               {children}
             </div>
          </div>

        {/* Sliding Overlay (Glassmorphism Brand Side) */}
        <div 
          className={`absolute top-0 w-1/2 h-full bg-slate-950/30 backdrop-blur-[40px] flex flex-col items-center justify-center text-center p-12 transition-transform duration-700 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] z-10 shadow-[0_0_40px_rgba(0,0,0,0.2)] max-lg:hidden border-white/20 ${
            mounted && isSignup ? "translate-x-full border-l" : "translate-x-0 border-r"
          }`}
        >
          <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-8 border border-white/20 shadow-[0_8px_16px_rgba(0,0,0,0.2)] transform transition hover:scale-105 duration-500">
            <svg className="w-8 h-8 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight mb-4 drop-shadow-lg leading-tight">
            {isSignup ? "Start building today." : "Welcome back."}
          </h1>
          <p className="text-lg text-white/80 font-medium leading-relaxed max-w-sm drop-shadow-md">
            {isSignup 
              ? "Join the minimal and modern platform designed for clarity and focus." 
              : "Access your dashboard to continue tracking your financials with ease."}
          </p>
          </div>

        </div>
      </div>
    </main>
  );
}
