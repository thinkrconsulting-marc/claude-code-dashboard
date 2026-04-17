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
    const userId = (session?.user as any)?.id;
    const { fileName, fileType, cloudStoragePath, isPublic } = await request.json();
    const upload = await prisma.upload.create({
      data: {
        fileName,
        fileType,
        cloudStoragePath: cloudStoragePath ?? null,
        isPublic: isPublic ?? false,
        status: 'PENDING',
        userId,
      },
    });
    return NextResponse.json({ upload });
  } catch (error: any) {
    console.error('Upload complete error:', error);
    return NextResponse.json({ error: 'Fout bij opslaan upload' }, { status: 500 });
  }
}
