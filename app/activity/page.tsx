'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import { ActivityLog } from '@/lib/types';
import { History, User, Loader2 } from 'lucide-react';

export default function ActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      try {
        const res = await fetch('/api/activity');
        const data = await res.json();
        if (data.success) {
          setLogs(data.logs || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-arvo font-bold text-slate-900 tracking-tight">Activity Trail</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-arvo font-bold uppercase bg-[#3944BC]/10 text-[#3944BC] border border-[#3944BC]/20">
              V2 REPORT
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Audit history of document creation, PDF generation, duplication, and configuration changes.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin text-[#3944BC]" />
              <span className="text-xs font-semibold">Loading activity logs...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">No activity logged yet.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {logs.map((log) => {
                const date = new Date(log.timestamp);
                const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const dateStr = date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });

                return (
                  <div key={log.id} className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50/80 transition">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#3944BC]/10 text-[#3944BC] flex items-center justify-center shrink-0 mt-0.5 border border-[#3944BC]/20">
                        <History className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{log.description}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 font-medium">
                            <User className="w-3 h-3 text-slate-400" /> {log.user}
                          </span>
                          <span className="font-mono text-[10px] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[#3944BC] uppercase font-bold">
                            {log.action}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right text-[11px] text-slate-400 shrink-0 font-medium">
                      <div>{dateStr}</div>
                      <div>{timeStr}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
