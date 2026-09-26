import { NextRequest, NextResponse } from 'next/server';
import { getTemplates, saveTemplate, getTemplate } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (id) {
      const template = getTemplate(id);
      if (!template) {
        return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, template });
    }
    const templates = getTemplates();
    return NextResponse.json({ success: true, templates });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id || !body.name) {
      return NextResponse.json({ success: false, error: 'Template ID and Name are required' }, { status: 400 });
    }
    const saved = saveTemplate(body);
    return NextResponse.json({ success: true, template: saved });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
