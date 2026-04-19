const path = require('path');
const { PrismaClient } = require(path.join(process.cwd(), 'node_modules', '@prisma/client'));
const prisma = new PrismaClient();

// All repos extracted from chapters 6, 7, 8, and 15
const repos = [
  // === SKILLS (from Ch6 + Ch15) ===
  // Top 10 most popular
  { name: "Remotion Best Practices", url: "https://github.com/remotion-dev/skills", description: "Video/Creative skill - Remotion best practices voor video generatie. 213K wekelijkse installs.", category: "SKILL", installCommand: "npx skills add https://github.com/remotion-dev/skills --skill remotion-best-practices", language: "TypeScript" },
  { name: "Agent Browser", url: "https://github.com/vercel-labs/agent-browser", description: "Automatisering skill door Vercel Labs. 161.2K wekelijkse installs.", category: "SKILL", installCommand: "npx skills add https://github.com/vercel-labs/agent-browser --skill agent-browser", language: "TypeScript" },
  { name: "UI/UX Pro Max", url: "https://github.com/nextlevelbuilder/ui-ux-pro-max-skill", description: "Design skill voor UI/UX. 102.4K wekelijkse installs.", category: "SKILL", installCommand: "npx skills add https://github.com/nextlevelbuilder/ui-ux-pro-max-skill --skill ui-ux-pro-max", language: "TypeScript" },
  { name: "Marketing Skills (Corey Haines)", url: "https://github.com/coreyhaines31/marketingskills", description: "20+ skills: CRO, copywriting, SEO, email, groei. Inclusief SEO Audit (68.1K installs) en Ad Creative (23.6K installs).", category: "SKILL", installCommand: "npx skills add https://github.com/coreyhaines31/marketingskills --skill seo-audit", language: "TypeScript" },
  { name: "Firecrawl CLI", url: "https://github.com/firecrawl/cli", description: "Data scraping skill. 25.6K wekelijkse installs.", category: "SKILL", installCommand: "npx skills add https://github.com/firecrawl/cli --skill firecrawl", language: "TypeScript" },
  { name: "Grill Me", url: "https://github.com/mattpocock/skills", description: "Productiviteit skill door Matt Pocock. 17.6K wekelijkse installs.", category: "SKILL", installCommand: "npx skills add https://github.com/mattpocock/skills --skill grill-me", language: "TypeScript" },
  { name: "Google Workspace Gmail", url: "https://github.com/googleworkspace/cli", description: "Gmail integratie skill. 15.6K wekelijkse installs.", category: "SKILL", installCommand: "npx skills add https://github.com/googleworkspace/cli --skill gws-gmail", language: "TypeScript" },
  { name: "Humanizer (Softaworks)", url: "https://github.com/softaworks/agent-toolkit", description: "Schrijf skill - herschrijf AI-klinkende tekst natuurlijk.", category: "SKILL", installCommand: "npx skills add https://github.com/softaworks/agent-toolkit --skill humanizer", language: "TypeScript" },

  // Official Anthropic Skills
  { name: "Anthropic Official Skills", url: "https://github.com/anthropics/skills", description: "Officiële Anthropic skills collectie: PDF, DOCX, PPTX, XLSX, Doc Co-Authoring, Skill Creator, Frontend Design (277K+ installs), Canvas Design, Algorithmic Art, Theme Factory, Web Artifacts Builder, Brand Guidelines, MCP Builder (33.3K installs).", category: "SKILL", installCommand: "npx skills add https://github.com/anthropics/skills --skill <skill-naam>", language: "TypeScript" },
  { name: "Awesome Claude Skills (Curated)", url: "https://github.com/anthropics/awesome-skills", description: "Gecureerde lijst van Claude Code skills door Anthropic.", category: "SKILL", installCommand: "git clone https://github.com/anthropics/awesome-skills", language: "Markdown" },

  // Development & Engineering Skills
  { name: "Superpowers", url: "https://github.com/obra/superpowers", description: "20+ battle-tested skills: TDD, debugging, plan-to-execute, systematic debugging. 96K+ stars.", category: "SKILL", installCommand: "npx skills add https://github.com/obra/superpowers --skill superpowers", language: "TypeScript" },
  { name: "Context Optimization", url: "https://github.com/muratcankoylan/agent-skills-for-context-engineering", description: "Verminder token kosten met KV-cache trucs en context engineering.", category: "SKILL", installCommand: "npx skills add https://github.com/muratcankoylan/agent-skills-for-context-engineering --skill context-optimization", language: "TypeScript" },
  { name: "Deep Research", url: "https://github.com/199-biotechnologies/claude-deep-research-skill", description: "8-fase onderzoek skill met auto-continuation.", category: "SKILL", installCommand: "npx skills add https://github.com/199-biotechnologies/claude-deep-research-skill --skill deep-research", language: "TypeScript" },
  { name: "TDD Guard", url: "https://github.com/nizos/tdd-guard", description: "Enforces test-first development voor AI agents.", category: "SKILL", installCommand: "npx skills add https://github.com/nizos/tdd-guard", language: "TypeScript" },
  { name: "Massgen File Search", url: "https://github.com/massgen/massgen", description: "Ripgrep + ast-grep mastery voor file search.", category: "SKILL", installCommand: "npx skills add https://github.com/massgen/massgen --skill file-search", language: "TypeScript" },

  // Marketing & SEO Skills
  { name: "Claude SEO", url: "https://github.com/AgriciDaniel/claude-seo", description: "Volledige site-audits, schema-validatie, 12 sub-skills voor SEO.", category: "SKILL", installCommand: "npx skills add https://github.com/AgriciDaniel/claude-seo --skill claude-seo", language: "TypeScript" },
  { name: "GO VIRAL BRO", url: "https://github.com/charlesdove977/goviralbro", description: "Trainbare content pipeline met 7 slash commands.", category: "SKILL", installCommand: "git clone https://github.com/charlesdove977/goviralbro && bash scripts/init-viral-command.sh", language: "Shell" },

  // Finance & Trading Skills
  { name: "Claude Trading Skills", url: "https://github.com/tradermonty/claude-trading-skills", description: "Finance skills: Sector Analyst, Technical Analyst, Market News Analyst, Backtest Expert.", category: "SKILL", installCommand: "npx skills add https://github.com/tradermonty/claude-trading-skills", language: "TypeScript" },

  // Knowledge & Learning Skills
  { name: "NotebookLM Skill", url: "https://github.com/PleasePrompto/notebooklm-skill", description: "Claude + NotebookLM bridge voor kennisbeheer.", category: "SKILL", installCommand: "npx skills add https://github.com/PleasePrompto/notebooklm-skill --skill notebooklm", language: "TypeScript" },
  { name: "Obsidian Skills", url: "https://github.com/kepano/obsidian-skills", description: "Auto-tagging, auto-linking, vault-native Obsidian integratie.", category: "SKILL", installCommand: "npx skills add https://github.com/kepano/obsidian-skills --skill obsidian", language: "TypeScript" },
  { name: "Wiki-Brain Skill", url: "https://github.com/tenfoldmarc/wiki-brain-skill", description: "Done-for-you Graphify setup met Obsidian integratie. Kennisgraaf voor token reductie.", category: "SKILL", installCommand: "git clone https://github.com/tenfoldmarc/wiki-brain-skill ~/.claude/skills/wiki-brain", language: "TypeScript" },

  // Miscellaneous Skills
  { name: "Humaniser Writing", url: "https://github.com/blader/humanizer", description: "Herschrijf AI-klinkende tekst naar natuurlijke schrijfstijl.", category: "SKILL", installCommand: "npx skills add https://github.com/blader/humanizer --skill humanizer", language: "TypeScript" },
  { name: "Awesome Claude Skills (Community)", url: "https://github.com/travisvn/awesome-claude-skills", description: "Gecureerde community skill lijst. 22K+ stars.", category: "SKILL", installCommand: "git clone https://github.com/travisvn/awesome-claude-skills", language: "Markdown" },
  { name: "Banana Claude", url: "https://github.com/AgriciDaniel/banana-claude", description: "Content pipeline skill.", category: "SKILL", installCommand: "npx skills add https://github.com/AgriciDaniel/banana-claude", language: "TypeScript" },
  { name: "Awesome OpenClaw Skills", url: "https://github.com/VoltAgent/awesome-openclaw-skills", description: "Community skills voor OpenClaw/Vibe Code.", category: "SKILL", installCommand: "git clone https://github.com/VoltAgent/awesome-openclaw-skills", language: "Markdown" },
  { name: "Context Engineering Intro", url: "https://github.com/coleam00/context-engineering-intro", description: "Reduce token usage patterns en context engineering intro.", category: "SKILL", installCommand: "npx skills add https://github.com/coleam00/context-engineering-intro", language: "TypeScript" },

  // === MCP SERVERS (from Ch7 + Ch15) ===
  { name: "Context7 (Upstash)", url: "https://github.com/upstash/context7", description: "Documentatie server - altijd up-to-date, versie-specifieke docs voor 50+ frameworks. 230.000+ installs. Geen API key nodig.", category: "MCP", installCommand: "claude mcp add context7 --scope user -- npx -y @upstash/context7-mcp", language: "TypeScript" },
  { name: "Figma MCP (Anthropic)", url: "https://github.com/anthropics/mcp-figma", description: "Design naar Code - Lees Figma bestanden, inspecteer design specs, genereer pixel-perfect UI code.", category: "MCP", installCommand: "claude mcp add figma -- npx -y @anthropic-ai/mcp-figma", language: "TypeScript" },
  { name: "Playwright MCP (Microsoft)", url: "https://github.com/executeautomation/mcp-playwright", description: "Browser automatisering - End-to-end testing over Chromium, Firefox en WebKit.", category: "MCP", installCommand: "claude mcp add playwright --scope project -- npx -y @playwright/mcp --headless", language: "TypeScript" },
  { name: "Supabase MCP", url: "https://github.com/supabase-community/supabase-mcp", description: "Backend management - SQL queries, schema migraties, auth, edge functions.", category: "MCP", installCommand: "claude mcp add supabase -- npx -y @supabase/mcp-server", language: "TypeScript" },
  { name: "Tavily MCP", url: "https://github.com/tavily-ai/tavily-mcp", description: "AI-geoptimaliseerde zoekengine met 4 tools: search, extract, crawl, map.", category: "MCP", installCommand: "claude mcp add tavily -- npx -y @tavily-ai/tavily-mcp", language: "TypeScript" },
  { name: "Alpaca MCP", url: "https://github.com/alpacahq/alpaca-mcp-server", description: "Aandelenhandel - Natural language trading van aandelen, opties en crypto.", category: "MCP", installCommand: "claude mcp add alpaca --scope user --transport stdio uvx alpaca-mcp-server", language: "Python" },
  { name: "Task Master AI", url: "https://github.com/eyaltoledano/claude-task-master", description: "Projectmanagement - Feed een PRD, krijg gestructureerde taken met dependencies.", category: "MCP", installCommand: "claude mcp add taskmaster -- npx -y @eyaltoledano/claude-task-master", language: "TypeScript" },

  // Additional MCP Servers
  { name: "Stealth Browser MCP", url: "https://github.com/vibheksoni/stealth-browser-mcp", description: "Ondetecteerbare browser automatisering.", category: "MCP", installCommand: "claude mcp add stealth-browser -- npx -y stealth-browser-mcp", language: "TypeScript" },
  { name: "FastMCP", url: "https://github.com/jlowin/fastmcp", description: "Bouw MCP servers in minimale Python code.", category: "MCP", installCommand: "pip install fastmcp", language: "Python" },
  { name: "Markdownify MCP", url: "https://github.com/zcaceres/markdownify-mcp", description: "PDFs, images, audio → Markdown conversie.", category: "MCP", installCommand: "claude mcp add markdownify -- npx -y markdownify-mcp", language: "TypeScript" },
  { name: "MCPHub", url: "https://github.com/samanhappy/mcphub", description: "Beheer meerdere MCP servers via HTTP.", category: "MCP", installCommand: "claude mcp add mcphub -- npx -y mcphub", language: "TypeScript" },
  { name: "Excel MCP Server", url: "https://github.com/haris-musa/excel-mcp-server", description: "Manipuleer Excel bestanden zonder Microsoft Excel.", category: "MCP", installCommand: "claude mcp add excel -- npx -y excel-mcp-server", language: "TypeScript" },
  { name: "Codebase Memory MCP", url: "https://github.com/DeusData/codebase-memory-mcp", description: "Persistente kennisgraaf voor codebases.", category: "MCP", installCommand: "claude mcp add codebase-memory -- npx -y codebase-memory-mcp", language: "TypeScript" },

  // === TOOLS / PLUGINS (from Ch8) ===
  { name: "Graphify", url: "https://github.com/safishamsi/graphify", description: "Token Reductie Kennisgraaf - Zet elke map om in een visuele kennisgraaf. 71x minder tokens per query.", category: "TOOL", installCommand: "pip install graphifyy && graphify install", language: "Python" },

  // Agent Frameworks & Orchestratie (Ch8)
  { name: "OpenClaw", url: "https://github.com/openclaw/openclaw", description: "De virale AI agent. 210K+ stars.", category: "TOOL", installCommand: "git clone https://github.com/openclaw/openclaw", language: "Python" },
  { name: "AutoGPT", url: "https://github.com/Significant-Gravitas/AutoGPT", description: "Agent platform voor langlopende taken.", category: "TOOL", installCommand: "git clone https://github.com/Significant-Gravitas/AutoGPT", language: "Python" },
  { name: "LangGraph", url: "https://github.com/langchain-ai/langgraph", description: "Agents als grafen - Multi-agent orchestratie.", category: "TOOL", installCommand: "pip install langgraph", language: "Python" },
  { name: "CrewAI", url: "https://github.com/crewAIInc/crewAI", description: "Multi-agent framework met rollen, doelen, backstories.", category: "TOOL", installCommand: "pip install crewai", language: "Python" },
  { name: "Dify", url: "https://github.com/langgenius/dify", description: "Open-source LLM app builder.", category: "TOOL", installCommand: "git clone https://github.com/langgenius/dify", language: "Python" },
];

async function main() {
  // Get admin user
  const admin = await prisma.user.findFirst();
  if (!admin) throw new Error('No user found in DB');
  console.log(`Using admin: ${admin.email} (${admin.id})`);
  console.log(`Seeding ${repos.length} repos...`);
  let created = 0, skipped = 0;
  
  for (const repo of repos) {
    try {
      await prisma.gitHubRepo.upsert({
        where: { url: repo.url },
        update: {
          name: repo.name,
          description: repo.description,
          category: repo.category,
          installCommand: repo.installCommand,
          language: repo.language,
        },
        create: {
          name: repo.name,
          url: repo.url,
          description: repo.description,
          category: repo.category,
          installCommand: repo.installCommand,
          language: repo.language,
          securityStatus: "PENDING",
          addedById: admin.id,
        },
      });
      created++;
      console.log(`✓ ${repo.name}`);
    } catch (e) {
      skipped++;
      console.log(`✗ ${repo.name}: ${e.message.substring(0, 80)}`);
    }
  }
  
  console.log(`\nDone: ${created} created/updated, ${skipped} skipped`);
  const total = await prisma.gitHubRepo.count();
  console.log(`Total repos in DB: ${total}`);
  
  // Show category breakdown
  const cats = await prisma.gitHubRepo.groupBy({ by: ['category'], _count: true });
  cats.forEach(c => console.log(`  ${c.category}: ${c._count}`));
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
