export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { generatePresignedUploadUrl, getFileUrl } from '@/lib/s3';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }

    const body = await request.json();
    const { fileName, contentType } = body ?? {};

    if (!fileName || !contentType) {
      return NextResponse.json({ error: 'fileName en contentType zijn vereist' }, { status: 400 });
    }

    if (!contentType.startsWith('image/')) {
      return NextResponse.json({ error: 'Alleen afbeeldingen toegestaan' }, { status: 400 });
    }

    // Use public uploads so images are accessible in the knowledge base
    const { uploadUrl, cloud_storage_path } = await generatePresignedUploadUrl(fileName, contentType, true);
    const publicUrl = await getFileUrl(cloud_storage_path, true);

    return NextResponse.json({ uploadUrl, cloud_storage_path, publicUrl });
  } catch (error: any) {
    console.error('Upload image error:', error);
    return NextResponse.json({ error: error?.message || 'Upload mislukt' }, { status: 500 });
  }
}
