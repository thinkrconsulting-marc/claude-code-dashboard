export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });

    const repo = await prisma.gitHubRepo.findUnique({
      where: { id: params?.id },
      include: { addedBy: { select: { name: true, email: true } } },
    });
    if (!repo) return NextResponse.json({ error: 'Repo niet gevonden' }, { status: 404 });
    return NextResponse.json({ repo });
  } catch (error: any) {
    console.error('Repo fetch error:', error);
    return NextResponse.json({ error: 'Fout bij ophalen repo' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }
    await prisma.gitHubRepo.delete({ where: { id: params?.id } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Delete repo error:', error);
    return NextResponse.json({ error: 'Fout bij verwijderen repo' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }
    const body = await request.json();
    const { name, description, contextNote, category, installCommand } = body ?? {};
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (contextNote !== undefined) data.contextNote = contextNote;
    if (category !== undefined) data.category = category;
    if (installCommand !== undefined) data.installCommand = installCommand;

    const repo = await prisma.gitHubRepo.update({ where: { id: params?.id }, data });
    return NextResponse.json({ repo });
  } catch (error: any) {
    console.error('Update repo error:', error);
    return NextResponse.json({ error: 'Fout bij bijwerken repo' }, { status: 500 });
  }
}
