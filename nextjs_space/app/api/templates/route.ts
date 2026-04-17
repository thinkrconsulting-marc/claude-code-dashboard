export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const templates = await prisma.template.findMany({ orderBy: { name: 'asc' } });
    return NextResponse.json({ templates: templates ?? [] });
  } catch (error: any) {
    console.error('Templates error:', error);
    return NextResponse.json({ templates: [] });
  }
}
