import { NextResponse } from 'next/server';
import { getActivityLogs } from '@/lib/db';

export async function GET() {
  try {
    const logs = getActivityLogs();
    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
