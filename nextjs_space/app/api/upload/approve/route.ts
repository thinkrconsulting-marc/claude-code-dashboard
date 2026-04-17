export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }
    const { uploadId, chapterId, sectionTitle, tags, action } = await request.json();

    if (action === 'reject') {
      await prisma.upload.update({ where: { id: uploadId }, data: { status: 'REJECTED' } });
      return NextResponse.json({ success: true });
    }

    const upload = await prisma.upload.findUnique({ where: { id: uploadId } });
    if (!upload) return NextResponse.json({ error: 'Upload niet gevonden' }, { status: 404 });

    // Create new section in the chapter
    const existingSections = await prisma.section.count({ where: { chapterId } });
    const section = await prisma.section.create({
      data: {
        title: sectionTitle ?? 'Nieuwe sectie',
        orderIndex: existingSections,
        chapterId,
        tags: tags ?? [],
      },
    });

    // Create a content block from the extracted content
    if (upload?.extractedContent) {
      await prisma.contentBlock.create({
        data: {
          type: 'TEXT',
          content: upload.extractedContent,
          orderIndex: 0,
          sectionId: section.id,
        },
      });
    }

    await prisma.upload.update({ where: { id: uploadId }, data: { status: 'APPROVED' } });
    return NextResponse.json({ success: true, section });
  } catch (error: any) {
    console.error('Approve error:', error);
    return NextResponse.json({ error: 'Fout bij goedkeuren' }, { status: 500 });
  }
}
