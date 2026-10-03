import React from 'react';
import { Compass, Shield, Cpu, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-800/80 bg-slate-950/60 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Compass className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg text-white">
                LostLink <span className="text-blue-500">AI</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              Smart AI-Powered Lost and Found Platform developed with the MERN stack.
              Empowering university campuses and public organizations with intelligent natural language extraction and weighted matching.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                System Operational
              </span>
              <span className="text-xs text-slate-500">Academic Year 2026</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">
              Core Modules (SRS)
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><span className="text-slate-500">FR1 & FR2:</span> Auth & Profile</li>
              <li><span className="text-slate-500">FR3 & FR4:</span> Lost / Found Reports</li>
              <li><span className="text-slate-500">FR5 & FR10:</span> Search & Filtering</li>
              <li><span className="text-slate-500">FR6 - FR9:</span> AI Chat & Weighted Match</li>
              <li><span className="text-slate-500">FR11 - FR13:</span> Claim Verification & Admin</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">
              Developer Info
            </h4>
            <div className="space-y-1.5 text-sm text-slate-400">
              <p className="text-white font-medium">John Seera</p>
              <p className="text-xs text-slate-400">B.Tech Computer Science & Engineering</p>
              <p className="text-xs text-slate-400">3rd Year • Final Year Project</p>
              <div className="pt-2">
                <span className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  SRS Traceable 100%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 LostLink AI Platform. Designed as per IEEE SRS v1.0 specifications.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-slate-400">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              MERN Stack + Rule-Based AI Engine
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
