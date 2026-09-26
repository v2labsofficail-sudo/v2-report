import { NextRequest, NextResponse } from 'next/server';
import { getDocument, getTemplate, getOrganization, addActivityLog } from '@/lib/db';
import { generateDocumentPdf } from '@/lib/pdf-generator';
import { DocumentRecord } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const doc = getDocument(params.id);
    if (!doc) {
      return NextResponse.json(
        { success: false, error: 'DOCUMENT_NOT_FOUND', message: `Document ${params.id} was not found` },
        { status: 404 }
      );
    }

    const templateId = doc.templateId || (doc.documentType === 'bill' ? 'v2-bill' : 'v2-invoice');
    const template = getTemplate(templateId);
    if (!template) {
      return NextResponse.json(
        { success: false, error: 'TEMPLATE_NOT_FOUND', message: `Template ${templateId} was not found` },
        { status: 404 }
      );
    }

    const org = getOrganization();
    const pdfBytes = await generateDocumentPdf({
      document: doc,
      template,
      organization: org,
    });

    const { searchParams } = new URL(req.url);
    const download = searchParams.get('download') !== 'false';
    const disposition = download ? 'attachment' : 'inline';

    try {
      addActivityLog({
        documentId: doc.id,
        action: 'PDF_GENERATED',
        description: `Generated PDF for ${doc.documentNumber}`,
        user: 'User',
      });
    } catch {
      // Non-blocking log
    }

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${disposition}; filename="${doc.documentNumber}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('PDF generation error (GET):', error);
    return NextResponse.json(
      { success: false, error: 'PDF_GENERATION_FAILED', message: error.message || 'Failed to render PDF' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    let doc: DocumentRecord | null = null;
    try {
      doc = await req.json();
    } catch {
      doc = null;
    }

    // If no body provided, fallback to looking up by ID
    if (!doc || !doc.documentNumber) {
      doc = getDocument(params.id) || null;
    }

    if (!doc) {
      return NextResponse.json(
        { success: false, error: 'INVALID_DOCUMENT_DATA', message: 'No valid document payload provided for PDF generation' },
        { status: 400 }
      );
    }

    const templateId = doc.templateId || (doc.documentType === 'bill' ? 'v2-bill' : 'v2-invoice');
    const template = getTemplate(templateId);
    if (!template) {
      return NextResponse.json(
        { success: false, error: 'TEMPLATE_NOT_FOUND', message: `Template ${templateId} was not found` },
        { status: 404 }
      );
    }

    const org = getOrganization();
    const pdfBytes = await generateDocumentPdf({
      document: doc,
      template,
      organization: org,
    });

    const { searchParams } = new URL(req.url);
    const download = searchParams.get('download') !== 'false';
    const disposition = download ? 'attachment' : 'inline';

    try {
      addActivityLog({
        documentId: doc.id,
        action: 'PDF_GENERATED',
        description: `Generated PDF for ${doc.documentNumber}`,
        user: 'User',
      });
    } catch {
      // Non-blocking log
    }

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${disposition}; filename="${doc.documentNumber || 'document'}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('PDF generation error (POST):', error);
    return NextResponse.json(
      { success: false, error: 'PDF_GENERATION_FAILED', message: error.message || 'Failed to render PDF' },
      { status: 500 }
    );
  }
}
