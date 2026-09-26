'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Files,
  FilePlus2,
  Receipt,
  Users2,
  Sliders,
  Building2,
  History,
  Sparkles,
} from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/documents', label: 'All Documents', icon: Files },
  { href: '/documents/new?type=invoice', label: 'New Invoice', icon: FilePlus2, subtext: 'Master' },
  { href: '/documents/new?type=bill', label: 'New Bill', icon: Receipt, subtext: 'Recurring' },
  { href: '/clients', label: 'Clients Directory', icon: Users2 },
  { href: '/templates/designer', label: 'Template Designer', icon: Sliders },
  { href: '/settings', label: 'Company Settings', icon: Building2 },
  { href: '/activity', label: 'Activity Trail', icon: History },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-64 border-r border-slate-200 bg-white flex-col shrink-0 min-h-[calc(100vh-4rem)] select-none">
      <div className="p-4 flex-1 space-y-1.5">
        <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-3 mb-2">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== '/' && !item.href.includes('?') && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition group',
                isActive
                  ? 'bg-[#3944BC]/10 text-[#3944BC] font-bold border border-[#3944BC]/20 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={clsx(
                    'w-4 h-4 transition',
                    isActive ? 'text-[#3944BC]' : 'text-slate-400 group-hover:text-slate-700'
                  )}
                />
                <span>{item.label}</span>
              </div>
              {item.subtext && (
                <span
                  className={clsx(
                    'text-[9px] font-bold uppercase px-1.5 py-0.5 rounded transition',
                    isActive
                      ? 'bg-[#3944BC]/15 text-[#3944BC]'
                      : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700'
                  )}
                >
                  {item.subtext}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Organization Badge Footer */}
      <div className="p-4 bg-slate-50 m-3 rounded-2xl border border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#3944BC] text-white flex items-center justify-center font-black text-xs shadow-md shadow-[#3944BC]/20">
            V2
          </div>
          <div className="min-w-0">
            <div className="text-xs font-extrabold text-slate-900 truncate">V2 Labs Global</div>
            <div className="text-[10px] text-slate-500 truncate">contact@v2labsglobal.com</div>
          </div>
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
          <span className="flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3 h-3 text-[#3944BC]" /> V2 REPORT Engine
          </span>
          <span className="font-mono text-emerald-600 font-bold">Online</span>
        </div>
      </div>
    </aside>
  );
}
