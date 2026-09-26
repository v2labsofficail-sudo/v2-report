'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save,
  Download,
  Printer,
  Copy,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  Building,
  UserCheck,
  Calendar,
  Layers,
  FileCheck,
  Sparkles,
} from 'lucide-react';
import {
  DocumentRecord,
  DocumentTemplate,
  OrganizationSettings,
  Client,
  DocumentItem,
  PaymentStatus,
} from '@/lib/types';
import {
  formatINR,
  calculatePaymentStatus,
  getDeclarationText,
  generateBillingPeriodText,
  validateDocumentSpace,
} from '@/lib/template-engine';

interface DocumentFormProps {
  initialDocument: DocumentRecord;
  template: DocumentTemplate;
  organization: OrganizationSettings;
  clients: Client[];
  onDocumentChange: (updated: DocumentRecord) => void;
}

const PROJECT_CATEGORIES = [
  'Web Development',
  'Mobile Development',
  'Digital Marketing',
  'SEO',
  'AI Solution',
  'ERP CRM SYSTEM',
];

export default function DocumentForm({
  initialDocument,
  template,
  organization: org,
  clients,
  onDocumentChange,
}: DocumentFormProps) {
  const router = useRouter();
  const [doc, setDoc] = useState<DocumentRecord>(initialDocument);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientCompany, setNewClientCompany] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [billingStart, setBillingStart] = useState(doc.billingPeriod?.startDate || '');
  const [billingEnd, setBillingEnd] = useState(doc.billingPeriod?.endDate || '');

  const isInvoice = doc.documentType === 'invoice';
  const isBill = doc.documentType === 'bill';

  // Synchronize state changes with parent
  const updateDoc = (fields: Partial<DocumentRecord>) => {
    const updated = { ...doc, ...fields };
    setDoc(updated);
    onDocumentChange(updated);
  };

  // Recalculate totals whenever items or amountPaid change
  const recalculateAmounts = (newItems: DocumentItem[], paidVal = doc.payment.amountPaid) => {
    const total = newItems.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
    const balance = Math.max(0, total - paidVal);
    const status = calculatePaymentStatus(total, paidVal);
    const declaration = getDeclarationText(status, org.declarationPresets);

    const updatedPayment = {
      ...doc.payment,
      totalAmount: total,
      amountPaid: paidVal,
      balanceAmount: balance,
      status,
    };

    updateDoc({
      items: newItems,
      payment: updatedPayment,
      declarationText: isInvoice ? declaration : doc.declarationText,
    });
  };

  // Client Selection
  const handleClientSelect = (clientId: string) => {
    const found = clients.find((c) => c.id === clientId);
    if (!found) return;

    updateDoc({
      clientId: found.id,
      clientData: {
        name: found.name,
        companyName: found.companyName || '',
        email: found.email,
        phone: found.phone,
        address: found.address || '',
      },
    });
  };

  // Quick Client Creation
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newClientName,
          companyName: newClientCompany,
          email: newClientEmail,
          phone: newClientPhone,
        }),
      });
      const data = await res.json();
      if (data.success && data.client) {
        updateDoc({
          clientId: data.client.id,
          clientData: {
            name: data.client.name,
            companyName: data.client.companyName || '',
            email: data.client.email,
            phone: data.client.phone,
          },
        });
        setShowAddClientModal(false);
        setNewClientName('');
        setNewClientCompany('');
        setNewClientEmail('');
        setNewClientPhone('');
      }
    } catch (err) {
      console.error('Failed to create client', err);
    }
  };

  // Service Items Handlers
  const handleAddItem = () => {
    const nextSrNo = doc.items.length + 1;
    const newItem: DocumentItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      srNo: nextSrNo,
      name: '',
      description: '',
      duration: isBill ? '1 Month' : undefined,
      amount: 0,
    };
    const newItems = [...doc.items, newItem];
    recalculateAmounts(newItems);
  };

  const handleRemoveItem = (index: number) => {
    const filtered = doc.items.filter((_, i) => i !== index);
    const reindexed = filtered.map((it, idx) => ({ ...it, srNo: idx + 1 }));
    recalculateAmounts(reindexed);
  };

  const handleItemChange = (index: number, key: keyof DocumentItem, value: any) => {
    const newItems = [...doc.items];
    newItems[index] = {
      ...newItems[index],
      [key]: key === 'amount' ? (Number(value) || 0) : value,
    };
    recalculateAmounts(newItems);
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === doc.items.length - 1)
    ) {
      return;
    }
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const newItems = [...doc.items];
    const temp = newItems[index];
    newItems[index] = newItems[targetIdx];
    newItems[targetIdx] = temp;
    const reindexed = newItems.map((it, idx) => ({ ...it, srNo: idx + 1 }));
    recalculateAmounts(reindexed);
  };

  // Project Categories Checkboxes
  const handleToggleCategory = (category: string) => {
    const current = new Set(doc.projectCategories || []);
    if (current.has(category)) {
      current.delete(category);
    } else {
      current.add(category);
    }
    updateDoc({ projectCategories: Array.from(current) });
  };

  // Billing Period Handler
  const handleBillingDateChange = (start: string, end: string) => {
    setBillingStart(start);
    setBillingEnd(end);
    const displayText = generateBillingPeriodText(start, end);
    updateDoc({
      billingPeriod: {
        startDate: start,
        endDate: end,
        displayText,
      },
    });
  };

  // Save Document
  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doc),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        updateDoc({ id: data.document.id });
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert(data.error || 'Failed to save document');
      }
    } catch (err: any) {
      alert(err.message || 'Error saving document');
    } finally {
      setIsSaving(false);
    }
  };

  // Generate & Download PDF
  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      // First save to guarantee source of truth
      const saveRes = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doc),
      });
      const saveData = await saveRes.json();
      const docId = saveData.document?.id || doc.id;

      // Trigger download
      window.open(`/api/documents/${docId}/pdf?download=true`, '_blank');
    } catch (err: any) {
      alert('Failed to generate PDF: ' + err.message);
    } finally {
      setIsDownloading(false);
    }
  };

  // Duplicate Document
  const handleDuplicate = async () => {
    if (!doc.id || doc.id.startsWith('temp-')) {
      alert('Please save this document before duplicating.');
      return;
    }
    try {
      const res = await fetch(`/api/documents/${doc.id}/duplicate`, { method: 'POST' });
      const data = await res.json();
      if (data.success && data.document) {
        router.push(`/documents/${data.document.id}`);
      }
    } catch (err: any) {
      alert('Failed to duplicate: ' + err.message);
    }
  };

  // Space validation issues
  const validationIssues = validateDocumentSpace(doc, template);

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Sticky Top Action Bar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-arvo font-bold text-sm text-slate-900 tracking-tight">
              {isInvoice ? 'Invoice Master Form' : 'Bill Master Form'}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-arvo font-bold bg-[#3944BC]/10 text-[#3944BC]">
              {doc.documentNumber}
            </span>
            {saveSuccess && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Backend authoritative calculations • Vector layout sync
          </div>
        </div>

        <div className="flex items-center gap-2">
          {doc.id && !doc.id.startsWith('temp-') && (
            <button
              type="button"
              onClick={handleDuplicate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
              title="Duplicate document"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Duplicate</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Data'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#3944BC] hover:bg-[#2e3799] text-white text-xs font-bold shadow-md shadow-[#3944BC]/25 transition disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isDownloading ? 'Rendering...' : 'Generate PDF'}</span>
          </button>
        </div>
      </div>

      {/* Validation Warnings Alert Bar */}
      {validationIssues.length > 0 && (
        <div className="bg-amber-50/90 border-b border-amber-200 px-4 py-2 flex items-center justify-between text-xs text-amber-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{validationIssues[0].message}</span>
          </div>
          {validationIssues.length > 1 && (
            <span className="font-semibold text-[10px] bg-amber-200/70 px-2 py-0.5 rounded-full">
              +{validationIssues.length - 1} more notes
            </span>
          )}
        </div>
      )}

      {/* Scrollable Form Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* SECTION 1: DOCUMENT DETAILS */}
        <section className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" /> 1. Document Details
            </h3>
            <span className="text-[10px] text-slate-400">Server Auto-Assigned</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-600 font-medium mb-1">
                {isInvoice ? 'Invoice No.' : 'Bill No.'}
              </label>
              <input
                type="text"
                value={doc.documentNumber}
                onChange={(e) => updateDoc({ documentNumber: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">Document Date</label>
              <input
                type="date"
                value={doc.documentDate}
                onChange={(e) => updateDoc({ documentDate: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {isInvoice ? (
              <>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Purpose / Project Title</label>
                  <input
                    type="text"
                    value={doc.purpose || ''}
                    placeholder="e.g. Social Media Management"
                    onChange={(e) => updateDoc({ purpose: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Currency</label>
                  <input
                    type="text"
                    value={doc.currency || 'INR'}
                    onChange={(e) => updateDoc({ currency: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Due Date</label>
                  <input
                    type="date"
                    value={doc.dueDate || ''}
                    onChange={(e) => updateDoc({ dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Billing Period Range</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="date"
                      value={billingStart}
                      onChange={(e) => handleBillingDateChange(e.target.value, billingEnd)}
                      className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="date"
                      value={billingEnd}
                      onChange={(e) => handleBillingDateChange(billingStart, e.target.value)}
                      className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {doc.billingPeriod?.displayText && (
                    <div className="mt-1 text-[11px] text-blue-700 font-medium font-mono">
                      → {doc.billingPeriod.displayText}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </section>

        {/* SECTION 2: CLIENT SELECTOR */}
        <section className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-blue-600" /> 2. Client Information
            </h3>
            <button
              type="button"
              onClick={() => setShowAddClientModal(true)}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add New Client
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 font-medium mb-1">Select Saved Client</label>
              <select
                value={doc.clientId || ''}
                onChange={(e) => handleClientSelect(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">-- Choose client to auto-fill --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.companyName ? `(${c.companyName})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Client Name</label>
                <input
                  type="text"
                  value={doc.clientData?.name || ''}
                  onChange={(e) =>
                    updateDoc({
                      clientData: { ...doc.clientData, name: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Company Name</label>
                <input
                  type="text"
                  value={doc.clientData?.companyName || ''}
                  onChange={(e) =>
                    updateDoc({
                      clientData: { ...doc.clientData, companyName: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Client Email</label>
                <input
                  type="email"
                  value={doc.clientData?.email || ''}
                  onChange={(e) =>
                    updateDoc({
                      clientData: { ...doc.clientData, email: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Client Phone</label>
                <input
                  type="text"
                  value={doc.clientData?.phone || ''}
                  onChange={(e) =>
                    updateDoc({
                      clientData: { ...doc.clientData, phone: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: SERVICES DYNAMIC TABLE */}
        <section className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" /> 3. Service Items
              </h3>
              <p className="text-[10px] text-slate-500">
                Default Master Capacity: {isInvoice ? '3 rows' : '4 rows'}. Adding more triggers clean multi-page continuation.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddItem}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Add Service
            </button>
          </div>

          <div className="space-y-3">
            {doc.items.map((item, index) => (
              <div
                key={item.id || index}
                className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 relative shadow-xs"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-800">
                    Row #{item.srNo}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleMoveItem(index, 'up')}
                      disabled={index === 0}
                      className="p-1 hover:bg-slate-100 rounded text-slate-500 disabled:opacity-30"
                      title="Move Up"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveItem(index, 'down')}
                      disabled={index === doc.items.length - 1}
                      className="p-1 hover:bg-slate-100 rounded text-slate-500 disabled:opacity-30"
                      title="Move Down"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-1 hover:bg-red-50 text-red-500 rounded transition ml-1"
                      title="Remove Row"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
                  <div className={isBill ? 'sm:col-span-5' : 'sm:col-span-6'}>
                    <label className="block text-slate-500 text-[10px] font-medium mb-0.5">
                      Service / Project Name
                    </label>
                    <input
                      type="text"
                      value={item.name}
                      placeholder="e.g. Website Development"
                      onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold focus:bg-white focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {isInvoice ? (
                    <div className="sm:col-span-4">
                      <label className="block text-slate-500 text-[10px] font-medium mb-0.5">
                        Description
                      </label>
                      <input
                        type="text"
                        value={item.description || ''}
                        placeholder="e.g. Next.js SaaS & API Integration"
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  ) : (
                    <div className="sm:col-span-3">
                      <label className="block text-slate-500 text-[10px] font-medium mb-0.5">
                        Duration
                      </label>
                      <input
                        type="text"
                        value={item.duration || ''}
                        placeholder="e.g. 1 Month"
                        onChange={(e) => handleItemChange(index, 'duration', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  <div className={isBill ? 'sm:col-span-4' : 'sm:col-span-2'}>
                    <label className="block text-slate-500 text-[10px] font-medium mb-0.5">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={item.amount || ''}
                      onChange={(e) => handleItemChange(index, 'amount', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 text-right focus:bg-white focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between text-xs">
            <span className="font-semibold text-blue-900">Total Calculated Amount:</span>
            <span className="font-extrabold text-base text-blue-900 font-mono">
              {formatINR(doc.payment.totalAmount)}
            </span>
          </div>
        </section>

        {/* SECTION 4: PROJECT CATEGORIES (INVOICE ONLY) */}
        {isInvoice && (
          <section className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
            <div className="mb-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-blue-600" /> 4. Project Categories (✓)
              </h3>
              <p className="text-[10px] text-slate-500">
                Vector checkmarks rendered at exact master template anchor coordinates.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
              {PROJECT_CATEGORIES.map((cat) => {
                const isSelected = (doc.projectCategories || []).includes(cat);
                return (
                  <label
                    key={cat}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium cursor-pointer transition ${
                      isSelected
                        ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleCategory(cat)}
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span>{cat}</span>
                  </label>
                );
              })}
            </div>
          </section>
        )}

        {/* SECTION 5: PAYMENT SUMMARY */}
        <section className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" /> 5. Payment & Balance Summary
            </h3>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded">
              Auto-Calculated
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-slate-600 font-medium mb-1">Total Amount (₹)</label>
              <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg font-bold text-slate-800 text-right">
                {formatINR(doc.payment.totalAmount)}
              </div>
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">Amount Paid (₹)</label>
              <input
                type="number"
                value={doc.payment.amountPaid || 0}
                onChange={(e) => {
                  const paid = Number(e.target.value) || 0;
                  recalculateAmounts(doc.items, paid);
                }}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-bold text-emerald-700 text-right focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">Balance Amount (₹)</label>
              <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg font-bold text-slate-800 text-right">
                {formatINR(doc.payment.balanceAmount)}
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
            <span className="text-slate-600 font-medium">Derived Payment Status:</span>
            <span
              className={`px-3 py-1 rounded-full font-bold uppercase text-[10px] tracking-wider ${
                doc.payment.status === 'PAID'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : doc.payment.status === 'PARTIALLY_PAID'
                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}
            >
              {doc.payment.status}
            </span>
          </div>
        </section>

        {/* SECTION 6: DECLARATION (INVOICE) OR NOTES (BILL) */}
        {isInvoice ? (
          <section className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-blue-600" /> 6. Dynamic Declaration
              </h3>
              <span className="text-[10px] text-blue-700 font-medium">Status-Driven</span>
            </div>
            <textarea
              rows={3}
              value={doc.declarationText || getDeclarationText(doc.payment.status, org.declarationPresets)}
              onChange={(e) => updateDoc({ declarationText: e.target.value })}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 leading-relaxed focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </section>
        ) : (
          <section className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-blue-600" /> 6. Bill Notes
              </h3>
              <span className="text-[10px] text-slate-400">
                {(doc.notes || '').length}/240 chars
              </span>
            </div>
            <textarea
              rows={3}
              value={doc.notes || ''}
              placeholder="e.g. This bill is for monthly social media management and support services..."
              onChange={(e) => updateDoc({ notes: e.target.value })}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 leading-relaxed focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </section>
        )}

        {/* SECTION 7: PREPARED BY & SIGNATURE TOGGLES */}
        <section className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-blue-600" /> 7. Prepared By & Stamp
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-600 font-medium mb-1">Prepared By Team Member</label>
              <select
                value={doc.preparedBy?.name || org.teamMembers[0]?.name}
                onChange={(e) => {
                  const m = org.teamMembers.find((mem) => mem.name === e.target.value);
                  if (m) {
                    updateDoc({
                      preparedBy: {
                        name: m.name,
                        organization: org.name,
                        email: m.email,
                        contact: m.contact,
                        location: m.location,
                      },
                    });
                  }
                }}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-blue-500"
              >
                {org.teamMembers.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={doc.showStamp}
                  onChange={(e) => updateDoc({ showStamp: e.target.checked })}
                  className="rounded text-blue-600 h-4 w-4"
                />
                <span className="text-xs font-medium text-slate-700">Display Stamp</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={doc.showSignature}
                  onChange={(e) => updateDoc({ showSignature: e.target.checked })}
                  className="rounded text-blue-600 h-4 w-4"
                />
                <span className="text-xs font-medium text-slate-700">Display Signature</span>
              </label>
            </div>
          </div>
        </section>
      </div>

      {/* QUICK ADD CLIENT MODAL */}
      {showAddClientModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-extrabold text-base text-slate-900 mb-1">Add New Client</h3>
            <p className="text-xs text-slate-500 mb-4">
              Save client info to your V2 DOCS directory for future documents.
            </p>
            <form onSubmit={handleCreateClient} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Client / Contact Name *</label>
                <input
                  type="text"
                  required
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Gaurav Raghuvanshi"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Company Name</label>
                <input
                  type="text"
                  value={newClientCompany}
                  onChange={(e) => setNewClientCompany(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. German with Gaurav"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="contact@company.com"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="+91 98200 12345"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddClientModal(false)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-sm"
                >
                  Save & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
