'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { DocumentRecord, DocumentType, PaymentStatus } from '@/lib/types';
import { formatINR, formatDateDisplay } from '@/lib/template-engine';
import {
  FileText,
  Receipt,
  Search,
  Plus,
  Download,
  Copy,
  Trash2,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

export default function DocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<'all' | 'invoice' | 'bill'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadDocuments = async () => {
    setLoading(true);
    try {
      let url = '/api/documents?';
      if (typeFilter !== 'all') url += `type=${typeFilter}&`;
      if (statusFilter !== 'all') url += `status=${statusFilter}&`;
      if (searchQuery.trim()) url += `search=${encodeURIComponent(searchQuery.trim())}&`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error('Failed to load documents', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [typeFilter, statusFilter, searchQuery]);

  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/documents/${id}/duplicate`, { method: 'POST' });
      const data = await res.json();
      if (data.success && data.document) {
        router.push(`/documents/${data.document.id}`);
      }
    } catch (err: any) {
      alert('Failed to duplicate document: ' + err.message);
    }
  };

  const handleDelete = async (id: string, docNumber: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete ${docNumber}?`)) return;

    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setDocuments((prev) => prev.filter((d) => d.id !== id));
      }
    } catch (err: any) {
      alert('Failed to delete document: ' + err.message);
    }
  };

  // Metrics
  const totalAmountSum = documents.reduce((sum, d) => sum + (d.payment?.totalAmount || 0), 0);
  const pendingAmountSum = documents.reduce((sum, d) => sum + (d.payment?.balanceAmount || 0), 0);
  const paidCount = documents.filter((d) => d.payment?.status === 'PAID').length;

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-arvo font-bold text-slate-900 tracking-tight">Documents</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-arvo font-bold uppercase bg-[#3944BC]/10 text-[#3944BC] border border-[#3944BC]/20">
                V2 REPORT
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Manage, generate, and duplicate V2 Labs invoices, bills, and business documents.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
            <Link
              href="/documents/new?type=invoice"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#3944BC] hover:bg-[#2e3799] text-white text-xs font-arvo font-bold shadow-md shadow-[#3944BC]/25 transition active:scale-95"
            >
              <FileText className="w-4 h-4" />
              <span>+ New Invoice</span>
            </Link>
            <Link
              href="/documents/new?type=bill"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-arvo font-bold border border-slate-300 shadow-xs transition active:scale-95"
            >
              <Receipt className="w-4 h-4 text-[#3944BC]" />
              <span>+ New Bill</span>
            </Link>
          </div>
        </div>

        {/* Top Summary Cards (Clean White Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                Total Value
              </div>
              <div className="text-2xl font-arvo font-bold text-slate-900 mt-1">
                {formatINR(totalAmountSum)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">{documents.length} Total Documents</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#3944BC]/10 text-[#3944BC] flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                Outstanding Balance
              </div>
              <div className="text-2xl font-arvo font-bold text-amber-600 mt-1">
                {formatINR(pendingAmountSum)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Pending collection</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                Settled / Paid
              </div>
              <div className="text-2xl font-arvo font-bold text-emerald-600 mt-1">
                {paidCount} Docs
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Payment received in full</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
          {/* Document Type Tabs */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl w-full md:w-auto border border-slate-200/80">
            <button
              onClick={() => setTypeFilter('all')}
              className={`flex-1 md:flex-initial px-3 py-1.5 rounded-lg text-xs font-arvo font-bold transition text-center ${
                typeFilter === 'all'
                  ? 'bg-[#3944BC] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setTypeFilter('invoice')}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-arvo font-bold transition ${
                typeFilter === 'invoice'
                  ? 'bg-[#3944BC] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> Invoices
            </button>
            <button
              onClick={() => setTypeFilter('bill')}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-arvo font-bold transition ${
                typeFilter === 'bill'
                  ? 'bg-[#3944BC] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" /> Bills
            </button>
          </div>

          {/* Status Filter & Search Input */}
          <div className="flex items-center gap-2.5 sm:gap-3 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-[#3944BC] focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="PAID">Paid</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
              <option value="PENDING">Pending</option>
              <option value="OVERDUE">Overdue</option>
            </select>

            <div className="relative flex-1 md:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                placeholder="Search number or client..."
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#3944BC] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Documents Content (Dual-View: Desktop Table + Mobile Cards) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin text-[#3944BC]" />
              <span className="text-xs font-semibold">Loading documents...</span>
            </div>
          ) : documents.length === 0 ? (
            <div className="py-20 text-center space-y-3 px-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <FileText className="w-6 h-6" />
              </div>
              <div className="text-sm font-arvo font-bold text-slate-900">No documents found</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No documents match your active filter. Create a new document in seconds using the V2 Labs master templates.
              </p>
              <div className="flex justify-center gap-2 pt-2">
                <Link
                  href="/documents/new?type=invoice"
                  className="px-4 py-2 bg-[#3944BC] hover:bg-[#2e3799] text-white rounded-xl text-xs font-arvo font-bold shadow-md shadow-[#3944BC]/25 transition"
                >
                  + Create Invoice
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE VIEW */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                      <th className="py-3 px-4">Document</th>
                      <th className="py-3 px-4">Client</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-right">Total Amount</th>
                      <th className="py-3 px-4 text-right">Balance</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {documents.map((doc) => {
                      const isInv = doc.documentType === 'invoice';
                      return (
                        <tr
                          key={doc.id}
                          onClick={() => router.push(`/documents/${doc.id}`)}
                          className="hover:bg-slate-50/80 cursor-pointer transition group"
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black ${
                                  isInv ? 'bg-[#3944BC]/10 text-[#3944BC]' : 'bg-indigo-50 text-indigo-700'
                                }`}
                              >
                                {isInv ? 'INV' : 'BILL'}
                              </div>
                              <div>
                                <div className="font-arvo font-bold text-slate-900 group-hover:text-[#3944BC] transition">
                                  {doc.documentNumber}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {isInv ? (doc.purpose || 'Invoice') : (doc.billingPeriod?.displayText || 'Recurring Bill')}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800">{doc.clientData?.name}</div>
                            {doc.clientData?.companyName && (
                              <div className="text-[10px] text-slate-500">{doc.clientData.companyName}</div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-slate-500">
                            <div>{formatDateDisplay(doc.documentDate)}</div>
                            {doc.dueDate && (
                              <div className="text-[10px] text-slate-400">Due: {formatDateDisplay(doc.dueDate)}</div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right font-arvo font-bold text-slate-900">
                            {formatINR(doc.payment?.totalAmount || 0)}
                          </td>

                          <td className="py-3.5 px-4 text-right font-arvo font-bold">
                            {doc.payment?.balanceAmount > 0 ? (
                              <span className="text-amber-600">{formatINR(doc.payment.balanceAmount)}</span>
                            ) : (
                              <span className="text-slate-400">₹0</span>
                            )}
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
                            <div className="flex items-center justify-end gap-1.5">
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

                              <button
                                type="button"
                                onClick={(e) => handleDuplicate(doc.id, e)}
                                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition"
                                title="Duplicate Document"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={(e) => handleDelete(doc.id, doc.documentNumber, e)}
                                className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition"
                                title="Delete Document"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              <ChevronRight className="w-4 h-4 text-slate-300 ml-1 group-hover:text-[#3944BC] group-hover:translate-x-0.5 transition" />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* MOBILE TOUCH-FIRST CARD VIEW */}
              <div className="md:hidden divide-y divide-slate-100">
                {documents.map((doc) => {
                  const isInv = doc.documentType === 'invoice';
                  return (
                    <div
                      key={doc.id}
                      onClick={() => router.push(`/documents/${doc.id}`)}
                      className="p-4 space-y-2.5 hover:bg-slate-50/50 transition cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                              isInv ? 'bg-[#3944BC]' : 'bg-indigo-500'
                            }`}
                          />
                          <span className="font-arvo font-bold text-slate-900 text-xs truncate">
                            {doc.documentNumber}
                          </span>
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
                          {doc.payment?.balanceAmount > 0 && (
                            <div className="text-[10px] text-amber-600 font-arvo font-semibold">
                              Bal: {formatINR(doc.payment.balanceAmount)}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => handleDuplicate(doc.id, e)}
                            className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg text-[10px] font-semibold flex items-center gap-1"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDelete(doc.id, doc.documentNumber, e)}
                            className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg text-[10px]"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <a
                            href={`/api/documents/${doc.id}/pdf?download=true`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
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
