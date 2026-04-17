import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

function parseMarkdownToChapters(content: string) {
  const lines = content?.split?.('\n') ?? [];
  const chapters: any[] = [];
  let currentChapter: any = null;
  let currentSection: any = null;
  let currentBlock: any = null;
  let inCodeBlock = false;
  let codeBlockContent = '';
  let codeBlockLang = '';
  let inTable = false;
  let tableRows: string[][] = [];
  let chapterNum = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    const trimmed = line?.trim?.() ?? '';

    // Code block handling
    if (trimmed?.startsWith?.('```')) {
      if (inCodeBlock) {
        // End code block
        if (currentSection) {
          currentSection.blocks.push({
            type: 'CODE',
            content: codeBlockContent?.trim?.() ?? '',
            language: codeBlockLang || null,
          });
        }
        inCodeBlock = false;
        codeBlockContent = '';
        codeBlockLang = '';
        continue;
      } else {
        // Start code block
        inCodeBlock = true;
        codeBlockLang = trimmed?.slice?.(3)?.trim?.() ?? '';
        continue;
      }
    }
    if (inCodeBlock) {
      codeBlockContent += line + '\n';
      continue;
    }

    // Table handling
    if (trimmed?.startsWith?.('|') && trimmed?.endsWith?.('|')) {
      const cells = trimmed?.split?.('|')?.slice?.(1, -1)?.map?.((c: string) => c?.trim?.() ?? '') ?? [];
      // Skip separator rows
      if (cells?.every?.((c: string) => /^[-:\s]+$/.test(c ?? ''))) continue;
      if (!inTable) inTable = true;
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      // End of table
      if (currentSection && tableRows.length > 0) {
        currentSection.blocks.push({
          type: 'TABLE',
          content: JSON.stringify(tableRows),
          language: null,
        });
      }
      inTable = false;
      tableRows = [];
    }

    // Chapter headings (# Hoofdstuk N:)
    if (trimmed?.startsWith?.('# Hoofdstuk') || trimmed?.match?.(/^# .+/)) {
      if (trimmed?.startsWith?.('# Hoofdstuk')) {
        chapterNum++;
        const title = trimmed?.replace?.(/^#\s*/, '') ?? '';
        currentChapter = { title, number: chapterNum, sections: [] };
        chapters.push(currentChapter);
        currentSection = null;
      }
      continue;
    }

    // Section headings (## or ###)
    if ((trimmed?.startsWith?.('## ') || trimmed?.startsWith?.('### ')) && currentChapter) {
      const title = trimmed?.replace?.(/^#+\s*/, '') ?? '';
      currentSection = {
        title,
        blocks: [],
        tags: detectTags(title),
      };
      currentChapter.sections.push(currentSection);
      continue;
    }

    // Regular text
    if (trimmed && currentSection) {
      // Check if previous block is TEXT, append to it
      const lastBlock = currentSection.blocks?.[currentSection.blocks.length - 1];
      if (lastBlock && lastBlock.type === 'TEXT') {
        lastBlock.content += '\n' + trimmed;
      } else {
        currentSection.blocks.push({ type: 'TEXT', content: trimmed, language: null });
      }
    }
  }

  // Flush remaining table
  if (inTable && currentSection && tableRows.length > 0) {
    currentSection.blocks.push({ type: 'TABLE', content: JSON.stringify(tableRows), language: null });
  }

  return chapters;
}

function detectTags(title: string): string[] {
  const tags: string[] = [];
  const lower = title?.toLowerCase?.() ?? '';
  if (lower?.includes?.('skill')) tags.push('Skills');
  if (lower?.includes?.('mcp') || lower?.includes?.('server')) tags.push('MCP');
  if (lower?.includes?.('hook')) tags.push('Hooks');
  if (lower?.includes?.('command') || lower?.includes?.('commando')) tags.push('Commando\'s');
  if (lower?.includes?.('install') || lower?.includes?.('installat')) tags.push('Installatie');
  if (lower?.includes?.('config') || lower?.includes?.('configurati')) tags.push('Configuratie');
  if (lower?.includes?.('workflow') || lower?.includes?.('orchestr')) tags.push('Workflow');
  if (lower?.includes?.('tip') || lower?.includes?.('trick') || lower?.includes?.('best pract')) tags.push('Tips');
  if (lower?.includes?.('token') || lower?.includes?.('kost')) tags.push('Kosten');
  if (lower?.includes?.('security') || lower?.includes?.('beveilig')) tags.push('Security');
  if (lower?.includes?.('prompt')) tags.push('Prompts');
  if (lower?.includes?.('github') || lower?.includes?.('repo')) tags.push('GitHub');
  if (lower?.includes?.('plugin')) tags.push('Plugins');
  return tags;
}

async function main() {
  console.log('Starting seed...');

  // 1. Create admin user
  const adminPassword = await bcrypt.hash('johndoe123', 12);
  await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: { role: 'ADMIN' },
    create: { email: 'john@doe.com', name: 'Admin', password: adminPassword, role: 'ADMIN' },
  });
  console.log('Admin user created/updated');

  // 2. Parse main guide
  const guidePath = path.join(__dirname, '..', 'data', 'Claude_Code_Gids_NL.md');
  let guideContent = '';
  try {
    guideContent = fs.readFileSync(guidePath, 'utf-8');
  } catch (e) {
    console.error('Could not read guide file:', guidePath);
    return;
  }

  const chapters = parseMarkdownToChapters(guideContent);
  console.log(`Parsed ${chapters.length} chapters`);

  // 3. Create or update main guide
  const guide = await prisma.guide.upsert({
    where: { id: 'main-guide' },
    update: { title: 'Claude Code — De Uitgebreide Gids', version: '1.0' },
    create: {
      id: 'main-guide',
      title: 'Claude Code — De Uitgebreide Gids',
      description: 'Alles wat je moet weten over Claude Code — Installatie, Configuratie, Skills, MCP, Workflows & Meer',
      version: '1.0',
      isMain: true,
    },
  });
  console.log('Guide created:', guide.title);

  // 4. Seed chapters and sections
  for (const ch of chapters) {
    const chapter = await prisma.chapter.upsert({
      where: { id: `ch-${ch.number}` },
      update: { title: ch.title, number: ch.number },
      create: {
        id: `ch-${ch.number}`,
        title: ch.title,
        number: ch.number,
        guideId: guide.id,
      },
    });

    for (let si = 0; si < (ch.sections?.length ?? 0); si++) {
      const sec = ch.sections[si];
      const sectionId = `sec-${ch.number}-${si}`;
      const section = await prisma.section.upsert({
        where: { id: sectionId },
        update: { title: sec.title, orderIndex: si, tags: sec.tags ?? [] },
        create: {
          id: sectionId,
          title: sec.title,
          orderIndex: si,
          chapterId: chapter.id,
          tags: sec.tags ?? [],
        },
      });

      for (let bi = 0; bi < (sec.blocks?.length ?? 0); bi++) {
        const block = sec.blocks[bi];
        const blockId = `blk-${ch.number}-${si}-${bi}`;
        await prisma.contentBlock.upsert({
          where: { id: blockId },
          update: { type: block.type, content: block.content ?? '', language: block.language ?? null, orderIndex: bi },
          create: {
            id: blockId,
            type: block.type,
            content: block.content ?? '',
            language: block.language ?? null,
            orderIndex: bi,
            sectionId: section.id,
          },
        });
      }
    }
    console.log(`  Chapter ${ch.number}: ${ch.title} - ${ch.sections?.length ?? 0} sections`);
  }

  // 5. Seed CLAUDE.md templates
  const templateFiles = [
    { name: 'General CLAUDE.md', file: 'general_CLAUDE.md', category: 'General', desc: 'Algemene software development CLAUDE.md template' },
    { name: 'Tech CLAUDE.md', file: 'tech_CLAUDE.md', category: 'Tech', desc: 'Full-stack web development CLAUDE.md template' },
    { name: 'Finance CLAUDE.md', file: 'finance_CLAUDE.md', category: 'Finance', desc: 'Finance & stock trading CLAUDE.md template' },
  ];

  for (const tmpl of templateFiles) {
    const tmplPath = path.join(__dirname, '..', 'data', tmpl.file);
    let tmplContent = '';
    try { tmplContent = fs.readFileSync(tmplPath, 'utf-8'); } catch { continue; }
    await prisma.template.upsert({
      where: { id: `tmpl-${tmpl.category.toLowerCase()}` },
      update: { content: tmplContent },
      create: {
        id: `tmpl-${tmpl.category.toLowerCase()}`,
        name: tmpl.name,
        description: tmpl.desc,
        category: tmpl.category,
        content: tmplContent,
      },
    });
    console.log(`Template seeded: ${tmpl.name}`);
  }

  // 6. Seed Skills Installation Guide as a separate guide
  const skillsPath = path.join(__dirname, '..', 'data', 'Skills_Installation_Guide.md');
  let skillsContent = '';
  try { skillsContent = fs.readFileSync(skillsPath, 'utf-8'); } catch {}
  if (skillsContent) {
    const skillsGuide = await prisma.guide.upsert({
      where: { id: 'skills-guide' },
      update: { title: 'Skills & MCP Installation Guide' },
      create: {
        id: 'skills-guide',
        title: 'Skills & MCP Installation Guide',
        description: 'Complete installation guide for Claude Code Skills and MCP Servers',
        version: '1.0',
        isMain: false,
      },
    });

    const skillsChapters = parseMarkdownToChapters('# Hoofdstuk 1: Skills & MCP Installation Guide\n' + skillsContent);
    for (const ch of skillsChapters) {
      const chapter = await prisma.chapter.upsert({
        where: { id: `skills-ch-${ch.number}` },
        update: { title: 'Skills & MCP Installation Guide', number: 15 },
        create: {
          id: `skills-ch-${ch.number}`,
          title: 'Skills & MCP Installation Guide',
          number: 15,
          guideId: skillsGuide.id,
        },
      });
      for (let si = 0; si < (ch.sections?.length ?? 0); si++) {
        const sec = ch.sections[si];
        const skillSectionId = `skills-sec-${si}`;
        const section = await prisma.section.upsert({
          where: { id: skillSectionId },
          update: { title: sec.title, orderIndex: si, tags: [...(sec.tags ?? []), 'Skills', 'MCP'] },
          create: {
            id: skillSectionId,
            title: sec.title,
            orderIndex: si,
            chapterId: chapter.id,
            tags: [...(sec.tags ?? []), 'Skills', 'MCP'],
          },
        });
        for (let bi = 0; bi < (sec.blocks?.length ?? 0); bi++) {
          const block = sec.blocks[bi];
          const skillBlockId = `skills-blk-${si}-${bi}`;
          await prisma.contentBlock.upsert({
            where: { id: skillBlockId },
            update: { type: block.type, content: block.content ?? '', language: block.language ?? null, orderIndex: bi },
            create: {
              id: skillBlockId,
              type: block.type,
              content: block.content ?? '',
              language: block.language ?? null,
              orderIndex: bi,
              sectionId: section.id,
            },
          });
        }
      }
      console.log('Skills guide seeded');
    }
  }

  console.log('Seed completed!');
}

main()
  .catch((e) => { console.error('Seed error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
