import { NextRequest, NextResponse } from 'next/server';
import { duplicateDocument } from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const duplicated = duplicateDocument(params.id);
    if (!duplicated) {
      return NextResponse.json({ success: false, error: 'Document not found to duplicate' }, { status: 404 });
    }
    return NextResponse.json({ success: true, document: duplicated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
