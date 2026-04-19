export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { resolveChannelHandle, searchChannelVideos, getVideoDetails, searchGlobalVideos } from '@/lib/youtube';

const LLM_URL = process.env.GEMINI_API_KEY
  ? 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
  : 'https://apps.abacus.ai/v1/chat/completions';
const LLM_KEY = process.env.GEMINI_API_KEY || process.env.ABACUSAI_API_KEY || '';
const LLM_MODEL = process.env.GEMINI_API_KEY ? 'gemini-2.5-flash' : 'gemini-2.5-flash';

const MONITORED_CHANNELS = [
  '@Greymatter-ai', '@nateherk', '@austin.marchese', '@FuturMinds',
  '@SaminYasar_', '@BartBoonstra_slimwerken', '@AIProductivityCoach',
  '@BrockMesarich', '@velvetshark-com', '@CodeUCraftAI', '@DaviddTech',
  '@parkerprompts', '@RoboNuggets', '@Profit-Studio-official', '@zinhoautomates',
];

async function batchCategorize(videos: { title: string; description: string; videoId: string }[], chapters: { id: string; title: string; number: number }[]): Promise<Map<string, any>> {
  const result = new Map();
  const chapterList = chapters.map(c => `${c.id}: Hoofdstuk ${c.number} - ${c.title}`).join('\n');

  // Process in batches of 10
  for (let i = 0; i < videos.length; i += 10) {
    const batch = videos.slice(i, i + 10);
    const videoList = batch.map((v, idx) => `${idx + 1}. [${v.videoId}] "${v.title}" - ${(v.description || '').substring(0, 200)}`).join('\n');

    try {
      const res = await fetch(LLM_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${LLM_KEY}` },
        body: JSON.stringify({
          model: LLM_MODEL,
          messages: [{
            role: 'user',
            content: `Categoriseer deze YouTube video's over Claude Code.

Categorie\u00ebn: INSTALLATIE, SKILLS, MCP, WORKFLOWS, TIPS, FINANCE, PROMPTING, PROJECTEN, BEGINNERS, GEAVANCEERD, NIEUWS, OVERIG

Hoofdstukken:\n${chapterList}

Video's:\n${videoList}

Geef je antwoord als JSON object met videoId als key:
{
  "VIDEO_ID": {
    "category": "CATEGORIE",
    "tags": ["tag1", "tag2"],
    "summary": "Korte NL samenvatting (1-2 zinnen)",
    "language": "NL of EN",
    "chapterId": "chapter id of null"
  }
}
Respond with raw JSON only.`
          }],
          max_tokens: 3000,
          response_format: { type: 'json_object' },
        }),
      });
      if (!res.ok) { console.error('Batch categorize error:', res.status); continue; }
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content ?? '{}';
      const parsed = JSON.parse(text);
      for (const [vid, info] of Object.entries(parsed)) {
        result.set(vid, info);
      }
    } catch (e) {
      console.error('Batch categorize error:', e);
    }
  }
  return result;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }
    const userId = (session?.user as any)?.id;

    const body = await request.json().catch(() => ({}));
    const onlyNew = body?.onlyNew === true;
    const publishedAfter = onlyNew ? new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString() : undefined;

    const chapters = await prisma.chapter.findMany({
      select: { id: true, title: true, number: true },
      orderBy: { number: 'asc' },
    });

    let totalAdded = 0;
    let totalSkipped = 0;
    const channelsProcessed: string[] = [];
    const errors: string[] = [];

    // Step 1: Resolve and save channels
    for (const handle of MONITORED_CHANNELS) {
      try {
        const existingCh = await prisma.youTubeChannel.findUnique({ where: { handle: handle.replace(/^@/, '') } });
        if (existingCh?.channelId) {
          channelsProcessed.push(`${handle} (${existingCh.name})`);

          // Search for videos
          const { items } = await searchChannelVideos(existingCh.channelId, 15);
          if (items.length === 0) continue;

          // Filter out existing
          const existingIds = new Set(
            (await prisma.youTubeVideo.findMany({
              where: { videoId: { in: items.map(i => i.videoId) } },
              select: { videoId: true },
            })).map(v => v.videoId)
          );
          const newItems = items.filter(i => !existingIds.has(i.videoId));
          if (newItems.length === 0) { totalSkipped += items.length; continue; }

          // Get video details
          const details = await getVideoDetails(newItems.map(i => i.videoId));

          // Batch categorize
          const categories = await batchCategorize(
            newItems.map(i => ({ title: i.title, description: i.description, videoId: i.videoId })),
            chapters
          );

          // Save videos
          for (const item of newItems) {
            const detail = details.get(item.videoId);
            const cat = categories.get(item.videoId) || { category: 'OVERIG', tags: [], summary: '', language: 'EN', chapterId: null };
            try {
              await prisma.youTubeVideo.upsert({
                where: { videoId: item.videoId },
                update: {},
                create: {
                  videoId: item.videoId,
                  title: item.title,
                  url: `https://www.youtube.com/watch?v=${item.videoId}`,
                  channelName: item.channelTitle,
                  channelHandle: handle.replace(/^@/, ''),
                  description: item.description,
                  summary: cat.summary || '',
                  thumbnailUrl: item.thumbnailUrl,
                  publishedAt: item.publishedAt ? new Date(item.publishedAt) : null,
                  duration: detail?.duration || null,
                  viewCount: detail?.viewCount || null,
                  language: (cat.language === 'NL' ? 'NL' : 'EN') as any,
                  category: (['INSTALLATIE', 'SKILLS', 'MCP', 'WORKFLOWS', 'TIPS', 'FINANCE', 'PROMPTING', 'PROJECTEN', 'BEGINNERS', 'GEAVANCEERD', 'NIEUWS'].includes(cat.category) ? cat.category : 'OVERIG') as any,
                  tags: cat.tags || [],
                  chapterId: cat.chapterId || null,
                  addedById: userId,
                },
              });
              totalAdded++;
            } catch (e: any) {
              console.error(`Error saving video ${item.videoId}:`, e?.message);
            }
          }
          totalSkipped += existingIds.size;
          continue;
        }

        // Resolve channel
        const info = await resolveChannelHandle(handle);
        if (!info) {
          errors.push(`Kanaal niet gevonden: ${handle}`);
          continue;
        }

        // Save channel
        await prisma.youTubeChannel.upsert({
          where: { handle: handle.replace(/^@/, '') },
          update: { channelId: info.channelId, name: info.title, subscriberCount: info.subscriberCount, videoCount: info.videoCount, thumbnailUrl: info.thumbnailUrl, lastChecked: new Date() },
          create: { handle: handle.replace(/^@/, ''), name: info.title, channelId: info.channelId, description: info.description, subscriberCount: info.subscriberCount, videoCount: info.videoCount, thumbnailUrl: info.thumbnailUrl, lastChecked: new Date() },
        });
        channelsProcessed.push(`${handle} (${info.title})`);

        // Search channel videos
        const { items } = await searchChannelVideos(info.channelId, 15);
        if (items.length === 0) continue;

        // Filter out existing
        const existingIds = new Set(
          (await prisma.youTubeVideo.findMany({
            where: { videoId: { in: items.map(i => i.videoId) } },
            select: { videoId: true },
          })).map(v => v.videoId)
        );
        const newItems = items.filter(i => !existingIds.has(i.videoId));
        if (newItems.length === 0) { totalSkipped += items.length; continue; }

        // Get details
        const details = await getVideoDetails(newItems.map(i => i.videoId));

        // Batch categorize
        const categories = await batchCategorize(
          newItems.map(i => ({ title: i.title, description: i.description, videoId: i.videoId })),
          chapters
        );

        // Save
        for (const item of newItems) {
          const detail = details.get(item.videoId);
          const cat = categories.get(item.videoId) || { category: 'OVERIG', tags: [], summary: '', language: 'EN', chapterId: null };
          try {
            await prisma.youTubeVideo.upsert({
              where: { videoId: item.videoId },
              update: {},
              create: {
                videoId: item.videoId,
                title: item.title,
                url: `https://www.youtube.com/watch?v=${item.videoId}`,
                channelName: item.channelTitle,
                channelHandle: handle.replace(/^@/, ''),
                description: item.description,
                summary: cat.summary || '',
                thumbnailUrl: item.thumbnailUrl,
                publishedAt: item.publishedAt ? new Date(item.publishedAt) : null,
                duration: detail?.duration || null,
                viewCount: detail?.viewCount || null,
                language: (cat.language === 'NL' ? 'NL' : 'EN') as any,
                category: (['INSTALLATIE', 'SKILLS', 'MCP', 'WORKFLOWS', 'TIPS', 'FINANCE', 'PROMPTING', 'PROJECTEN', 'BEGINNERS', 'GEAVANCEERD', 'NIEUWS'].includes(cat.category) ? cat.category : 'OVERIG') as any,
                tags: cat.tags || [],
                chapterId: cat.chapterId || null,
                addedById: userId,
              },
            });
            totalAdded++;
          } catch (e: any) {
            console.error(`Error saving video ${item.videoId}:`, e?.message);
          }
        }
        totalSkipped += existingIds.size;
      } catch (e: any) {
        errors.push(`${handle}: ${e?.message}`);
      }
    }

    // Step 2: Global search
    try {
      const globalVideos = await searchGlobalVideos('claude code tutorial', 20, publishedAfter);
      const globalVideos2 = await searchGlobalVideos('claude code ai', 10, publishedAfter);
      const allGlobal = [...globalVideos, ...globalVideos2];
      const seenGlobal = new Set<string>();
      const uniqueGlobal = allGlobal.filter(v => { if (seenGlobal.has(v.videoId)) return false; seenGlobal.add(v.videoId); return true; });

      if (uniqueGlobal.length > 0) {
        const existingGlobalIds = new Set(
          (await prisma.youTubeVideo.findMany({
            where: { videoId: { in: uniqueGlobal.map(i => i.videoId) } },
            select: { videoId: true },
          })).map(v => v.videoId)
        );
        const newGlobal = uniqueGlobal.filter(i => !existingGlobalIds.has(i.videoId));

        if (newGlobal.length > 0) {
          const details = await getVideoDetails(newGlobal.map(i => i.videoId));
          const categories = await batchCategorize(
            newGlobal.map(i => ({ title: i.title, description: i.description, videoId: i.videoId })),
            chapters
          );

          for (const item of newGlobal) {
            const detail = details.get(item.videoId);
            const cat = categories.get(item.videoId) || { category: 'OVERIG', tags: [], summary: '', language: 'EN', chapterId: null };
            try {
              await prisma.youTubeVideo.upsert({
                where: { videoId: item.videoId },
                update: {},
                create: {
                  videoId: item.videoId,
                  title: item.title,
                  url: `https://www.youtube.com/watch?v=${item.videoId}`,
                  channelName: item.channelTitle,
                  description: item.description,
                  summary: cat.summary || '',
                  thumbnailUrl: item.thumbnailUrl,
                  publishedAt: item.publishedAt ? new Date(item.publishedAt) : null,
                  duration: detail?.duration || null,
                  viewCount: detail?.viewCount || null,
                  language: (cat.language === 'NL' ? 'NL' : 'EN') as any,
                  category: (['INSTALLATIE', 'SKILLS', 'MCP', 'WORKFLOWS', 'TIPS', 'FINANCE', 'PROMPTING', 'PROJECTEN', 'BEGINNERS', 'GEAVANCEERD', 'NIEUWS'].includes(cat.category) ? cat.category : 'OVERIG') as any,
                  tags: cat.tags || [],
                  chapterId: cat.chapterId || null,
                  addedById: userId,
                },
              });
              totalAdded++;
            } catch {}
          }
        }
        totalSkipped += existingGlobalIds.size;
      }
    } catch (e: any) {
      errors.push(`Global search: ${e?.message}`);
    }

    const totalInDb = await prisma.youTubeVideo.count();
    const totalChannels = await prisma.youTubeChannel.count();

    return NextResponse.json({
      success: true,
      stats: { totalAdded, totalSkipped, totalInDb, totalChannels },
      channelsProcessed,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
