'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import DocumentForm from '@/components/editor/DocumentForm';
import A4Preview from '@/components/preview/A4Preview';
import { DocumentRecord, DocumentTemplate, OrganizationSettings, Client } from '@/lib/types';
import { initialOrganization } from '@/data/initial-data';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function DocumentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [document, setDocument] = useState<DocumentRecord | null>(null);
  const [template, setTemplate] = useState<DocumentTemplate | null>(null);
  const [organization, setOrganization] = useState<OrganizationSettings>(initialOrganization);
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    async function loadDocument() {
      try {
        const [docRes, orgRes, clientsRes] = await Promise.all([
          fetch(`/api/documents/${id}`).then((r) => r.json()),
          fetch('/api/organization').then((r) => r.json()),
          fetch('/api/clients').then((r) => r.json()),
        ]);

        if (!docRes.success || !docRes.document) {
          alert('Document not found');
          router.push('/documents');
          return;
        }

        const currentDoc = docRes.document;
        setDocument(currentDoc);
        setOrganization(orgRes.organization || initialOrganization);
        setClients(clientsRes.clients || []);

        // Load template for this document
        const tmplRes = await fetch(`/api/templates?id=${currentDoc.templateId}`).then((r) => r.json());
        if (tmplRes.success && tmplRes.template) {
          setTemplate(tmplRes.template);
        }
      } catch (err) {
        console.error('Error loading document', err);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadDocument();
    }
  }, [id, router]);

  const [mobileTab, setMobileTab] = useState<'form' | 'preview'>('form');

  if (loading || !document || !template) {
    return (
      <AppShell>
        <div className="h-[calc(100vh-4rem)] flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="text-sm font-semibold">Loading Document {id}...</span>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="h-[calc(100vh-4rem)] p-2 sm:p-4 flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <div className="mb-2 flex items-center justify-between shrink-0">
          <Link
            href="/documents"
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Documents
          </Link>
          <div className="text-[11px] font-mono text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs">
            ID: {document.id}
          </div>
        </div>

        {/* Mobile Tab Switcher */}
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

        {/* Main Work Area */}
        <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden">
          {/* LEFT: FORM (50% on PC, conditionally visible on mobile) */}
          <div
            className={`w-full lg:w-1/2 h-full overflow-hidden flex flex-col ${
              mobileTab === 'form' ? 'block' : 'hidden lg:block'
            }`}
          >
            <div className="flex-1 overflow-hidden">
              <DocumentForm
                initialDocument={document}
                template={template}
                organization={organization}
                clients={clients}
                onDocumentChange={(updated) => setDocument(updated)}
              />
            </div>
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
    </AppShell>
  );
}
