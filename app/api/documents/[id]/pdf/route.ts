import { NextRequest, NextResponse } from 'next/server';
import { getDocument, getTemplate, getOrganization, addActivityLog } from '@/lib/db';
import { generateDocumentPdf } from '@/lib/pdf-generator';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const doc = getDocument(params.id);
    if (!doc) {
      return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });
    }

    const template = getTemplate(doc.templateId);
    if (!template) {
      return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 });
    }

    const org = getOrganization();
    const pdfBytes = await generateDocumentPdf({
      document: doc,
      template,
      organization: org,
    });

    const { searchParams } = new URL(req.url);
    const download = searchParams.get('download') === 'true';
    const disposition = download ? 'attachment' : 'inline';

    addActivityLog({
      documentId: doc.id,
      action: 'PDF_GENERATED',
      description: `Generated PDF for ${doc.documentNumber}`,
      user: 'User',
    });

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${disposition}; filename="${doc.documentNumber}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
