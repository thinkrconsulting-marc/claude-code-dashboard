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
    const search = searchParams.get('search');
    const securityStatus = searchParams.get('securityStatus');

    const where: any = {};
    if (category && category !== 'ALL') where.category = category;
    if (securityStatus && securityStatus !== 'ALL') where.securityStatus = securityStatus;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { contextNote: { contains: search, mode: 'insensitive' } },
      ];
    }

    const repos = await prisma.gitHubRepo.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { addedBy: { select: { name: true, email: true } } },
    });
    return NextResponse.json({ repos: repos ?? [] });
  } catch (error: any) {
    console.error('Repos fetch error:', error);
    return NextResponse.json({ repos: [] });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }

    const body = await request.json();
    const { name, url, description, contextNote, category, installCommand, stars, license, language, readmeContent, sourceUploadId } = body ?? {};

    if (!url) return NextResponse.json({ error: 'URL is verplicht' }, { status: 400 });

    const normalizedUrl = String(url).trim().replace(/\/+$/, '');
    const existing = await prisma.gitHubRepo.findUnique({ where: { url: normalizedUrl } });
    if (existing) {
      // Update existing with new context
      const updated = await prisma.gitHubRepo.update({
        where: { url: normalizedUrl },
        data: {
          ...(contextNote ? { contextNote: `${existing.contextNote ?? ''}\n\n${contextNote}`.trim() } : {}),
          ...(description && !existing.description ? { description } : {}),
          ...(installCommand && !existing.installCommand ? { installCommand } : {}),
          ...(stars ? { stars } : {}),
        },
      });
      return NextResponse.json({ repo: updated, existed: true });
    }

    const repo = await prisma.gitHubRepo.create({
      data: {
        name: name ?? normalizedUrl.split('/').pop() ?? 'Unknown',
        url: normalizedUrl,
        description: description ?? null,
        contextNote: contextNote ?? null,
        category: category ?? 'OTHER',
        installCommand: installCommand ?? null,
        stars: stars ?? null,
        license: license ?? null,
        language: language ?? null,
        readmeContent: readmeContent ?? null,
        sourceUploadId: sourceUploadId ?? null,
        addedById: (session?.user as any)?.id,
      },
    });
    return NextResponse.json({ repo });
  } catch (error: any) {
    console.error('Create repo error:', error);
    return NextResponse.json({ error: 'Fout bij aanmaken repo' }, { status: 500 });
  }
}
