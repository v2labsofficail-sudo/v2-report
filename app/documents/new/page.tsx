'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import DocumentForm from '@/components/editor/DocumentForm';
import A4Preview from '@/components/preview/A4Preview';
import { DocumentRecord, DocumentTemplate, OrganizationSettings, Client } from '@/lib/types';
import { initialOrganization, initialTemplates } from '@/data/initial-data';
import { Loader2 } from 'lucide-react';

function NewDocumentContent() {
  const searchParams = useSearchParams();
  const docType = (searchParams.get('type') as 'invoice' | 'bill') || 'invoice';
  const clientIdParam = searchParams.get('clientId');

  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState<DocumentTemplate | null>(null);
  const [organization, setOrganization] = useState<OrganizationSettings>(initialOrganization);
  const [clients, setClients] = useState<Client[]>([]);
  const [document, setDocument] = useState<DocumentRecord | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [orgRes, clientsRes, tmplRes, docsRes] = await Promise.all([
          fetch('/api/organization').then((r) => r.json()),
          fetch('/api/clients').then((r) => r.json()),
          fetch(`/api/templates?id=${docType === 'invoice' ? 'v2-invoice' : 'v2-bill'}`).then((r) => r.json()),
          fetch(`/api/documents?type=${docType}`).then((r) => r.json()),
        ]);

        const org = orgRes.organization || initialOrganization;
        const cls = clientsRes.clients || [];
        const tmpl = tmplRes.template || initialTemplates.find((t) => t.type === docType);

        setOrganization(org);
        setClients(cls);
        setTemplate(tmpl);

        // Compute next sequence number
        const currentYear = new Date().getFullYear();
        const prefix = docType === 'invoice' ? `V2LG-INV-${currentYear}-` : `V2LG-BILL-${currentYear}-`;
        const existingDocs = docsRes.documents || [];
        let maxSeq = 0;
        for (const d of existingDocs) {
          if (d.documentNumber?.startsWith(prefix)) {
            const parts = d.documentNumber.split('-');
            const seq = parseInt(parts[parts.length - 1], 10);
            if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
          }
        }
        const nextDocNo = `${prefix}${(maxSeq + 1).toString().padStart(3, '0')}`;
        const todayStr = new Date().toISOString().split('T')[0];

        // Select client if clientId param was provided, otherwise fallback to first
        const selectedClient = (clientIdParam ? cls.find((c: Client) => c.id === clientIdParam) : null) || cls[0];

        // Default initial document
        const initialDoc: DocumentRecord = {
          id: `temp-${Date.now()}`,
          documentType: docType,
          templateId: tmpl.id,
          documentNumber: nextDocNo,
          documentDate: todayStr,
          dueDate: '',
          billingPeriod: docType === 'bill' ? {
            startDate: todayStr,
            endDate: todayStr,
            displayText: '',
          } : undefined,
          purpose: docType === 'invoice' ? 'Professional Services' : undefined,
          currency: 'INR',
          clientId: selectedClient?.id || '',
          clientData: {
            name: selectedClient?.name || '',
            companyName: selectedClient?.companyName || '',
            email: selectedClient?.email || '',
            phone: selectedClient?.phone || '',
          },
          items: [
            {
              id: `item-${Date.now()}-1`,
              srNo: 1,
              name: docType === 'invoice' ? 'Web Application Development' : 'Monthly Support & Management',
              description: docType === 'invoice' ? 'Design and end-to-end development' : undefined,
              duration: docType === 'bill' ? '1 Month' : undefined,
              amount: 5000,
            },
          ],
          projectCategories: docType === 'invoice' ? ['Web Development'] : undefined,
          payment: {
            totalAmount: 5000,
            amountPaid: 5000,
            balanceAmount: 0,
            currency: 'INR',
            status: 'PAID',
          },
          declarationText: org.declarationPresets?.paid || 'This invoice is issued for the project mentioned above. Payment has been received in full.',
          preparedBy: {
            name: org.teamMembers[0]?.name || 'Vandan Darji',
            organization: org.name,
            email: org.teamMembers[0]?.email || org.email,
            contact: org.teamMembers[0]?.contact || org.phone,
            location: org.teamMembers[0]?.location || org.location,
          },
          notes: docType === 'bill' ? 'This bill is for professional services provided for the specified period.' : '',
          showSignature: true,
          showStamp: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setDocument(initialDoc);
      } catch (err) {
        console.error('Failed to initialize document data', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [docType]);

  const [mobileTab, setMobileTab] = useState<'form' | 'preview'>('form');

  if (loading || !document || !template) {
    return (
      <div className="h-[calc(100vh-4rem)] flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="text-sm font-semibold">Loading V2 Labs Master Template...</span>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] p-2 sm:p-4 flex flex-col overflow-hidden">
      {/* Mobile Tab Switcher (Visible only on mobile/tablet < lg) */}
      <div className="lg:hidden flex items-center justify-center mb-2 bg-white p-1 rounded-xl border border-slate-200 shrink-0 shadow-xs">
        <button
          onClick={() => setMobileTab('form')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            mobileTab === 'form'
              ? 'bg-[#3944BC] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>📝 Edit Form</span>
        </button>
        <button
          onClick={() => setMobileTab('preview')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            mobileTab === 'preview'
              ? 'bg-[#3944BC] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>👁️ Live A4 Preview</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden">
        {/* LEFT: FORM (50% on PC, conditionally visible on mobile) */}
        <div
          className={`w-full lg:w-1/2 h-full overflow-hidden ${
            mobileTab === 'form' ? 'block' : 'hidden lg:block'
          }`}
        >
          <DocumentForm
            initialDocument={document}
            template={template}
            organization={organization}
            clients={clients}
            onDocumentChange={(updated) => setDocument(updated)}
          />
        </div>

        {/* RIGHT: LIVE A4 PREVIEW (50% on PC, conditionally visible on mobile) */}
        <div
          className={`w-full lg:w-1/2 h-full overflow-hidden ${
            mobileTab === 'preview' ? 'block' : 'hidden lg:block'
          }`}
        >
          <A4Preview
            document={document}
            template={template}
            organization={organization}
          />
        </div>
      </div>
    </div>
  );
}

export default function NewDocumentPage() {
  return (
    <AppShell>
      <Suspense fallback={
        <div className="h-[calc(100vh-4rem)] flex items-center justify-center text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }>
        <NewDocumentContent />
      </Suspense>
    </AppShell>
  );
}
