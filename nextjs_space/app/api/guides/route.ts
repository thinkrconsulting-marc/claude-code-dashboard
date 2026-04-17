export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const guides = await prisma.guide.findMany({
      orderBy: { createdAt: 'asc' },
      include: { _count: { select: { chapters: true } } },
    });
    return NextResponse.json({ guides: guides ?? [] });
  } catch (error: any) {
    console.error('Guides error:', error);
    return NextResponse.json({ guides: [] });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }
    const { title, description } = await request.json();
    const guide = await prisma.guide.create({ data: { title, description } });
    return NextResponse.json({ guide });
  } catch (error: any) {
    console.error('Create guide error:', error);
    return NextResponse.json({ error: 'Fout bij aanmaken gids' }, { status: 500 });
  }
}
