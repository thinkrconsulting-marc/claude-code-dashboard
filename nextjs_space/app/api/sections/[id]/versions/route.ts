export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });

    const versions = await prisma.sectionVersion.findMany({
      where: { sectionId: params.id },
      orderBy: { versionNumber: 'desc' },
    });

    return NextResponse.json({ versions });
  } catch (error: any) {
    return NextResponse.json({ error: 'Fout bij ophalen versies' }, { status: 500 });
  }
}
