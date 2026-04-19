export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const language = searchParams.get('language');
    const watched = searchParams.get('watched');
    const search = searchParams.get('search');
    const chapterId = searchParams.get('chapterId');
    const sortBy = searchParams.get('sort') || 'publishedAt';
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const where: any = {};
    if (category && category !== 'ALL') where.category = category;
    if (language && language !== 'ALL') where.language = language;
    if (watched === 'true') where.watched = true;
    if (watched === 'false') where.watched = false;
    if (chapterId) where.chapterId = chapterId;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } },
        { channelName: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search.toLowerCase()] } },
      ];
    }

    const orderBy: any = sortBy === 'views' ? { viewCount: 'desc' } 
      : sortBy === 'rating' ? { rating: 'desc' } 
      : { publishedAt: 'desc' };

    const videos = await prisma.youTubeVideo.findMany({
      where,
      orderBy,
      take: limit,
      include: {
        chapter: { select: { id: true, title: true, number: true } },
      },
    });

    // Get counts per category
    const categoryCounts = await prisma.youTubeVideo.groupBy({
      by: ['category'],
      _count: true,
    });

    const total = await prisma.youTubeVideo.count();
    const unwatched = await prisma.youTubeVideo.count({ where: { watched: false } });

    return NextResponse.json({ videos, total, unwatched, categoryCounts });
  } catch (error: any) {
    console.error('Videos GET error:', error);
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}

// Update video (watched, rating, notes, category)
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });

    const body = await request.json();
    const { id, watched, rating, notes, category, chapterId, tags } = body ?? {};

    if (!id) return NextResponse.json({ error: 'Video ID vereist' }, { status: 400 });

    const data: any = {};
    if (typeof watched === 'boolean') data.watched = watched;
    if (typeof rating === 'number') data.rating = Math.min(5, Math.max(0, rating));
    if (typeof notes === 'string') data.notes = notes;
    if (category) data.category = category;
    if (chapterId !== undefined) data.chapterId = chapterId || null;
    if (Array.isArray(tags)) data.tags = tags;

    const video = await prisma.youTubeVideo.update({ where: { id }, data });
    return NextResponse.json({ video });
  } catch (error: any) {
    console.error('Videos PATCH error:', error);
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
