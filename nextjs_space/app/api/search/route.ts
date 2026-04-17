export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request?.url ?? 'http://localhost');
    const q = searchParams?.get?.('q') ?? '';
    if (!q || q?.length < 2) return NextResponse.json({ results: [] });

    const sections = await prisma.section.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { blocks: { some: { content: { contains: q, mode: 'insensitive' } } } },
        ],
      },
      include: {
        chapter: { select: { title: true, number: true, id: true } },
        blocks: { orderBy: { orderIndex: 'asc' }, take: 3 },
      },
      take: 20,
    });
    return NextResponse.json({ results: sections ?? [] });
  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json({ results: [] });
  }
}
