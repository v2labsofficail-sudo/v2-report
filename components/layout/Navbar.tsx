'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, FileText, Receipt, ShieldCheck } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="h-16 border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 shadow-xs">
      {/* Brand Logo & Name */}
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-[#3944BC] flex items-center justify-center text-white font-arvo font-bold text-lg shadow-md shadow-[#3944BC]/25 group-hover:scale-105 transition">
            V2
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-arvo font-bold text-slate-900 tracking-tight text-lg">
                V2 REPORT
              </span>
              <span className="px-2 py-0.5 text-[9px] font-extrabold tracking-widest uppercase bg-[#3944BC]/10 text-[#3944BC] rounded-full border border-[#3944BC]/20">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium tracking-tight">
              Create. Generate. Send.
            </p>
          </div>
        </Link>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Status Pill */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 border border-slate-200">
          <ShieldCheck className="w-4 h-4 text-[#3944BC]" />
          <span>V2 Labs Global Automation</span>
        </div>

        {/* Create Document Dropdown for PC */}
        <div className="relative group">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#3944BC] hover:bg-[#2e3799] text-white font-bold text-xs tracking-wide shadow-md shadow-[#3944BC]/25 transition active:scale-95">
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">New Document</span>
            <span className="sm:hidden">Create</span>
          </button>
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 hidden group-hover:block transition z-50 animate-in fade-in zoom-in-95">
            <Link
              href="/documents/new?type=invoice"
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#3944BC]/10 hover:text-[#3944BC] text-slate-700 text-xs font-semibold transition"
            >
              <div className="w-8 h-8 rounded-lg bg-[#3944BC]/10 text-[#3944BC] flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-900">V2 Invoice</div>
                <div className="text-[10px] text-slate-500 font-normal">A4 master layout & tax</div>
              </div>
            </Link>
            <Link
              href="/documents/new?type=bill"
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#3944BC]/10 hover:text-[#3944BC] text-slate-700 text-xs font-semibold transition mt-1"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-900">V2 Bill</div>
                <div className="text-[10px] text-slate-500 font-normal">Recurring client billing</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
