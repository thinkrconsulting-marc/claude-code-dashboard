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

    const body = await request.json();
    const { title, content } = body ?? {};
    if (!content || typeof content !== 'string' || content.trim().length < 10) {
      return NextResponse.json({ error: 'Tekst moet minimaal 10 tekens bevatten' }, { status: 400 });
    }

    const userId = (session?.user as any)?.id;

    // Create upload record
    const upload = await prisma.upload.create({
      data: {
        fileName: `${title || 'tekst-invoer'}-${Date.now()}.md`,
        fileType: 'text/markdown',
        extractedContent: content.slice(0, 50000),
        status: 'PROCESSING',
        userId,
      },
    });

    // Get chapters for context
    const chapters = await prisma.chapter.findMany({
      orderBy: { number: 'asc' },
      select: { id: true, title: true, number: true },
    });
    const chaptersContext = chapters?.map?.((c: any) => `${c?.number}. ${c?.title} (id: ${c?.id})`)?.join?.('\n') ?? '';

    // AI analysis with dual task: categorize content + extract GitHub links
    const analysisResponse = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gemini-2.5-flash',
        messages: [{
          role: 'user',
          content: `Je bent een AI-assistent die content analyseert voor een Claude Code kennisbank. Je hebt TWEE taken:

1. Analyseer de tekst en bepaal in welk hoofdstuk/sectie deze thuishoort
2. Extraheer ALLE GitHub links en bepaal voor elke link of het een SKILL, MCP server, TOOL of PLUGIN is

Bestaande hoofdstukken:
${chaptersContext}

Tekst om te analyseren:
${content.slice(0, 5000)}

Geef je antwoord in dit exacte JSON-formaat:
{
  "contentAnalysis": {
    "summary": "Korte samenvatting (2-3 zinnen)",
    "suggestedChapterId": "het id van het meest relevante hoofdstuk, of null",
    "suggestedChapterTitle": "titel van het gesuggereerde hoofdstuk",
    "suggestedSectionTitle": "titel voor een nieuwe sectie",
    "suggestedTags": ["tag1", "tag2"],
    "contentType": "Skills | MCP Servers | Tips | Commando's | Configuratie | Workflow | Anders"
  },
  "extractedRepos": [
    {
      "url": "https://github.com/owner/repo",
      "name": "repo naam",
      "category": "SKILL | MCP | TOOL | PLUGIN | OTHER",
      "contextNote": "beschrijving uit de tekst over deze repo",
      "installCommand": "installatie commando als gevonden in tekst, anders null"
    }
  ]
}

Extraheer ELKE github.com link uit de tekst. Bepaal de categorie op basis van de context rondom de link.
Respond with raw JSON only.`,
        }],
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!analysisResponse?.ok) {
      return NextResponse.json({ error: 'AI analyse mislukt' }, { status: 500 });
    }

    const aiData = await analysisResponse.json();
    const resultText = aiData?.choices?.[0]?.message?.content ?? '{}';
    let result: any = {};
    try { result = JSON.parse(resultText); } catch { result = {}; }

    const contentAnalysis = result?.contentAnalysis ?? {};
    const extractedRepos = result?.extractedRepos ?? [];

    // Update upload with AI suggestions
    await prisma.upload.update({
      where: { id: upload.id },
      data: {
        aiSuggestion: JSON.stringify(result),
        suggestedChapter: contentAnalysis?.suggestedChapterTitle ?? null,
        suggestedSection: contentAnalysis?.suggestedSectionTitle ?? null,
        suggestedTags: contentAnalysis?.suggestedTags ?? [],
        status: 'REVIEWED',
      },
    });

    // For each extracted repo, try to fetch GitHub info
    const reposWithInfo = [];
    for (const repo of extractedRepos) {
      if (!repo?.url) continue;
      const normalizedUrl = String(repo.url).trim().replace(/\/+$/, '');
      try {
        const match = normalizedUrl.match(/github\.com\/([^/]+)\/([^/\s#?]+)/);
        if (!match) continue;
        const [, owner, repoName] = match;
        const cleanName = repoName.replace(/\.git$/, '');

        const ghHeaders: Record<string, string> = {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'ClaudeCodeKennisbank',
        };
        if (process.env.GITHUB_TOKEN) ghHeaders['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;

        let ghData: any = null;
        try {
          const ghRes = await fetch(`https://api.github.com/repos/${owner}/${cleanName}`, { headers: ghHeaders });
          if (ghRes?.ok) ghData = await ghRes.json();
        } catch {}

        reposWithInfo.push({
          url: `https://github.com/${owner}/${cleanName}`,
          name: ghData?.name ?? repo?.name ?? cleanName,
          description: ghData?.description ?? null,
          contextNote: repo?.contextNote ?? null,
          category: repo?.category ?? 'OTHER',
          installCommand: repo?.installCommand ?? null,
          stars: ghData?.stargazers_count ?? null,
          license: ghData?.license?.spdx_id ?? null,
          language: ghData?.language ?? null,
        });
      } catch {}
    }

    return NextResponse.json({
      uploadId: upload.id,
      contentAnalysis,
      extractedRepos: reposWithInfo,
    });
  } catch (error: any) {
    console.error('Text input error:', error);
    return NextResponse.json({ error: 'Fout bij verwerken tekst' }, { status: 500 });
  }
}
