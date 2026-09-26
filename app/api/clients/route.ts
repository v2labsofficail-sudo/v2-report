import { NextRequest, NextResponse } from 'next/server';
import { getClients, saveClient } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const clients = getClients();
    return NextResponse.json({ success: true, clients });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ success: false, error: 'Client name is required' }, { status: 400 });
    }
    const saved = saveClient(body);
    return NextResponse.json({ success: true, client: saved });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
