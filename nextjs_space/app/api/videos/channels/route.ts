export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { resolveChannelHandle } from '@/lib/youtube';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });

    const channels = await prisma.youTubeChannel.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ channels });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}

// Add a new channel to monitor
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }

    const body = await request.json();
    const { handle } = body ?? {};
    if (!handle) return NextResponse.json({ error: 'Handle vereist' }, { status: 400 });

    const cleanHandle = handle.replace(/^@/, '');
    const existing = await prisma.youTubeChannel.findUnique({ where: { handle: cleanHandle } });
    if (existing) return NextResponse.json({ error: 'Kanaal bestaat al', channel: existing }, { status: 409 });

    const info = await resolveChannelHandle(cleanHandle);
    if (!info) return NextResponse.json({ error: 'Kanaal niet gevonden op YouTube' }, { status: 404 });

    const channel = await prisma.youTubeChannel.create({
      data: {
        handle: cleanHandle,
        name: info.title,
        channelId: info.channelId,
        description: info.description,
        subscriberCount: info.subscriberCount,
        videoCount: info.videoCount,
        thumbnailUrl: info.thumbnailUrl,
      },
    });

    return NextResponse.json({ channel });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
