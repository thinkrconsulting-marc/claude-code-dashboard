# Claude Code Skills & MCP Servers — Complete Installation Guide

> Last updated: April 2026
> This guide covers every skill and MCP server mentioned in the Claude Code ecosystem, with installation commands, descriptions, and configuration examples.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [How to Install Skills](#how-to-install-skills)
3. [Complete Skills Directory](#complete-skills-directory)
4. [How to Install MCP Servers](#how-to-install-mcp-servers)
5. [Complete MCP Servers Directory](#complete-mcp-servers-directory)
6. [How to Create Custom Skills](#how-to-create-custom-skills)
7. [How to Create Custom MCP Server Configurations](#how-to-create-custom-mcp-server-configurations)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before installing skills or MCP servers, ensure you have:

- **Node.js 18+** installed (`node --version`)
- **Claude Code CLI** installed and authenticated:
  ```bash
  # Mac/Linux
  curl -fsSL https://claude.ai/install.sh | bash
  
  # Windows
  irm https://claude.ai/install.ps1 | iex
  ```
- **Claude API access** — Pro subscription or API key from `console.anthropic.com`
- **Python 3.10+** (for some skills and tools)
- **npm/npx** available (comes with Node.js)
- **Git** installed (`git --version`)

Verify Claude Code is working:
```bash
claude --version
claude          # Launch Claude Code
```

---

## How to Install Skills

### What Are Skills?

Skills are reusable workflows that Claude invokes automatically when a task matches the skill's description. Each skill is a directory with a `SKILL.md` file (YAML frontmatter + instructions) and optional supporting files (templates, scripts, references).

### Installation Methods

#### Method 1: Install from GitHub (Most Common)
```bash
npx skills add <github-url> --skill <skill-name>
```

#### Method 2: Claude Skill Add
```bash
claude skill add <skill-name>
```

#### Method 3: Manual Clone
```bash
# Personal (all projects)
git clone <repo-url> ~/.claude/skills/<skill-name>

# Project-specific
git clone <repo-url> .claude/skills/<skill-name>
```

### Install Locations

| Location | Scope | Use When |
|----------|-------|----------|
| `~/.claude/skills/` | All projects (personal) | Skills you use everywhere |
| `.claude/skills/` | Current project only | Project-specific workflows |

### Verifying Installation

After installation, check that the skill directory exists:
```bash
ls ~/.claude/skills/          # Personal skills
ls .claude/skills/            # Project skills
```

Each skill should have at minimum a `SKILL.md` file.

---

## Complete Skills Directory

### 🔥 Top Skills by Popularity

| # | Skill | Weekly Installs | Description | Category |
|---|-------|----------------|-------------|----------|
| 1 | remotion-best-practices | 213K | Domain-specific knowledge for building videos with Remotion + React. 30+ rule files | Video/Creative |
| 2 | agent-browser | 161.2K | Fast, persistent browser automation with session continuity | Automation |
| 3 | ui-ux-pro-max | 102.4K | 50+ styles, 161 color palettes, 57 font pairings, 99 UX guidelines across 10 tech stacks | Design |
| 4 | seo-audit | 68.1K | Comprehensive SEO auditing — crawlability, indexation, speed, on-page optimization | Marketing |
| 5 | mcp-builder | 33.3K | Official Anthropic guide for building MCP servers. Four-phase workflow | Development |
| 6 | firecrawl | 25.6K | Web scraping, search, crawling with LLM-optimized markdown output | Data |
| 7 | ad-creative | 23.6K | Generate high-performing ad creative across Google, Meta, LinkedIn, TikTok, X | Marketing |
| 8 | grill-me | 17.6K | Relentless interviewing skill that stress-tests plans, designs, ideas | Productivity |
| 9 | gws-gmail | 15.6K | Send, read, manage Gmail from Claude Code | Productivity |
| 10 | humanizer | 573 | Detects 24 AI-writing patterns and rewrites them naturally | Writing |

### Installation Commands — Top Skills

```bash
# 1. Remotion Best Practices (213K installs/wk)
npx skills add https://github.com/remotion-dev/skills --skill remotion-best-practices

# 2. Agent Browser (161.2K installs/wk)
npx skills add https://github.com/vercel-labs/agent-browser --skill agent-browser

# 3. UI/UX Pro Max (102.4K installs/wk)
npx skills add https://github.com/nextlevelbuilder/ui-ux-pro-max-skill --skill ui-ux-pro-max

# 4. SEO Audit (68.1K installs/wk)
npx skills add https://github.com/coreyhaines31/marketingskills --skill seo-audit

# 5. MCP Builder — Official Anthropic (33.3K installs/wk)
npx skills add https://github.com/anthropics/skills --skill mcp-builder

# 6. Firecrawl (25.6K installs/wk)
npx skills add https://github.com/firecrawl/cli --skill firecrawl

# 7. Ad Creative (23.6K installs/wk)
npx skills add https://github.com/coreyhaines31/marketingskills --skill ad-creative

# 8. Grill Me (17.6K installs/wk)
npx skills add https://github.com/mattpocock/skills --skill grill-me

# 9. Google Workspace Gmail (15.6K installs/wk)
npx skills add https://github.com/googleworkspace/cli --skill gws-gmail

# 10. Humanizer (573 installs/wk)
npx skills add https://github.com/softaworks/agent-toolkit --skill humanizer
```

---

### 📄 Official Anthropic Skills (Document & Office)

| Skill | Description | Installation |
|-------|-------------|-------------|
| PDF Processing | Read, extract tables, fill forms, merge/split PDFs | `npx skills add https://github.com/anthropics/skills --skill pdf` |
| DOCX | Create & edit Word docs with tracked changes | `npx skills add https://github.com/anthropics/skills --skill docx` |
| PPTX | Build slide decks from natural language | `npx skills add https://github.com/anthropics/skills --skill pptx` |
| XLSX | Formulas, analysis, charts via plain English | `npx skills add https://github.com/anthropics/skills --skill xlsx` |
| Doc Co-Authoring | Real collaborative writing | `npx skills add https://github.com/anthropics/skills --skill doc-coauthoring` |
| Skill Creator | Meta-skill: describe workflow, get SKILL.md in 5 min | `npx skills add https://github.com/anthropics/skills --skill skill-creator` |

**GitHub**: https://github.com/anthropics/skills

---

### 🎨 Design & Creative Skills

| Skill | Description | Installation |
|-------|-------------|-------------|
| Frontend Design | Escape "AI slop" aesthetics. 277K+ installs | `npx skills add https://github.com/anthropics/skills --skill frontend-design` |
| Canvas Design | Social graphics, posters, covers | `npx skills add https://github.com/anthropics/skills --skill canvas-design` |
| Algorithmic Art | Fractal patterns, geometric compositions via p5.js | `npx skills add https://github.com/anthropics/skills --skill algorithmic-art` |
| Theme Factory | Batch-generate color schemes | `npx skills add https://github.com/anthropics/skills --skill theme-factory` |
| Web Artifacts Builder | Calculators, dashboards via natural language | `npx skills add https://github.com/anthropics/skills --skill web-artifacts-builder` |
| Brand Guidelines | Encode your brand into a skill | `npx skills add https://github.com/anthropics/skills --skill brand-guidelines` |
| UI/UX Pro | Interaction design, UX patterns, accessibility | `claude skill add ui-ux-pro` |
| 21stDev | Modern component libraries, startup-style UI | `claude skill add 21stdev` |

---

### 💻 Development & Engineering Skills

| Skill | Description | Installation |
|-------|-------------|-------------|
| Superpowers | 20+ battle-tested skills: TDD, debugging, plan-to-execute. 96K+ stars | `npx skills add https://github.com/obra/superpowers --skill superpowers` |
| Systematic Debugging | Root cause analysis first, fix second. 4-phase methodology | `npx skills add https://github.com/obra/superpowers --skill systematic-debugging` |
| File Search | Ripgrep + ast-grep mastery | `npx skills add https://github.com/massgen/massgen --skill file-search` |
| Context Optimization | Reduce token costs, KV-cache tricks | `npx skills add https://github.com/muratcankoylan/agent-skills-for-context-engineering --skill context-optimization` |
| Deep Research | 8-phase research with auto-continuation | `npx skills add https://github.com/199-biotechnologies/claude-deep-research-skill --skill deep-research` |
| TDD Guard | Enforces test-first for AI agents | GitHub: https://github.com/nizos/tdd-guard |

---

### 📈 Marketing & SEO Skills

| Skill | Description | Installation |
|-------|-------------|-------------|
| Marketing Skills (Corey Haines) | 20+ skills: CRO, copywriting, SEO, email, growth | `npx skills add https://github.com/coreyhaines31/marketingskills --skill <name>` |
| Claude SEO | Full-site audits, schema validation. 12 sub-skills | `npx skills add https://github.com/AgriciDaniel/claude-seo --skill claude-seo` |
| GO VIRAL BRO | Trainable content pipeline. 7 slash commands | See install below |

**GO VIRAL BRO Installation:**
```bash
git clone https://github.com/charlesdove977/goviralbro.git
cd goviralbro
bash scripts/init-viral-command.sh
```
Requires: Claude Code, Python 3.10+, Node.js 18+, YouTube API key.
Slash commands: `/viral:setup`, `/viral:onboard`, `/viral:discover`, `/viral:angle`, `/viral:script`, `/viral:analyze`, `/viral:update-brain`

---

### 📊 Finance & Trading Skills

| Skill | Description | Source |
|-------|-------------|--------|
| Sector Analyst | Fetch and interpret sector/market data | https://github.com/tradermonty/claude-trading-skills |
| Technical Analyst | Technical analysis, trend identification | https://github.com/tradermonty/claude-trading-skills |
| Market News Analyst | Market news assessment, macro environment | https://github.com/tradermonty/claude-trading-skills |
| Backtest Expert | Professional backtesting framework (slippage, costs, bias) | https://github.com/tradermonty/claude-trading-skills |
| K-Dense AI Scientific Skills | Time series (ARIMA, GARCH), ML for finance (PyTorch, scikit-learn) | Snyk article reference |

```bash
# Install trading skills collection
npx skills add https://github.com/tradermonty/claude-trading-skills --skill sector-analyst
npx skills add https://github.com/tradermonty/claude-trading-skills --skill technical-analyst
npx skills add https://github.com/tradermonty/claude-trading-skills --skill backtest-expert
```

---

### 📚 Knowledge & Learning Skills

| Skill | Description | Installation |
|-------|-------------|-------------|
| NotebookLM Integration | Claude + NotebookLM bridge. Summaries, mind maps, flashcards | `npx skills add https://github.com/PleasePrompto/notebooklm-skill --skill notebooklm` |
| Obsidian Skills | By Obsidian's CEO. Auto-tagging, auto-linking, vault-native | `npx skills add https://github.com/kepano/obsidian-skills --skill obsidian` |
| Wiki-Brain | Graphify + Obsidian integration (done-for-you) | `git clone https://github.com/tenfoldmarc/wiki-brain-skill ~/.claude/skills/wiki-brain` |
| Graphify | Knowledge graph for token reduction (71x fewer tokens) | `pip install graphifyy && graphify install` |

---

### 🔧 Miscellaneous Skills

| Skill | Description | GitHub |
|-------|-------------|--------|
| Humanise Writing | Rewrite AI-sounding text naturally | https://github.com/blader/humanizer |
| Awesome Claude Skills | Curated skill list (22K+ stars) | https://github.com/travisvn/awesome-claude-skills |
| Banana Claude | Content pipeline | https://github.com/AgriciDaniel/banana-claude |
| OpenClaw/Vibe Code | Community skills | https://github.com/VoltAgent/awesome-openclaw-skills |
| Context Engineering Intro | Reduce token usage patterns | https://github.com/coleam00/context-engineering-intro |

---

### 🌐 Skill Directories (Browse & Search)

| Directory | Skills Count | URL |
|-----------|-------------|-----|
| skills.sh | 91,608+ | https://skills.sh |
| skillsmp.com | 80,000+ | https://skillsmp.com |
| aitmpl.com/skills | Templates | https://aitmpl.com/skills |
| skillhub.club | 31,000+ | https://skillhub.club |
| agentskills.io | Official spec | https://agentskills.io |
| Anthropic Official | Reference implementations | https://github.com/anthropics/skills |
| Awesome Claude Skills | Curated list | https://github.com/anthropics/awesome-skills |

---

## How to Install MCP Servers

### What Are MCP Servers?

MCP (Model Context Protocol) servers give Claude Code access to external services — GitHub, Figma, databases, search engines, browsers, and more. Skills teach Claude *how* to do things; MCP servers give Claude *access* to the outside world.

### Installation Syntax

```bash
# Add an MCP server (stdio transport — most common)
claude mcp add <server-name> -- <command-to-run-server>

# Add with scope (user = all projects, project = current only)
claude mcp add <server-name> --scope user -- <command>
claude mcp add <server-name> --scope project -- <command>

# Add with HTTP transport
claude mcp add --transport http <server-name> <server-url>

# List connected servers
claude mcp list
# Or inside Claude Code:
/mcp

# Remove a server
claude mcp remove <server-name>
```

### Scoping Best Practices

| Scope | Use When |
|-------|----------|
| `--scope user` | Lightweight, always-useful servers (Context7) |
| `--scope project` | Heavy or project-specific servers (Playwright, Supabase) |

**Pro tip**: Each connected MCP server adds to your token context. Only enable what you actively need. Start with 2-3 servers.

---

## Complete MCP Servers Directory

### 🏆 Must-Have MCP Servers

#### 1. Context7 (by Upstash) — Documentation Server
Up-to-date, version-specific documentation for 50+ frameworks. No API key required. 230,000+ installs.

```bash
claude mcp add context7 --scope user -- npx -y @upstash/context7-mcp
```

**Usage in prompts**: Add `use context7` to automatically pull current docs.
**Supports**: React, Next.js, Tailwind CSS, Prisma, Supabase, MongoDB, and thousands more.

**GitHub**: https://github.com/upstash/context7

---

#### 2. Figma MCP (by Anthropic) — Design to Code
Read Figma files directly, inspect design specs, generate pixel-perfect UI code.

```bash
# Option 1: npx
claude mcp add figma -- npx -y @anthropic-ai/mcp-figma

# Option 2: HTTP transport
claude mcp add --scope user --transport http figma https://mcp.figma.com/mcp
```

Requires Figma desktop app for OAuth authentication.

**GitHub**: https://github.com/anthropics/mcp-figma

---

#### 3. Playwright MCP (by Microsoft) — Browser Automation
End-to-end testing across Chromium, Firefox, and WebKit.

```bash
claude mcp add playwright --scope project -- npx -y @playwright/mcp --headless
```

**Key tools**: `browser_snapshot`, screenshot capture, test recording, codegen.

**GitHub**: https://github.com/executeautomation/mcp-playwright

---

#### 4. Supabase MCP — Backend Management
Full backend management: SQL queries, schema migrations, auth, edge functions.

```bash
claude mcp add supabase -- npx -y @supabase/mcp-server
```

Requires Supabase API token.

**GitHub**: https://github.com/supabase-community/supabase-mcp

---

#### 5. Tavily MCP — AI-Optimized Search
Search engine built for AI agents. Clean structured data, not blue links. Four tools: search, extract, crawl, map.

**GitHub**: https://github.com/tavily-ai/tavily-mcp

---

#### 6. Alpaca MCP — Stock Trading
Official Alpaca server for natural language trading of stocks, options, and crypto. Place orders, manage positions, access real-time market data.

```bash
claude mcp add alpaca --scope user --transport stdio uvx alpaca-mcp-server \
  --env ALPACA_API_KEY=your_paper_api_key \
  --env ALPACA_SECRET_KEY=your_paper_secret_key
```

**Example commands after connecting**:
- "What is my current buying power on Alpaca?"
- "Place a market order to buy 5 shares of AAPL"

**GitHub**: https://github.com/alpacahq/alpaca-mcp-server

---

#### 7. Task Master AI — Project Management
Feed a PRD → get structured tasks with dependencies → Claude executes one by one. Works across Cursor, Claude Code, Windsurf.

**GitHub**: https://github.com/eyaltoledano/claude-task-master

---

### 📦 Additional MCP Servers

| Server | Description | Installation / GitHub |
|--------|-------------|---------------------|
| GitHub MCP | GitHub integration (PRs, issues, repos) | Built-in or via `claude mcp add github` |
| Filesystem MCP | Read/write local files | Often included by default |
| Sequential Thinking | Step-by-step reasoning server | Community MCP |
| Stealth Browser | Undetectable browser automation | https://github.com/vibheksoni/stealth-browser-mcp |
| FastMCP | Build MCP servers in minimal Python | https://github.com/jlowin/fastmcp |
| Markdownify MCP | PDFs, images, audio → Markdown | https://github.com/zcaceres/markdownify-mcp |
| MCPHub | Manage multiple MCP servers via HTTP | https://github.com/samanhappy/mcphub |
| Excel MCP Server | Manipulate Excel without Microsoft Excel | https://github.com/haris-musa/excel-mcp-server |
| Codebase Memory MCP | Persistent knowledge graph for codebases | https://github.com/DeusData/codebase-memory-mcp |
| Daloopa | Institutional-grade financial data | MCP connector |
| Carbon Arc | Market intelligence | MCP connector |

---

### 🔗 MCP Workflow Pipeline

A powerful pattern chains MCP servers together:

```
Figma → Frontend Design → Context7 → Supabase → Playwright
  │          │               │           │           │
  ▼          ▼               ▼           ▼           ▼
Extract    Build           Use correct  Connect    Test
design     polished        APIs         backend    everything
specs      UI
```

---

## How to Create Custom Skills

### Step 1: Create the Directory

```bash
# For personal use (all projects)
mkdir -p ~/.claude/skills/my-custom-skill

# For project-specific use
mkdir -p .claude/skills/my-custom-skill
```

### Step 2: Create SKILL.md

The `SKILL.md` file is the heart of every skill. It uses YAML frontmatter + markdown instructions.

```markdown
---
name: my-custom-skill
description: Brief description of what this skill does. Claude uses this to decide when to invoke it automatically.
allowed-tools: Read, Grep, Glob, Write, Bash
---

# My Custom Skill

## When to Use
- Describe the situations when this skill should activate

## Steps
1. First step of the workflow
2. Second step
3. Third step

## Output Format
Describe expected output format

## Examples
Show example inputs and outputs

## References
@REFERENCE_FILE.md for additional context
```

### Step 3: Add Supporting Files (Optional)

```
.claude/skills/my-custom-skill/
  SKILL.md                    # Required — main skill file
  DETAILED_GUIDE.md           # Optional — referenced by SKILL.md
  templates/                  # Optional — template files
    output-template.md
  checklists/                 # Optional — quality checklists
    review-checklist.md
```

### Step 4: Test the Skill

Start a new Claude Code session and give it a task that matches the skill's description. Claude should automatically invoke the skill.

### Example: Security Review Skill

```markdown
---
name: security-review
description: Comprehensive security audit. Use when reviewing code for vulnerabilities, before deployments, or when the user mentions security.
allowed-tools: Read, Grep, Glob
---

# Analyze the codebase for security vulnerabilities:

## SQL injection and XSS risks
- Check all database queries for parameterization
- Check all rendered output for proper escaping
- Look for innerHTML or dangerouslySetInnerHTML usage

## Exposed credentials or secrets
- Scan for hardcoded API keys, passwords, tokens
- Check that .env files are in .gitignore
- Look for secrets in commit history

## Authentication and authorization gaps
- Verify all protected routes have auth middleware
- Check for broken access control
- Look for missing rate limiting on auth endpoints

## Input validation
- Verify all user input is validated before use
- Check file upload handling for type and size validation

Report findings with severity ratings (Critical, High, Medium, Low) and specific remediation steps.

Reference @DETAILED_GUIDE.md for internal security standards.
```

### Skill vs. Rules — When to Use Which

| Feature | Rules (`.claude/rules/`) | Skills (`.claude/skills/`) |
|---------|-------------------------|---------------------------|
| Activation | Passive — loaded based on file paths | Active — Claude invokes when task matches |
| Purpose | Configuration, conventions, constraints | Workflows, procedures, multi-step processes |
| Scope | File-path scoped or always-on | Task-type scoped |
| Complexity | Simple instructions | Complex workflows with templates |

---

## How to Create Custom MCP Server Configurations

### Method 1: Add via CLI

```bash
# stdio transport (runs a local process)
claude mcp add my-server -- node /path/to/my-server.js

# HTTP transport (connects to a URL)
claude mcp add --transport http my-server https://my-server.example.com/mcp

# With environment variables
claude mcp add my-server --env API_KEY=xxx --env SECRET=yyy -- npx my-mcp-server
```

### Method 2: Edit settings.json Directly

Add MCP server configuration to `.claude/settings.json`:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "npx",
      "args": ["-y", "my-mcp-server"],
      "env": {
        "API_KEY": "your-api-key"
      }
    },
    "remote-server": {
      "transport": "http",
      "url": "https://my-server.example.com/mcp"
    }
  }
}
```

### Method 3: Build a Custom MCP Server

Use the FastMCP library for minimal Python MCP servers:

```bash
pip install fastmcp
```

```python
# my_server.py
from fastmcp import FastMCP

mcp = FastMCP("My Custom Server")

@mcp.tool()
def search_database(query: str) -> str:
    """Search the project database for relevant records."""
    # Your logic here
    return f"Results for: {query}"

@mcp.tool()
def get_metrics(metric_name: str) -> dict:
    """Get project metrics by name."""
    # Your logic here
    return {"metric": metric_name, "value": 42}

if __name__ == "__main__":
    mcp.run()
```

Then register it:
```bash
claude mcp add my-custom-server -- python /path/to/my_server.py
```

Use the official **MCP Builder** skill for a guided experience:
```bash
npx skills add https://github.com/anthropics/skills --skill mcp-builder
```

---

## Troubleshooting

### Common Installation Issues

#### "npx skills add" fails
```bash
# Ensure npm/npx is up to date
npm install -g npm@latest

# Try with verbose output
npx skills add <url> --skill <name> --verbose

# Manual alternative: clone directly
git clone <repo-url> ~/.claude/skills/<skill-name>
```

#### MCP Server Not Connecting
```bash
# Check if server is listed
claude mcp list

# Remove and re-add
claude mcp remove <server-name>
claude mcp add <server-name> -- <command>

# Check server health inside Claude Code
/mcp
```

#### Skills Not Activating
- Verify the `SKILL.md` file exists in the correct directory
- Check that the `description` field in YAML frontmatter accurately describes when to trigger
- Restart the Claude Code session (skills load at session start)
- Check `~/.claude/skills/` (personal) or `.claude/skills/` (project)

#### Hooks Not Firing
- Hooks do NOT hot-reload — restart the session after changes
- Ensure hook scripts are executable: `chmod +x .claude/hooks/your-hook.sh`
- Verify exit codes: `0` = success, `1` = error (non-blocking), `2` = BLOCK
- Check `settings.json` has correct matcher and path

#### Token Usage Too High
- Disable unused MCP servers (each adds to context)
- Install heavy servers with `--scope project` (not global)
- Use `/compact` to compress context when running low
- Consider Graphify for large codebases: `pip install graphifyy && graphify install`

#### Claude Code Doctor
Run the built-in diagnostic tool:
```bash
/doctor
```
This checks your setup for common configuration issues.

### Getting Help

- **Official docs**: https://docs.claude.com
- **MCP server docs**: https://code.claude.com/docs/en/mcp
- **Plugin explorer**: https://claude.com/plugins
- **Community — CC Strategic AI**: https://www.skool.com/cc-strategic-ai/about
- **Community — Zero to AI**: https://skool.com/zero-to-ai-9192
- **GitHub Issues**: Check the specific repo's issues page for known problems

---

*End of Skills & MCP Installation Guide*
