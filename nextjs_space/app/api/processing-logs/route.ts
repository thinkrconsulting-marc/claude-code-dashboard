export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }

    const logs = await prisma.processingLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { processedBy: { select: { name: true, email: true } } },
    });

    return NextResponse.json({ logs });
  } catch {
    return NextResponse.json({ error: 'Fout' }, { status: 500 });
  }
}
