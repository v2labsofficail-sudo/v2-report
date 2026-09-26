import { NextRequest, NextResponse } from 'next/server';
import { deleteClient } from '@/lib/db';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const success = deleteClient(params.id);
    if (!success) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Client deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
