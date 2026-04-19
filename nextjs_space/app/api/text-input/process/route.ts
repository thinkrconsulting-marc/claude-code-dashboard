export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

const LLM_URL = process.env.GEMINI_API_KEY
  ? 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
  : 'https://apps.abacus.ai/v1/chat/completions';
const LLM_KEY = process.env.GEMINI_API_KEY || process.env.ABACUSAI_API_KEY || '';
const LLM_MODEL = process.env.GEMINI_API_KEY ? 'gemini-2.5-flash' : 'gemini-2.5-flash';

async function callLLM(messages: any[], maxTokens = 4000) {
  const res = await fetch(LLM_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${LLM_KEY}` },
    body: JSON.stringify({ model: LLM_MODEL, messages, max_tokens: maxTokens, response_format: { type: 'json_object' } }),
  });
  if (!res.ok) throw new Error(`LLM error: ${res.status}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content ?? '{}';
  try { return JSON.parse(text); } catch { return {}; }
}

function parseMarkdownToBlocks(text: string): { type: string; content: string; language?: string; imageUrl?: string }[] {
  const blocks: { type: string; content: string; language?: string; imageUrl?: string }[] = [];
  const lines = text.split('\n');
  let current = '';
  let inCode = false;
  let codeLang = '';
  let inTable = false;
  let tableLines: string[] = [];

  const flushText = () => {
    const t = current.trim();
    if (t) blocks.push({ type: 'TEXT', content: t });
    current = '';
  };

  for (const line of lines) {
    if (line.startsWith('```')) {
      if (!inCode) {
        flushText();
        inCode = true;
        codeLang = line.slice(3).trim();
      } else {
        blocks.push({ type: 'CODE', content: current.trim(), language: codeLang || undefined });
        current = '';
        inCode = false;
        codeLang = '';
      }
      continue;
    }
    if (inCode) { current += line + '\n'; continue; }

    // Image detection: ![alt](url)
    const imgMatch = line.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) {
      flushText();
      blocks.push({ type: 'IMAGE', content: imgMatch[1] || 'Afbeelding', imageUrl: imgMatch[2] });
      continue;
    }

    // Table detection
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      if (!inTable) { flushText(); inTable = true; tableLines = []; }
      if (!line.match(/^\|[\s-|]+\|$/)) tableLines.push(line);
      continue;
    } else if (inTable) {
      if (tableLines.length > 0) blocks.push({ type: 'TABLE', content: JSON.stringify(tableLines.map(l => l.split('|').map(c => c.trim()).filter(Boolean))) });
      tableLines = [];
      inTable = false;
    }

    current += line + '\n';
  }
  flushText();
  if (inTable && tableLines.length > 0) {
    blocks.push({ type: 'TABLE', content: JSON.stringify(tableLines.map(l => l.split('|').map(c => c.trim()).filter(Boolean))) });
  }
  return blocks;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }
    const userId = (session?.user as any)?.id;
    const body = await request.json();
    const { title, content } = body ?? {};
    if (!content || content.trim().length < 10) {
      return NextResponse.json({ error: 'Tekst moet minimaal 10 tekens bevatten' }, { status: 400 });
    }

    // 1. Get all existing chapters + sections for context
    const chapters = await prisma.chapter.findMany({
      orderBy: { number: 'asc' },
      include: {
        guide: { select: { id: true, title: true } },
        sections: {
          orderBy: { orderIndex: 'asc' },
          include: { blocks: { orderBy: { orderIndex: 'asc' }, select: { type: true, content: true } } },
        },
      },
    });

    // Build context of existing content (abbreviated)
    const existingContext = chapters.map(ch => {
      const sectionsInfo = ch.sections.map(s => {
        const blockSummary = s.blocks.map(b => b.content.substring(0, 150)).join(' | ');
        return `  - Sectie "${s.title}" (id: ${s.id}): ${blockSummary.substring(0, 300)}`;
      }).join('\n');
      return `Hoofdstuk ${ch.number}: ${ch.title} (id: ${ch.id}, guide: ${ch.guide.title})\n${sectionsInfo}`;
    }).join('\n\n');

    // 2. AI Analysis: Compare new text with existing content
    const analysisResult = await callLLM([{
      role: 'user',
      content: `Je bent een kennisbank-beheerder voor Claude Code documentatie (in het Nederlands).

BESTAANDE INHOUD:
${existingContext.substring(0, 12000)}

NIEUWE TEKST OM TE VERWERKEN:
${content.substring(0, 8000)}

Analyseer de nieuwe tekst en vergelijk met de bestaande inhoud. Splits de nieuwe tekst op in logische stukken.
Voor elk stuk, bepaal de actie:

- NEW_SECTION: Informatie die NIET bestaat → maak nieuwe sectie in bestaand hoofdstuk
- UPDATE_SECTION: Informatie die al bestaat maar de nieuwe versie is uitgebreider/actueler → werk bij
- NEW_CHAPTER: Informatie die in GEEN enkel hoofdstuk past → maak nieuw hoofdstuk
- DUPLICATE_SKIP: Informatie die al identiek bestaat → overslaan
- OUTDATED_REPLACE: Bestaande info die verouderd is en vervangen moet worden

Geef je antwoord in dit exacte JSON-formaat:
{
  "actions": [
    {
      "action": "NEW_SECTION | UPDATE_SECTION | NEW_CHAPTER | DUPLICATE_SKIP | OUTDATED_REPLACE",
      "targetChapterId": "id van het hoofdstuk (null bij NEW_CHAPTER)",
      "targetSectionId": "id van de sectie bij UPDATE/OUTDATED (null bij NEW)",
      "newChapterTitle": "titel bij NEW_CHAPTER (anders null)",
      "newChapterNumber": nummer bij NEW_CHAPTER (anders null),
      "sectionTitle": "titel voor de sectie",
      "content": "de volledige tekst voor deze sectie (markdown)",
      "tags": ["tag1", "tag2"],
      "reason": "korte uitleg waarom deze actie"
    }
  ],
  "extractedRepos": [
    {
      "url": "https://github.com/owner/repo",
      "name": "naam",
      "category": "SKILL | MCP | TOOL | PLUGIN | OTHER",
      "contextNote": "beschrijving",
      "installCommand": "commando of null"
    }
  ],
  "summary": "Samenvatting van wat er verwerkt wordt"
}

Wees grondig: splits de tekst op per onderwerp. Eén actie per logisch blok.
Bij UPDATE_SECTION: neem de VOLLEDIGE nieuwe + bestaande content samen (merged).
Bij OUTDATED_REPLACE: geef de nieuwe vervangende tekst.
Extraheer ALLE github.com links.
Respond with raw JSON only.`
    }], 6000);

    const actions = analysisResult?.actions ?? [];
    const extractedRepos = analysisResult?.extractedRepos ?? [];
    const summary = analysisResult?.summary ?? 'Verwerking voltooid';

    // 3. Auto-apply all actions
    const results: any[] = [];
    let sectionsCreated = 0, sectionsUpdated = 0, chaptersCreated = 0, duplicatesSkipped = 0;

    // Get main guide for new chapters
    const mainGuide = await prisma.guide.findFirst({ where: { isMain: true } }) ?? await prisma.guide.findFirst();
    if (!mainGuide) {
      return NextResponse.json({ error: 'Geen gids gevonden' }, { status: 500 });
    }

    for (const action of actions) {
      try {
        if (action.action === 'DUPLICATE_SKIP') {
          duplicatesSkipped++;
          results.push({ action: 'DUPLICATE_SKIP', sectionTitle: action.sectionTitle, reason: action.reason });
          continue;
        }

        if (action.action === 'NEW_CHAPTER') {
          // Create new chapter
          const maxNumber = await prisma.chapter.aggregate({ _max: { number: true } });
          const newNumber = (maxNumber._max.number ?? 0) + 1;
          const chapter = await prisma.chapter.create({
            data: {
              title: action.newChapterTitle || action.sectionTitle || `Hoofdstuk ${newNumber}`,
              number: action.newChapterNumber || newNumber,
              guideId: mainGuide.id,
            },
          });

          // Create section in new chapter
          const blocks = parseMarkdownToBlocks(action.content || '');
          const section = await prisma.section.create({
            data: {
              title: action.sectionTitle || 'Introductie',
              orderIndex: 0,
              chapterId: chapter.id,
              tags: action.tags || [],
            },
          });

          for (let i = 0; i < blocks.length; i++) {
            await prisma.contentBlock.create({
              data: {
                type: blocks[i].type as any,
                content: blocks[i].content,
                language: blocks[i].language || null,
                imageUrl: blocks[i].imageUrl || null,
                orderIndex: i,
                sectionId: section.id,
              },
            });
          }

          // Save version
          await prisma.sectionVersion.create({
            data: {
              sectionId: section.id,
              versionNumber: 1,
              title: section.title,
              contentSnapshot: action.content || '',
              action: 'NEW_CHAPTER',
              changeNote: action.reason || 'Nieuw hoofdstuk aangemaakt',
              createdById: userId,
            },
          });

          chaptersCreated++;
          sectionsCreated++;
          results.push({ action: 'NEW_CHAPTER', chapterTitle: chapter.title, sectionTitle: section.title, reason: action.reason });
          continue;
        }

        if (action.action === 'NEW_SECTION') {
          if (!action.targetChapterId) continue;
          const existingSections = await prisma.section.count({ where: { chapterId: action.targetChapterId } });
          const blocks = parseMarkdownToBlocks(action.content || '');
          const section = await prisma.section.create({
            data: {
              title: action.sectionTitle || 'Nieuwe sectie',
              orderIndex: existingSections,
              chapterId: action.targetChapterId,
              tags: action.tags || [],
            },
          });

          for (let i = 0; i < blocks.length; i++) {
            await prisma.contentBlock.create({
              data: {
                type: blocks[i].type as any,
                content: blocks[i].content,
                language: blocks[i].language || null,
                imageUrl: blocks[i].imageUrl || null,
                orderIndex: i,
                sectionId: section.id,
              },
            });
          }

          await prisma.sectionVersion.create({
            data: {
              sectionId: section.id,
              versionNumber: 1,
              title: section.title,
              contentSnapshot: action.content || '',
              action: 'NEW_SECTION',
              changeNote: action.reason || 'Nieuwe sectie toegevoegd',
              createdById: userId,
            },
          });

          sectionsCreated++;
          results.push({ action: 'NEW_SECTION', sectionTitle: section.title, chapterId: action.targetChapterId, reason: action.reason });
          continue;
        }

        if (action.action === 'UPDATE_SECTION' || action.action === 'OUTDATED_REPLACE') {
          if (!action.targetSectionId) continue;

          // Get existing section
          const existingSection = await prisma.section.findUnique({
            where: { id: action.targetSectionId },
            include: { blocks: { orderBy: { orderIndex: 'asc' } } },
          });
          if (!existingSection) continue;

          // Save old version
          const versionCount = await prisma.sectionVersion.count({ where: { sectionId: existingSection.id } });
          const oldContent = existingSection.blocks.map(b => b.content).join('\n\n');
          await prisma.sectionVersion.create({
            data: {
              sectionId: existingSection.id,
              versionNumber: versionCount + 1,
              title: existingSection.title,
              contentSnapshot: oldContent,
              action: action.action as any,
              changeNote: `Vorige versie (voor ${action.action === 'OUTDATED_REPLACE' ? 'vervanging' : 'update'})`,
              createdById: userId,
            },
          });

          // Delete old blocks and create new ones
          await prisma.contentBlock.deleteMany({ where: { sectionId: existingSection.id } });
          const blocks = parseMarkdownToBlocks(action.content || '');
          for (let i = 0; i < blocks.length; i++) {
            await prisma.contentBlock.create({
              data: {
                type: blocks[i].type as any,
                content: blocks[i].content,
                language: blocks[i].language || null,
                imageUrl: blocks[i].imageUrl || null,
                orderIndex: i,
                sectionId: existingSection.id,
              },
            });
          }

          // Update section title/tags if needed
          if (action.sectionTitle || (action.tags && action.tags.length > 0)) {
            await prisma.section.update({
              where: { id: existingSection.id },
              data: {
                ...(action.sectionTitle ? { title: action.sectionTitle } : {}),
                ...(action.tags?.length ? { tags: action.tags } : {}),
              },
            });
          }

          // Save new version
          await prisma.sectionVersion.create({
            data: {
              sectionId: existingSection.id,
              versionNumber: versionCount + 2,
              title: action.sectionTitle || existingSection.title,
              contentSnapshot: action.content || '',
              action: action.action as any,
              changeNote: action.reason || 'Content bijgewerkt',
              createdById: userId,
            },
          });

          sectionsUpdated++;
          results.push({ action: action.action, sectionTitle: existingSection.title, reason: action.reason });
          continue;
        }
      } catch (err: any) {
        console.error(`Error processing action:`, action.action, err?.message);
        results.push({ action: action.action, sectionTitle: action.sectionTitle, error: err?.message });
      }
    }

    // 4. Save repos
    let reposExtracted = 0;
    for (const repo of extractedRepos) {
      if (!repo?.url) continue;
      try {
        const normalizedUrl = String(repo.url).trim().replace(/\/+$/, '');
        const match = normalizedUrl.match(/github\.com\/([^/]+)\/([^/\s#?]+)/);
        if (!match) continue;
        const [, owner, repoName] = match;
        const cleanName = repoName.replace(/\.git$/, '');
        const fullUrl = `https://github.com/${owner}/${cleanName}`;

        // Fetch GitHub info
        const ghHeaders: Record<string, string> = { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'ClaudeCodeKB' };
        if (process.env.GITHUB_TOKEN) ghHeaders['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
        let ghData: any = null;
        try {
          const ghRes = await fetch(`https://api.github.com/repos/${owner}/${cleanName}`, { headers: ghHeaders });
          if (ghRes?.ok) ghData = await ghRes.json();
        } catch {}

        await prisma.gitHubRepo.upsert({
          where: { url: fullUrl },
          update: {
            stars: ghData?.stargazers_count ?? undefined,
            description: ghData?.description ?? undefined,
            language: ghData?.language ?? undefined,
          },
          create: {
            url: fullUrl,
            name: ghData?.name ?? repo.name ?? cleanName,
            description: ghData?.description ?? null,
            contextNote: repo.contextNote ?? null,
            category: (['SKILL', 'MCP', 'TOOL', 'PLUGIN'].includes(repo.category) ? repo.category : 'OTHER') as any,
            installCommand: repo.installCommand ?? null,
            stars: ghData?.stargazers_count ?? null,
            license: ghData?.license?.spdx_id ?? null,
            language: ghData?.language ?? null,
            addedById: userId,
          },
        });
        reposExtracted++;
      } catch {}
    }

    // 5. Create processing log
    const log = await prisma.processingLog.create({
      data: {
        inputTitle: title || null,
        inputLength: content.length,
        actionsJson: JSON.stringify(results),
        sectionsCreated,
        sectionsUpdated,
        chaptersCreated,
        duplicatesSkipped,
        reposExtracted,
        processedById: userId,
      },
    });

    return NextResponse.json({
      success: true,
      logId: log.id,
      summary,
      stats: { sectionsCreated, sectionsUpdated, chaptersCreated, duplicatesSkipped, reposExtracted },
      actions: results,
    });
  } catch (error: any) {
    console.error('Process error:', error);
    return NextResponse.json({ error: error?.message || 'Fout bij verwerken' }, { status: 500 });
  }
}
