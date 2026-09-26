'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import { DocumentRecord, Client } from '@/lib/types';
import { formatINR, formatDateDisplay } from '@/lib/template-engine';
import {
  FileText,
  Receipt,
  Plus,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Users2,
  Download,
  Sliders,
  Sparkles,
  Search,
  ChevronRight,
  Zap,
  Loader2,
  ExternalLink,
} from 'lucide-react';

export default function DashboardPage() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [dashboardTypeFilter, setDashboardTypeFilter] = useState<'all' | 'invoice' | 'bill'>('all');

  useEffect(() => {
    async function loadData() {
      try {
        const [docsRes, clientsRes] = await Promise.all([
          fetch('/api/documents').then((r) => r.json()),
          fetch('/api/clients').then((r) => r.json()),
        ]);
        if (docsRes.success) setDocuments(docsRes.documents || []);
        if (clientsRes.success) setClients(clientsRes.clients || []);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalInvoiced = documents.reduce((sum, d) => sum + (d.payment?.totalAmount || 0), 0);
  const pendingAmount = documents.reduce((sum, d) => sum + (d.payment?.balanceAmount || 0), 0);
  const paidCount = documents.filter((d) => d.payment?.status === 'PAID').length;

  const filteredDocs = documents.filter((d) => {
    const matchesSearch =
      d.documentNumber.toLowerCase().includes(searchFilter.toLowerCase()) ||
      d.clientData.name.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesType =
      dashboardTypeFilter === 'all' || d.documentType === dashboardTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 lg:space-y-8">
        {/* EXECUTIVE HERO BANNER (CLEAN WHITE THEME WITH ARVO & #3944BC) */}
        <div className="relative rounded-3xl bg-gradient-to-br from-white via-slate-50 to-[#3944BC]/5 border border-slate-200/90 p-5 sm:p-8 lg:p-10 shadow-xs overflow-hidden">
          {/* Subtle Glow Background Accents */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#3944BC]/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3944BC]/10 border border-[#3944BC]/20 text-[#3944BC] text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-[#3944BC]" />
                <span className="font-arvo font-bold tracking-wide">V2 Labs Global Suite</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-arvo font-bold text-slate-900 tracking-tight">
                V2 REPORT
              </h1>
              <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
                <span className="font-arvo font-bold text-slate-900">Create. Generate. Send.</span> — High-precision document automation preserving authentic V2 Labs master invoice and bill layouts with deterministic vector outputs.
              </p>
            </div>

            {/* Quick Action Buttons (Optimized 2-Column on Mobile, Inline on Desktop) */}
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
              <Link
                href="/documents/new?type=invoice"
                className="flex items-center justify-center gap-2 px-4 sm:px-5 py-3 rounded-2xl bg-[#3944BC] hover:bg-[#2e3799] text-white font-arvo font-bold text-xs uppercase tracking-wider shadow-md shadow-[#3944BC]/25 transition transform active:scale-95 text-center"
              >
                <FileText className="w-4 h-4 shrink-0" />
                <span>+ Invoice</span>
              </Link>

              <Link
                href="/documents/new?type=bill"
                className="flex items-center justify-center gap-2 px-4 sm:px-5 py-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-arvo font-bold text-xs uppercase tracking-wider border border-slate-300 shadow-xs transition transform active:scale-95 text-center"
              >
                <Receipt className="w-4 h-4 text-[#3944BC] shrink-0" />
                <span>+ Bill</span>
              </Link>
            </div>
          </div>
        </div>

        {/* METRICS ROW (CLEAN WHITE CARDS WITH ARVO NUMBERS) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-[#3944BC]/40 transition">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                Total Value
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#3944BC]/10 text-[#3944BC] flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl sm:text-2xl font-arvo font-bold text-slate-900 tracking-tight">
                {formatINR(totalInvoiced)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Across all generated docs</div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-amber-300 transition">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                Pending Balance
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl sm:text-2xl font-arvo font-bold text-amber-600 tracking-tight">
                {formatINR(pendingAmount)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Awaiting client payment</div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                Settled / Paid
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl sm:text-2xl font-arvo font-bold text-emerald-600 tracking-tight">
                {paidCount} Docs
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Received in full</div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-[#3944BC]/40 transition">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                Active Clients
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#3944BC]/10 text-[#3944BC] flex items-center justify-center">
                <Users2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl sm:text-2xl font-arvo font-bold text-slate-900 tracking-tight">
                {clients.length} Clients
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">German with Gaurav & more</div>
            </div>
          </div>
        </div>

        {/* MASTER TEMPLATES QUICK LAUNCH (AUTHENTIC V2 TEMPLATES) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-arvo font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#3944BC]" /> V2 Master Document Templates
              </h2>
              <p className="text-xs text-slate-500">
                Pixel-accurate blank master templates ready for 1-click generation.
              </p>
            </div>
            <Link
              href="/templates/designer"
              className="text-xs font-bold text-[#3944BC] hover:underline flex items-center gap-1 transition"
            >
              <span>Template Designer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Invoice Master Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between hover:border-[#3944BC]/50 hover:shadow-md transition group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#3944BC]/10 text-[#3944BC] flex items-center justify-center font-bold">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-arvo font-bold text-slate-900 text-sm group-hover:text-[#3944BC] transition">
                        V2 Labs Global Invoice
                      </h3>
                      <div className="text-[10px] text-slate-500 font-mono">Template: v2-invoice</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-arvo font-bold uppercase bg-[#3944BC]/10 text-[#3944BC] border border-[#3944BC]/20">
                    A4 Master
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  A4 layout with right metadata, 3-row service table, 6 vector checkboxes for Project Section, auto payment calculation, and status-driven legal declaration.
                </p>

                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  <div>• Default Rows: <span className="font-bold text-slate-800">3 Rows</span></div>
                  <div>• Checkbox Engine: <span className="font-bold text-[#3944BC]">Vector ✓</span></div>
                  <div>• Space Guard: <span className="font-bold text-emerald-600">Multi-page auto</span></div>
                  <div>• Alignment: <span className="font-bold text-slate-800">Calibrated</span></div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <Link
                  href="/documents/new?type=invoice"
                  className="px-4 py-2 rounded-xl bg-[#3944BC] hover:bg-[#2e3799] text-white font-arvo font-bold text-xs shadow-xs transition flex items-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Invoice</span>
                </Link>
                <Link
                  href="/templates/designer?template=v2-invoice"
                  className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Inspect</span>
                </Link>
              </div>
            </div>

            {/* Bill Master Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between hover:border-[#3944BC]/50 hover:shadow-md transition group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-arvo font-bold text-slate-900 text-sm group-hover:text-[#3944BC] transition">
                        V2 Labs Global Bill
                      </h3>
                      <div className="text-[10px] text-slate-500 font-mono">Template: v2-bill</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-arvo font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Recurring Master
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Tailored for recurring monthly services (e.g. German with Gaurav). Features Billed-To container, 4-row duration table, auto billing period, and notes box.
                </p>

                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  <div>• Default Rows: <span className="font-bold text-slate-800">4 Rows</span></div>
                  <div>• Duration Col: <span className="font-bold text-slate-800">Included</span></div>
                  <div>• Notes Wrap: <span className="font-bold text-emerald-600">Strict bounds</span></div>
                  <div>• Footer Guard: <span className="font-bold text-slate-800">Protected</span></div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <Link
                  href="/documents/new?type=bill"
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-arvo font-bold text-xs shadow-xs transition flex items-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5 text-blue-300" />
                  <span>Create Bill</span>
                </Link>
                <Link
                  href="/templates/designer?template=v2-bill"
                  className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Inspect</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* QUICK CLIENT LAUNCHPAD (1-CLICK INVOICING) */}
        {clients.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#3944BC]/10 text-[#3944BC] flex items-center justify-center">
                  <Users2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-arvo font-bold text-slate-900 uppercase tracking-wider">
                    Quick Client Launchpad
                  </h3>
                  <p className="text-[11px] text-slate-500">1-tap instant invoice or bill creation</p>
                </div>
              </div>
              <Link
                href="/clients"
                className="text-xs font-bold text-[#3944BC] hover:underline flex items-center gap-1"
              >
                <span>All Clients</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {clients.slice(0, 3).map((client) => (
                <div
                  key={client.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-[#3944BC]/50 flex items-center justify-between transition group"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-arvo font-bold text-xs text-slate-900 truncate group-hover:text-[#3944BC] transition">
                      {client.name}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {client.companyName || client.email || 'Client'}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Link
                      href={`/documents/new?type=invoice&clientId=${client.id}`}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[#3944BC] hover:bg-[#3944BC] hover:text-white font-arvo font-bold text-[10px] shadow-xs transition"
                      title="Create Invoice for this client"
                    >
                      + Inv
                    </Link>
                    <Link
                      href={`/documents/new?type=bill&clientId=${client.id}`}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-800 hover:text-white font-arvo font-bold text-[10px] shadow-xs transition"
                      title="Create Bill for this client"
                    >
                      + Bill
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RECENT DOCUMENTS (DUAL-VIEW: RESPONSIVE CARDS ON MOBILE, TABLE ON DESKTOP) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-sm font-arvo font-bold text-slate-900 uppercase tracking-wider">
                Recent Documents
              </h2>
              <p className="text-xs text-slate-500">
                Live records in V2 REPORT database.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              {/* Filter Tabs */}
              <div className="flex items-center bg-slate-100 border border-slate-200 p-0.5 rounded-xl text-xs">
                <button
                  onClick={() => setDashboardTypeFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-arvo font-bold transition ${
                    dashboardTypeFilter === 'all'
                      ? 'bg-[#3944BC] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setDashboardTypeFilter('invoice')}
                  className={`px-3 py-1 rounded-lg text-xs font-arvo font-bold transition flex items-center gap-1 ${
                    dashboardTypeFilter === 'invoice'
                      ? 'bg-[#3944BC] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3 h-3" /> Invoices
                </button>
                <button
                  onClick={() => setDashboardTypeFilter('bill')}
                  className={`px-3 py-1 rounded-lg text-xs font-arvo font-bold transition flex items-center gap-1 ${
                    dashboardTypeFilter === 'bill'
                      ? 'bg-[#3944BC] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Receipt className="w-3 h-3" /> Bills
                </button>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Quick search..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#3944BC] w-32 sm:w-44"
                />
              </div>

              <Link
                href="/documents"
                className="text-xs font-bold text-[#3944BC] hover:underline flex items-center gap-1 shrink-0"
              >
                <span>View All</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin text-[#3944BC]" />
              <span className="text-xs font-semibold">Loading documents...</span>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No matching documents found.
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE VIEW (Visible on md and up) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200/90">
                      <th className="py-3 px-4">Document</th>
                      <th className="py-3 px-4">Client</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDocs.slice(0, 6).map((doc) => {
                      const isInv = doc.documentType === 'invoice';
                      return (
                        <tr
                          key={doc.id}
                          className="hover:bg-slate-50/80 transition group cursor-pointer"
                        >
                          <td className="py-3.5 px-4">
                            <Link
                              href={`/documents/${doc.id}`}
                              className="font-arvo font-bold text-slate-900 group-hover:text-[#3944BC] flex items-center gap-2 transition"
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  isInv ? 'bg-[#3944BC]' : 'bg-indigo-500'
                                }`}
                              />
                              {doc.documentNumber}
                            </Link>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800">{doc.clientData?.name}</div>
                            {doc.clientData?.companyName && (
                              <div className="text-[10px] text-slate-500">{doc.clientData.companyName}</div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-slate-500">
                            {formatDateDisplay(doc.documentDate)}
                          </td>

                          <td className="py-3.5 px-4 text-right font-arvo font-bold text-slate-900">
                            {formatINR(doc.payment?.totalAmount || 0)}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-arvo font-bold uppercase tracking-wider ${
                                doc.payment?.status === 'PAID'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : doc.payment?.status === 'PARTIALLY_PAID'
                                  ? 'bg-[#3944BC]/10 text-[#3944BC] border border-[#3944BC]/20'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {doc.payment?.status || 'PENDING'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <a
                                href={`/api/documents/${doc.id}/pdf?download=true`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-1.5 hover:bg-[#3944BC]/10 text-slate-400 hover:text-[#3944BC] rounded-lg transition"
                                title="Download PDF"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                              <Link
                                href={`/documents/${doc.id}`}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#3944BC] text-slate-700 hover:text-white font-arvo font-bold text-[10px] transition"
                              >
                                Open
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* MOBILE TOUCH-FIRST CARD VIEW (Visible on mobile, no horizontal scrolling) */}
              <div className="md:hidden divide-y divide-slate-100">
                {filteredDocs.slice(0, 6).map((doc) => {
                  const isInv = doc.documentType === 'invoice';
                  return (
                    <div
                      key={doc.id}
                      className="p-4 space-y-2.5 hover:bg-slate-50/50 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                              isInv ? 'bg-[#3944BC]' : 'bg-indigo-500'
                            }`}
                          />
                          <Link
                            href={`/documents/${doc.id}`}
                            className="font-arvo font-bold text-slate-900 text-xs truncate"
                          >
                            {doc.documentNumber}
                          </Link>
                          <span className="text-[10px] text-slate-400 font-mono">
                            • {formatDateDisplay(doc.documentDate)}
                          </span>
                        </div>

                        <span
                          className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-arvo font-bold uppercase tracking-wider ${
                            doc.payment?.status === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : doc.payment?.status === 'PARTIALLY_PAID'
                              ? 'bg-[#3944BC]/10 text-[#3944BC] border border-[#3944BC]/20'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {doc.payment?.status || 'PENDING'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <div className="min-w-0 pr-2">
                          <div className="font-semibold text-slate-800 text-xs truncate">
                            {doc.clientData?.name}
                          </div>
                          {doc.clientData?.companyName && (
                            <div className="text-[10px] text-slate-500 truncate">
                              {doc.clientData.companyName}
                            </div>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-sm font-arvo font-bold text-slate-900">
                            {formatINR(doc.payment?.totalAmount || 0)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                        <a
                          href={`/api/documents/${doc.id}/pdf?download=true`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-[#3944BC]/10 text-slate-700 hover:text-[#3944BC] text-[11px] font-semibold flex items-center gap-1 transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </a>
                        <Link
                          href={`/documents/${doc.id}`}
                          className="px-3 py-1.5 rounded-lg bg-[#3944BC] hover:bg-[#2e3799] text-white font-arvo font-bold text-[11px] shadow-xs transition flex items-center gap-1"
                        >
                          <span>Open</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
