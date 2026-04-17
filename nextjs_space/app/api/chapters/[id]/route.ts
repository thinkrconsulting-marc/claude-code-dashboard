export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const chapter = await prisma.chapter.findUnique({
      where: { id: params?.id ?? '' },
      include: {
        sections: {
          orderBy: { orderIndex: 'asc' },
          include: {
            blocks: { orderBy: { orderIndex: 'asc' } },
          },
        },
        guide: { select: { title: true } },
      },
    });
    if (!chapter) return NextResponse.json({ error: 'Hoofdstuk niet gevonden' }, { status: 404 });
    return NextResponse.json({ chapter });
  } catch (error: any) {
    console.error('Chapter detail error:', error);
    return NextResponse.json({ error: 'Fout bij ophalen' }, { status: 500 });
  }
}
