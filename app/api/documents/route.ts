import { NextRequest, NextResponse } from 'next/server';
import { getDocuments, saveDocument, getNextDocumentNumber, getTemplate } from '@/lib/db';
import { DocumentRecord } from '@/lib/types';
import { calculatePaymentStatus } from '@/lib/template-engine';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const search = searchParams.get('search')?.toLowerCase();

    let docs = getDocuments();

    if (type) {
      docs = docs.filter((d) => d.documentType === type);
    }
    if (status) {
      docs = docs.filter((d) => d.payment.status === status);
    }
    if (search) {
      docs = docs.filter(
        (d) =>
          d.documentNumber.toLowerCase().includes(search) ||
          d.clientData.name.toLowerCase().includes(search) ||
          (d.purpose && d.purpose.toLowerCase().includes(search))
      );
    }

    return NextResponse.json({ success: true, documents: docs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const type = body.documentType || 'invoice';
    const templateId = body.templateId || (type === 'invoice' ? 'v2-invoice' : 'v2-bill');
    const template = getTemplate(templateId);

    if (!template) {
      return NextResponse.json({ success: false, error: 'Invalid template' }, { status: 400 });
    }

    // Auto-generate document number if not provided
    const docNumber = body.documentNumber || getNextDocumentNumber(type);

    // Calculate totals and payment status server-side (authoritative)
    const items = body.items || [];
    const totalAmount = items.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);
    const amountPaid = Number(body.payment?.amountPaid) || 0;
    const balanceAmount = Math.max(0, totalAmount - amountPaid);
    const paymentStatus = calculatePaymentStatus(totalAmount, amountPaid);

    const docToSave: Omit<DocumentRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string } = {
      id: body.id,
      documentType: type,
      templateId,
      documentNumber: docNumber,
      documentDate: body.documentDate || new Date().toISOString().split('T')[0],
      dueDate: body.dueDate || '',
      billingPeriod: body.billingPeriod,
      purpose: body.purpose || '',
      currency: body.currency || 'INR',
      clientId: body.clientId || '',
      clientData: body.clientData || { name: '', email: '', phone: '' },
      items,
      projectCategories: body.projectCategories || [],
      payment: {
        totalAmount,
        amountPaid,
        balanceAmount,
        currency: body.currency || 'INR',
        status: body.payment?.status || paymentStatus,
      },
      declarationText: body.declarationText,
      preparedBy: body.preparedBy,
      notes: body.notes || '',
      showSignature: body.showSignature !== false,
      showStamp: body.showStamp !== false,
    };

    const saved = saveDocument(docToSave);
    return NextResponse.json({ success: true, document: saved });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
