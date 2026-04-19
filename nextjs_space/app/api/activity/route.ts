export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// POST: log an activity + update session heartbeat
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ ok: false }, { status: 401 });
    const userId = (session.user as any)?.id;
    if (!userId) return NextResponse.json({ ok: false }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { action, page, details, sessionId } = body ?? {};

    // Log the activity
    if (action) {
      await prisma.activityLog.create({
        data: { userId, action, page: page || null, details: details || null },
      });
    }

    // Update or create session heartbeat
    const ua = request.headers.get('user-agent') || null;
    if (sessionId) {
      // Update existing session
      await prisma.userSession.updateMany({
        where: { id: sessionId, userId },
        data: { lastSeenAt: new Date(), pagesViewed: { increment: action === 'PAGE_VIEW' ? 1 : 0 } },
      });
    }

    // If action is SESSION_START, create new session
    if (action === 'SESSION_START') {
      const newSession = await prisma.userSession.create({
        data: { userId, userAgent: ua },
      });
      return NextResponse.json({ ok: true, sessionId: newSession.id });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Activity log error:', error?.message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

// GET: admin-only - fetch activity logs + online users
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'logs'; // logs | online | stats
    const limit = parseInt(searchParams.get('limit') || '200', 10);
    const userId = searchParams.get('userId');

    if (view === 'online') {
      // Users active in last 5 minutes
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
      const activeSessions = await prisma.userSession.findMany({
        where: { lastSeenAt: { gte: fiveMinAgo }, endedAt: null },
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
        orderBy: { lastSeenAt: 'desc' },
      });

      // Get most recent page view for each active user
      const onlineUsers = await Promise.all(
        activeSessions.map(async (s) => {
          const lastActivity = await prisma.activityLog.findFirst({
            where: { userId: s.userId },
            orderBy: { createdAt: 'desc' },
          });
          return {
            ...s,
            lastPage: lastActivity?.page || null,
            lastAction: lastActivity?.action || null,
            sessionDuration: Math.round((Date.now() - new Date(s.startedAt).getTime()) / 60000),
          };
        })
      );

      return NextResponse.json({ onlineUsers });
    }

    if (view === 'stats') {
      // Per-user stats
      const users = await prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      });

      const userStats = await Promise.all(
        users.map(async (u) => {
          const totalActions = await prisma.activityLog.count({ where: { userId: u.id } });
          const totalSessions = await prisma.userSession.count({ where: { userId: u.id } });
          const lastActivity = await prisma.activityLog.findFirst({
            where: { userId: u.id },
            orderBy: { createdAt: 'desc' },
          });
          const pageViews = await prisma.activityLog.count({ where: { userId: u.id, action: 'PAGE_VIEW' } });
          // Total time online (sum of session durations)
          const sessions = await prisma.userSession.findMany({
            where: { userId: u.id },
            select: { startedAt: true, lastSeenAt: true },
            orderBy: { startedAt: 'desc' },
            take: 50,
          });
          const totalMinutes = sessions.reduce((acc, s) => {
            return acc + Math.round((new Date(s.lastSeenAt).getTime() - new Date(s.startedAt).getTime()) / 60000);
          }, 0);

          return {
            ...u,
            totalActions,
            totalSessions,
            pageViews,
            totalMinutesOnline: totalMinutes,
            lastActivity: lastActivity?.createdAt || null,
            lastPage: lastActivity?.page || null,
          };
        })
      );

      return NextResponse.json({ userStats });
    }

    // Default: activity logs
    const where: any = {};
    if (userId) where.userId = userId;

    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return NextResponse.json({ logs });
  } catch (error: any) {
    console.error('Activity GET error:', error?.message);
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
