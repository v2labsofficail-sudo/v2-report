'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Files,
  Plus,
  Users2,
  Settings,
  FileText,
  Receipt,
  X,
} from 'lucide-react';
import clsx from 'clsx';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <>
      {/* Mobile Floating Quick Action Sheet */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs md:hidden flex flex-col justify-end animate-in fade-in duration-200">
          <div className="bg-white border-t border-slate-200 rounded-t-3xl p-6 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#3944BC] animate-pulse" />
                <span className="text-sm font-arvo font-bold text-slate-900 tracking-wide uppercase">
                  Create V2 Document
                </span>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <Link
                href="/documents/new?type=invoice"
                onClick={() => setShowCreateModal(false)}
                className="p-4 rounded-2xl bg-[#3944BC] hover:bg-[#2e3799] text-white flex flex-col items-center justify-center gap-2 shadow-lg shadow-[#3944BC]/25 hover:brightness-105 transition active:scale-95"
              >
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div className="text-center">
                  <div className="text-xs font-arvo font-bold">New Invoice</div>
                  <div className="text-[10px] text-blue-100">Tax, items & payment</div>
                </div>
              </Link>

              <Link
                href="/documents/new?type=bill"
                onClick={() => setShowCreateModal(false)}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-[#3944BC]/50 text-slate-900 flex flex-col items-center justify-center gap-2 shadow-xs transition active:scale-95"
              >
                <div className="w-10 h-10 rounded-xl bg-[#3944BC]/10 text-[#3944BC] flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <div className="text-xs font-arvo font-bold">New Bill</div>
                  <div className="text-[10px] text-slate-500">Duration & recurring</div>
                </div>
              </Link>
            </div>

            <Link
              href="/clients"
              onClick={() => setShowCreateModal(false)}
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition"
            >
              <Users2 className="w-4 h-4 text-[#3944BC]" />
              <span>Manage Client Directory</span>
            </Link>
          </div>
        </div>
      )}

      {/* Sleek Clean White Bottom Navigation Bar with #3944BC Blue Accents */}
      <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-200 px-3 pt-2 pb-3 shadow-[0_-4px_25px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-around relative max-w-md mx-auto">
          {/* Item 1: Home */}
          <Link
            href="/"
            className={clsx(
              'flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition active:scale-90',
              pathname === '/'
                ? 'text-[#3944BC] font-bold'
                : 'text-slate-400 hover:text-slate-600'
            )}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Home</span>
            {pathname === '/' && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#3944BC] shadow-xs shadow-[#3944BC]" />
            )}
          </Link>

          {/* Item 2: Docs */}
          <Link
            href="/documents"
            className={clsx(
              'flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition active:scale-90',
              pathname.startsWith('/documents') && !pathname.includes('/new')
                ? 'text-[#3944BC] font-bold'
                : 'text-slate-400 hover:text-slate-600'
            )}
          >
            <Files className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Docs</span>
            {pathname.startsWith('/documents') && !pathname.includes('/new') && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#3944BC] shadow-xs shadow-[#3944BC]" />
            )}
          </Link>

          {/* Center Elevated Floating "+ Create" Button in #3944BC */}
          <div className="-mt-7">
            <button
              onClick={() => setShowCreateModal(!showCreateModal)}
              className="w-[52px] h-[52px] rounded-2xl bg-[#3944BC] hover:bg-[#2e3799] text-white flex items-center justify-center shadow-lg shadow-[#3944BC]/35 border-2 border-white hover:scale-105 active:scale-95 transition"
              title="Create Document"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>

          {/* Item 3: Clients */}
          <Link
            href="/clients"
            className={clsx(
              'flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition active:scale-90',
              pathname.startsWith('/clients')
                ? 'text-[#3944BC] font-bold'
                : 'text-slate-400 hover:text-slate-600'
            )}
          >
            <Users2 className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Clients</span>
            {pathname.startsWith('/clients') && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#3944BC] shadow-xs shadow-[#3944BC]" />
            )}
          </Link>

          {/* Item 4: Settings */}
          <Link
            href="/settings"
            className={clsx(
              'flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition active:scale-90',
              pathname.startsWith('/settings')
                ? 'text-[#3944BC] font-bold'
                : 'text-slate-400 hover:text-slate-600'
            )}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Settings</span>
            {pathname.startsWith('/settings') && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#3944BC] shadow-xs shadow-[#3944BC]" />
            )}
          </Link>
        </div>
      </nav>
    </>
  );
}
