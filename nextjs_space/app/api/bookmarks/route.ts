export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ bookmarks: [] }, { status: 401 });
    const userId = (session.user as any)?.id;
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      include: {
        section: {
          include: { chapter: { select: { title: true, number: true, id: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ bookmarks: bookmarks ?? [] });
  } catch (error: any) {
    console.error('Bookmarks error:', error);
    return NextResponse.json({ bookmarks: [] });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    const userId = (session.user as any)?.id;
    const { sectionId } = await request.json();
    if (!sectionId) return NextResponse.json({ error: 'Sectie ID verplicht' }, { status: 400 });

    const existing = await prisma.bookmark.findUnique({
      where: { userId_sectionId: { userId, sectionId } },
    });
    if (existing) {
      await prisma.bookmark.delete({ where: { id: existing.id } });
      return NextResponse.json({ bookmarked: false });
    }
    await prisma.bookmark.create({ data: { userId, sectionId } });
    return NextResponse.json({ bookmarked: true });
  } catch (error: any) {
    console.error('Bookmark toggle error:', error);
    return NextResponse.json({ error: 'Fout bij bladwijzer' }, { status: 500 });
  }
}
