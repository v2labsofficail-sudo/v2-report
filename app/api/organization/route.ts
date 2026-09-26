import { NextRequest, NextResponse } from 'next/server';
import { getOrganization, updateOrganization } from '@/lib/db';

export async function GET() {
  try {
    const org = getOrganization();
    return NextResponse.json({ success: true, organization: org });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = updateOrganization(body);
    return NextResponse.json({ success: true, organization: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
