import { NextRequest, NextResponse } from 'next/server';
import { getDocument, saveDocument, deleteDocument } from '@/lib/db';
import { calculatePaymentStatus } from '@/lib/template-engine';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const doc = getDocument(params.id);
    if (!doc) {
      return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, document: doc });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const existing = getDocument(params.id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });
    }

    const items = body.items || existing.items;
    const totalAmount = items.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);
    const amountPaid = body.payment?.amountPaid !== undefined ? Number(body.payment.amountPaid) : existing.payment.amountPaid;
    const balanceAmount = Math.max(0, totalAmount - amountPaid);
    const calculatedStatus = calculatePaymentStatus(totalAmount, amountPaid);

    const updated = saveDocument({
      ...existing,
      ...body,
      id: params.id,
      items,
      payment: {
        totalAmount,
        amountPaid,
        balanceAmount,
        currency: body.currency || existing.currency || 'INR',
        status: body.payment?.status || calculatedStatus,
      },
    });

    return NextResponse.json({ success: true, document: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const success = deleteDocument(params.id);
    if (!success) {
      return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Document deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
