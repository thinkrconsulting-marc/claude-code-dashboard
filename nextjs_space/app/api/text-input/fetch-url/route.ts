export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

const LLM_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
const LLM_KEY = process.env.GEMINI_API_KEY || '';
const LLM_MODEL = 'gemini-2.5-flash';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }

    const body = await request.json();
    const { url } = body ?? {};

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is vereist' }, { status: 400 });
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      return NextResponse.json({ error: 'Ongeldige URL' }, { status: 400 });
    }

    // Fetch the page content
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let html = '';
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ClaudeCodeKB/1.0)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) {
        return NextResponse.json({ error: `Pagina kon niet geladen worden (HTTP ${res.status})` }, { status: 400 });
      }
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await res.json();
        html = JSON.stringify(json, null, 2);
      } else {
        html = await res.text();
      }
    } catch (err: any) {
      clearTimeout(timeout);
      if (err?.name === 'AbortError') {
        return NextResponse.json({ error: 'Timeout: pagina reageerde niet binnen 15 seconden' }, { status: 408 });
      }
      return NextResponse.json({ error: `Kon pagina niet ophalen: ${err?.message}` }, { status: 400 });
    }

    if (!html || html.trim().length < 50) {
      return NextResponse.json({ error: 'Pagina bevat geen nuttige content' }, { status: 400 });
    }

    // Extract images from HTML
    const imageUrls: string[] = [];
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let imgMatch;
    while ((imgMatch = imgRegex.exec(html)) !== null) {
      let imgSrc = imgMatch[1];
      if (imgSrc.startsWith('//')) imgSrc = 'https:' + imgSrc;
      else if (imgSrc.startsWith('/')) imgSrc = parsedUrl.origin + imgSrc;
      if (imgSrc.startsWith('http') && !imgSrc.includes('data:') && !imgSrc.includes('svg+xml')) {
        imageUrls.push(imgSrc);
      }
    }

    // Use LLM to extract clean text from HTML
    const llmRes = await fetch(LLM_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${LLM_KEY}` },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: [{
          role: 'user',
          content: `Je bent een content extractor. Extraheer de hoofdcontent uit deze HTML pagina en converteer het naar nette, gestructureerde Markdown.

Regels:
- Behoud alle tekst, titels, lijsten, code blokken en tabellen
- Verwijder navigatie, footer, advertenties, cookies-meldingen, sidebars
- Behoud de originele structuur met markdown headers (##, ###)
- Code blokken in \`\`\`lang formaat
- Tabellen in markdown tabel formaat
- Geef ALLEEN de geëxtraheerde content terug, geen uitleg
- Als er afbeeldingen zijn met relevante alt-text, noteer ze als: ![alt-text](url)
- Behoud links die relevant zijn voor de content

URL: ${url}

HTML CONTENT (eerste 15000 tekens):
${html.substring(0, 15000)}`
        }],
        max_tokens: 6000,
      }),
    });

    if (!llmRes.ok) {
      return NextResponse.json({ error: 'LLM kon de pagina niet verwerken' }, { status: 500 });
    }

    const llmData = await llmRes.json();
    const extractedContent = llmData?.choices?.[0]?.message?.content ?? '';

    if (!extractedContent || extractedContent.trim().length < 20) {
      return NextResponse.json({ error: 'Geen bruikbare content gevonden op deze pagina' }, { status: 400 });
    }

    // Extract title from content (first heading) or URL
    let extractedTitle = '';
    const titleMatch = extractedContent.match(/^#\s+(.+)/m);
    if (titleMatch) {
      extractedTitle = titleMatch[1].trim();
    } else {
      // Try from HTML title tag
      const htmlTitleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (htmlTitleMatch) extractedTitle = htmlTitleMatch[1].trim();
    }

    return NextResponse.json({
      success: true,
      content: extractedContent,
      title: extractedTitle,
      sourceUrl: url,
      imageUrls: imageUrls.slice(0, 20), // Max 20 images
      contentLength: extractedContent.length,
    });
  } catch (error: any) {
    console.error('Fetch URL error:', error);
    return NextResponse.json({ error: error?.message || 'Fout bij ophalen URL' }, { status: 500 });
  }
}
