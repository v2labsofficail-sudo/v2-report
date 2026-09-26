'use client';

import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import MobileBottomNav from './MobileBottomNav';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-[#3944BC] selection:text-white">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Content Viewport with mobile bottom padding */}
        <main className="flex-1 overflow-y-auto pb-28 md:pb-0 bg-slate-50">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Visible only on mobile screens) */}
      <MobileBottomNav />
    </div>
  );
}
