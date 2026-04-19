export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { getVideoById } from '@/lib/youtube';

const LLM_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
const LLM_KEY = process.env.GEMINI_API_KEY || '';
const LLM_MODEL = 'gemini-2.5-flash';

async function categorizeVideo(title: string, description: string, chapters: { id: string; title: string; number: number }[]): Promise<{
  category: string;
  tags: string[];
  summary: string;
  language: string;
  chapterId: string | null;
}> {
  const chapterList = chapters.map(c => `${c.id}: Hoofdstuk ${c.number} - ${c.title}`).join('\n');
  try {
    const res = await fetch(LLM_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${LLM_KEY}` },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: [{
          role: 'user',
          content: `Analyseer deze YouTube video over Claude Code en categoriseer deze.

Titel: ${title}
Beschrijving: ${(description || '').substring(0, 1500)}

Beschikbare categorie\u00ebn:
INSTALLATIE, SKILLS, MCP, WORKFLOWS, TIPS, FINANCE, PROMPTING, PROJECTEN, BEGINNERS, GEAVANCEERD, NIEUWS, OVERIG

Beschikbare hoofdstukken in de kennisbank:
${chapterList}

Geef je antwoord in JSON formaat:
{
  "category": "CATEGORIE",
  "tags": ["tag1", "tag2", "tag3"],
  "summary": "Korte samenvatting in het Nederlands (max 2 zinnen)",
  "language": "NL of EN (taal van de video, bepaal op basis van titel/beschrijving)",
  "chapterId": "id van het best passende hoofdstuk of null"
}

Respond with raw JSON only.`
        }],
        max_tokens: 500,
        response_format: { type: 'json_object' },
      }),
    });
    if (!res.ok) throw new Error(`LLM error: ${res.status}`);
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(text);
    return {
      category: parsed.category || 'OVERIG',
      tags: parsed.tags || [],
      summary: parsed.summary || '',
      language: parsed.language === 'NL' ? 'NL' : 'EN',
      chapterId: parsed.chapterId || null,
    };
  } catch (e) {
    console.error('Categorize error:', e);
    return { category: 'OVERIG', tags: [], summary: '', language: 'EN', chapterId: null };
  }
}

// Add a single video by URL
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }
    const userId = (session?.user as any)?.id;
    const body = await request.json();
    const { url } = body ?? {};

    if (!url) return NextResponse.json({ error: 'URL is vereist' }, { status: 400 });

    // Extract video ID from URL
    let videoId = '';
    try {
      const u = new URL(url);
      if (u.hostname.includes('youtu.be')) {
        videoId = u.pathname.slice(1).split('/')[0];
      } else {
        videoId = u.searchParams.get('v') || '';
      }
    } catch {
      return NextResponse.json({ error: 'Ongeldige URL' }, { status: 400 });
    }

    if (!videoId) return NextResponse.json({ error: 'Kon video ID niet extraheren uit URL' }, { status: 400 });

    // Check if already exists
    const existing = await prisma.youTubeVideo.findUnique({ where: { videoId } });
    if (existing) return NextResponse.json({ error: 'Video bestaat al in de bibliotheek', video: existing }, { status: 409 });

    // Fetch from YouTube
    const ytVideo = await getVideoById(videoId);
    if (!ytVideo) return NextResponse.json({ error: 'Video niet gevonden op YouTube' }, { status: 404 });

    // Get chapters for AI categorization
    const chapters = await prisma.chapter.findMany({
      select: { id: true, title: true, number: true },
      orderBy: { number: 'asc' },
    });

    // AI categorize
    const cat = await categorizeVideo(ytVideo.title, ytVideo.description, chapters);

    // Resolve channel handle
    let channelHandle: string | null = null;
    const channelDb = await prisma.youTubeChannel.findFirst({
      where: { channelId: ytVideo.channelId },
    });
    if (channelDb) channelHandle = channelDb.handle;

    const video = await prisma.youTubeVideo.create({
      data: {
        videoId: ytVideo.videoId,
        title: ytVideo.title,
        url: `https://www.youtube.com/watch?v=${ytVideo.videoId}`,
        channelName: ytVideo.channelTitle,
        channelHandle,
        description: ytVideo.description,
        summary: cat.summary,
        thumbnailUrl: ytVideo.thumbnailUrl,
        publishedAt: ytVideo.publishedAt ? new Date(ytVideo.publishedAt) : null,
        duration: ytVideo.duration || null,
        viewCount: ytVideo.viewCount || null,
        language: cat.language as any,
        category: cat.category as any,
        tags: cat.tags,
        chapterId: cat.chapterId,
        addedById: userId,
      },
    });

    return NextResponse.json({ video, categorization: cat });
  } catch (error: any) {
    console.error('Add video error:', error);
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
