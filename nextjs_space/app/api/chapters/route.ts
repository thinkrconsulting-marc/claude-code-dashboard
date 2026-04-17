export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const chapters = await prisma.chapter.findMany({
      orderBy: { number: 'asc' },
      select: { id: true, title: true, number: true, guideId: true },
    });
    return NextResponse.json({ chapters: chapters ?? [] });
  } catch (error: any) {
    console.error('Chapters fetch error:', error);
    return NextResponse.json({ chapters: [] });
  }
}
