**Claude Code
De Uitgebreide Gids**
Alles wat je moet weten over Claude Code —
Installatie, Configuratie, Skills, MCP, Workflows & Meer

April 2026 — Versie 1.0

# Hoofdstuk 1: Introductie tot Claude Code
## Wat is Claude Code
Claude Code is een krachtige, agentische AI-tool ontwikkeld door Anthropic die direct in je terminal of VS Code werkt. Het is geen gewone code-assistent — het is een volwaardige AI-agent die je codebase kan lezen, schrijven, testen, debuggen en deployen. Claude Code draait lokaal op je machine, heeft toegang tot je bestandssysteem, en kan complexe taken autonoom uitvoeren zonder constante begeleiding.
Sinds de lancering is Claude Code uitgegroeid tot een belangrijk onderdeel van het ontwikkelingslandschap. In april 2026 is Claude Code verantwoordelijk voor ongeveer 4% van alle publieke GitHub-commits, met een verwachte groei naar 20% tegen het einde van het jaar. Anthropic heeft 74 productreleases uitgebracht in slechts 52 dagen, en de omzet is gestegen van $9 miljard naar $19 miljard in drie maanden.
Claude Code is beschikbaar als drie producten: Chat (waar je denkt), Cowork (waar je produceert), en Code (waar je automatiseert). Deze gids richt zich voornamelijk op Claude Code (de terminal/agentische tool), maar behandelt ook de integratie met Chat en Cowork.
## Waarom Claude Code gebruiken
- Agentische werking: Claude Code plant, voert uit en verifieert zelf — je hoeft niet elke stap te begeleiden
- Diepe codebase-integratie: leest je hele project, begrijpt architectuur en conventies
- Skills & MCP: uitbreidbaar met duizenden skills en externe service-koppelingen
- Multi-model: Opus 4.6 (1M tokens context), Sonnet 4.6, Haiku 4.5 — kies het juiste model per taak
- Hooks systeem: deterministische controle — formattering, tests en beveiliging worden 100% van de tijd uitgevoerd
- VS Code integratie: werkt naadloos in je favoriete editor
- Subagents: delegeer taken naar parallelle AI-workers voor snellere output
- Kostenefficiënt: combineer met lokale modellen (Ollama) voor 80-90% kostenbesparing
## Verschil met andere AI coding tools

| **Kenmerk** | **Claude Code** | **Andere AI Tools** |
| --- | --- | --- |
| Werkmodus | Agentisch — plant en voert autonoom uit | Reactief — wacht op elke instructie |
| Context | Tot 1M tokens (Opus 4.6) | Meestal 8K-128K tokens |
| Bestandstoegang | Volledige lees/schrijf toegang tot je project | Beperkt tot geselecteerde bestanden |
| Uitbreidbaarheid | Skills, MCP servers, Hooks, Plugins | Beperkte plugin-ecosystemen |
| Configuratie | CLAUDE.md, .claude/ map, rules, agents | Minimale configuratie-opties |
| Subagents | Parallelle agents voor complexe taken | Meestal single-thread |
| Beveiliging | Allow/deny lijsten, hooks, permission systeem | Basisrechten |
| Kosten | Dual-engine met lokale modellen mogelijk | Alleen cloud-modellen |

# Hoofdstuk 2: Installatie & Setup
## Systeemvereisten
- Node.js 18+ geïnstalleerd
- Claude Code CLI geïnstalleerd
- Claude API-toegang (Pro-abonnement of API-sleutel)
- Terminal / command line toegang
- Python 3.10+ (voor sommige skills en tools)
- Git geïnstalleerd
## Installatie op Mac
De primaire installatiemethode is via een curl-script in je terminal:
```
curl -fsSL https://claude.ai/install.sh | bash
```
(Optioneel) Fix PATH als het commando niet gevonden wordt:
```
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrcsource ~/.zshrc
```
Start Claude Code:
```
claude
```
Log in met je Claude-account.
## Installatie op Windows
Installatie via een PowerShell-script:
```
irm https://claude.ai/install.ps1 | iex
```
Start Claude Code:
```
claude
```
## Installatie op Linux
```
curl -fsSL https://claude.ai/install.sh | sh
```
## Alternatieve installatie via npm
```
npm install -g @anthropic-ai/claude-code
```
## VS Code Extensie Installatie
1. Open VS Code
2. Ga naar Extensions (Ctrl+Shift+X)
3. Zoek naar "Claude Code"
4. Klik op Install
5. Klik op het Claude-icoon in de zijbalk om te beginnen
💡 Dit is de makkelijkste manier om te beginnen — geen terminal-ervaring nodig.
## API Key Configuratie
Voor programmatisch gebruik heb je een API-sleutel nodig:
1. Ga naar console.anthropic.com
2. Maak een gratis account aan of log in
3. Genereer een API-sleutel
4. Gebruik claude-3.5-sonnet (of nieuwer) voor de beste balans van snelheid en kwaliteit
Python Quick Start:
```
import anthropicclient = anthropic.Anthropic(api_key="YOUR_KEY")response = client.messages.create(    model="claude-sonnet-4-6",    max_tokens=1024,    messages=[{        "role": "user",        "content": "your prompt"    }])print(response.content)
```
## Eerste Configuratie Stappen
Na installatie, volg deze stappen om optimaal te beginnen:
1. Start Claude Code in je projectmap: cd mijn-project && claude
2. Voer /init uit — dit genereert een starter CLAUDE.md door je project te scannen
3. Bewerk de gegenereerde CLAUDE.md — houd het onder 50-200 regels
4. Maak .claude/settings.json aan — voeg allow en deny lijsten toe
5. Test met een eenvoudige taak: "lees de codebase en geef een samenvatting"
6. Overweeg /doctor uit te voeren om je setup te controleren

# Hoofdstuk 3: De .claude/ Map & Configuratie
## Twee Mappen die je Moet Kennen
Claude Code gebruikt twee configuratiemappen:
1. Project-niveau: .claude/ in je projectroot — teamconfiguratie, gecommit naar git
2. Persoonlijk: ~/.claude/ in je home-directory — persoonlijke configuratie, nooit gecommit
Wanneer Claude start, leest het beide mappen. Project-niveau bestanden hebben prioriteit voor projectspecifieke zaken; persoonlijke globale bestanden vullen de rest aan.
## Mapstructuur Uitleg
```
your-project/  CLAUDE.md                    # Team instructies (gecommit naar git)  CLAUDE.local.md              # Persoonlijke overrides (gitignored)  .claude/    settings.json              # Permissies, hooks, config (gecommit)    settings.local.json        # Persoonlijke permissie-overrides (gitignored)    hooks/                     # Hook scripts (referentie vanuit settings.json)      bash-firewall.sh         # PreToolUse: blokkeer gevaarlijke commando's      auto-format.sh           # PostToolUse: formatteer bestanden na edits      enforce-tests.sh         # Stop: zorg dat tests slagen voor afronding    rules/                     # Modulaire instructiebestanden      code-style.md            # Altijd geladen      testing.md               # Altijd geladen      api-conventions.md       # Alleen voor API bestanden (path-scoped)      frontend-rules.md        # Alleen voor component bestanden      security.md              # Altijd geladen    skills/                    # Auto-geactiveerde workflows      security-review/        SKILL.md        DETAILED_GUIDE.md      deploy/        SKILL.md        templates/          release-notes.md    agents/                    # Gespecialiseerde subagent persona's      code-reviewer.md      security-auditor.md      test-writer.md~/.claude/  CLAUDE.md                    # Globale instructies (alle projecten)  settings.json                # Globale settings + hooks  skills/                      # Persoonlijke skills (alle projecten)  agents/                      # Persoonlijke agents (alle projecten)  projects/                    # Sessiegeschiedenis + auto-memory
```
## settings.json Configuratie
Het settings.json bestand bevat permissies, hooks en kernconfiguatie. Hier is een compleet voorbeeld:
```
{  "$schema": "https://json.schemastore.org/claude-code-settings.json",  "permissions": {    "allow": [      "Bash(npm run *)",      "Bash(git status)",      "Bash(git diff *)",      "Bash(git log *)",      "Read",      "Write",      "Edit",      "Glob",      "Grep"    ],    "deny": [      "Bash(rm -rf *)",      "Bash(curl *)",      "Bash(wget *)",      "Bash(git push *)",      "Bash(git checkout main)",      "Bash(docker rm *)",      "Read(./.env)",      "Read(./.env.*)",      "Read(./secrets/)"    ]  }}
```
## Permissions Systeem
Het allow/deny systeem werkt als volgt:


| **Categorie** | **Wat het doet** | **Voorbeeld** |
| --- | --- | --- |
| Allow lijst | Veilige operaties die Claude direct mag uitvoeren | Bash(npm run *), Read, Write |
| Deny lijst | Harde muur — volledig geblokkeerd | Bash(rm -rf *), Read(./.env) |
| Middenweg | Alles niet op een lijst — Claude vraagt toestemming | Onbekende commando's |

## rules/ Map en Hoe Regels te Maken
Elk markdown-bestand in .claude/rules/ wordt automatisch geladen naast CLAUDE.md. Gebruik dit om instructies op te splitsen per onderwerp.
Voorbeeld testing.md:
```
# Testing StandardsElke handler moet minstens één happy-path test en één error-path test hebbenGebruik factories (src/test/factories/) voor testdata, nooit hardcoded waardenTests draaien tegen een echte lokale database, niet mocksAltijd de DB resetten voor elke test suite met beforeAll(() => resetTestDB())Integratietests in tests/integration/, unit tests naast het bestand dat ze testenTest bestandsnaam: [filename].test.ts
```
Voorbeeld path-scoped frontend-rules.md:
```
---paths:  - "src/components/**/*.tsx"  - "src/pages/**/*.tsx"---# Frontend Rules- Gebruik functionele componenten met hooks, nooit class componenten- Gebruik Tailwind utility classes voor styling, vermijd custom CSS bestanden- Alle componenten moeten expliciete TypeScript props interfaces hebben
```
💡 Regels zonder een paths veld worden altijd geladen, ongeacht welk bestand actief is.
## Praktische Voorbeelden
Security rules voorbeeld (.claude/rules/security.md):
```
# Security RulesNooit gevoelige data loggen (tokens, wachtwoorden, PII)Alle gebruikersinput moet gevalideerd worden met zod voor gebruikSQL queries alleen via Prisma, nooit ruwe SQL stringsNooit stack traces tonen in API responsesRate limiting is verplicht op alle publieke endpointsAuthenticatie middleware moet toegepast worden op alle niet-publieke routesBestandsuploads moeten MIME type en grootte validerenNooit secrets in code opslaan, altijd environment variables gebruiken
```
# Hoofdstuk 4: Het CLAUDE.md Bestand
## Wat is CLAUDE.md en Waarom is het Belangrijk
CLAUDE.md staat in je project root (niet in de .claude map, maar op het hoogste niveau van je repo). Wanneer Claude Code start, laadt het dit bestand direct in de system prompt en houdt het in context gedurende het hele gesprek. Wat je schrijft in CLAUDE.md, daar houdt Claude zich aan.
Dit is geen suggestiebus — dit is een instructiehandleiding. Claude behandelt het als de gezaghebbende bron van waarheid voor hoe je project werkt. Je kunt ook een CLAUDE.md in subdirectories plaatsen voor map-specifieke regels — Claude leest ze allemaal en combineert ze.
## Hoe CLAUDE.md te Maken
Voer /init uit binnen Claude Code — het genereert een starter CLAUDE.md door je project te lezen. Bewerk het daarna tot de essenties.
## Structuur en Best Practices
Een effectief CLAUDE.md bevat:
### Build, Test en Lint Commando's
De exacte commando's om je project te draaien. Niet een link naar een README. De echte commando's:
```
npm run dev       # Start dev server (poort 3000)npm run test      # Run tests (Jest, heeft lokale DB nodig)npm run lint      # ESLint + Prettiernpm run build     # Productie build naar dist/npm run db:test:reset  # Reset test database (draai voor tests)
```
### Architectuurbeslissingen
De grote structurele keuzes die niet voor de hand liggen uit de code:
- "We gebruiken een monorepo met Turborepo."
- "Alle API routes staan in src/handlers/."
- "Gedeelde types staan in src/types/."
- "We gebruiken Prisma als ORM, geen ruwe SQL."
### Niet-Voor-de-Hand-Liggende Valkuilen
- "TypeScript strict mode staat aan, ongebruikte variabelen zijn errors."
- "Tests gebruiken een echte lokale database, geen mocks. Draai npm run db:test:reset eerst."
- "De CI pipeline faalt als een bestand meer dan 300 regels heeft."
### Conventies
- "Gebruik zod voor request validatie in elke handler."
- "Return shape is altijd { data, error }."
- "Toon nooit stack traces aan de client."
- "Prefereer named exports boven default exports."
## Wat NIET in CLAUDE.md Hoort
- Alles wat al in een linter of formatter config staat (.eslintrc, .prettierrc)
- Volledige documentatie — plak geen 50-pagina architectuurdocument
- Lange paragrafen met theorie of filosofie
- Alles boven 200 regels — instructie-naleving daalt bij te lange bestanden
## CLAUDE.md Best Practices
- Sweet spot is onder 200 regels, idealiter rond 50
- Houd het op 200-500 regels voor complexe projecten; zet de belangrijkste instructies vooraan
- Claude heeft primacy bias — wat eerst komt, weegt het zwaarst
- Update je CLAUDE.md wanneer Claude een fout herhaalt — voeg een regel toe bovenaan
- Een gefocust 50-regelig bestand werkt beter dan een uitgebreid 400-regelig bestand
## CLAUDE.local.md — Persoonlijke Overrides
Maak een CLAUDE.local.md in je project root. Claude leest het naast de hoofd-CLAUDE.md, en het wordt automatisch ge-gitignored.
```
# Persoonlijke voorkeurenLeg altijd je redenering uit voor het maken van wijzigingenToon een diff-samenvatting voor het schrijven naar een bestandBij het schrijven van tests, begin met de edge casesIk geef de voorkeur aan uitgebreide variabelenamen
```
## Globale ~/.claude/CLAUDE.md
Globale instructies die gelden voor alle projecten:
```
# Globale voorkeurenIk geef de voorkeur aan functionele patronen boven class-gebaseerdSchrijf altijd TypeScript types voor het implementeren van functiesBij het suggereren van imports, prefereer named imports boven default importsIk gebruik VS Code met Vim keybindingsBij het uitleggen van code, begin met het "waarom" voor het "hoe"Ik prefereer expliciet boven impliciet, zelfs als het meer code betekent
```
## Voorbeelden van Uitstekende CLAUDE.md Bestanden
### Boris Cherny's CLAUDE.md (Workflow Orchestratie)
Dit is een van de meest gerespecteerde CLAUDE.md-voorbeelden in de community:
```
## Workflow Orchestration### 1. Plan Node Default- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)- If something goes sideways, STOP and re-plan immediately- Use plan mode for verification steps, not just building- Write detailed specs upfront to reduce ambiguity### 2. Subagent Strategy- Use subagents liberally to keep main context window clean- Offload research, exploration, and parallel analysis to subagents- For complex problems, throw more compute at it via subagents- One task per subagent for focused execution### 3. Self-Improvement Loop- After ANY correction from the user: update tasks/lessons.md- Write rules for yourself that prevent the same mistake- Ruthlessly iterate on these lessons until mistake rate drops### 4. Verification Before Done- Never mark a task complete without proving it works- Diff behavior between main and your changes- Ask yourself: "Would a staff engineer approve this?"### 5. Demand Elegance (Balanced)- For non-trivial changes: pause and ask "is there a more elegant way?"- Skip this for simple, obvious fixes### 6. Autonomous Bug Fixing- When given a bug report: just fix it. Don't ask for hand-holding.- Zero context switching required from the user
```
### MarTech/Charlie Hills Voorbeeld (Newsletter Schrijven)
Charlie Hills gebruikt een gedetailleerde CLAUDE.md voor zijn nieuwsbrief:
- Stem claims met vertrouwen, geen ontwijkend taalgebruik
- Onderbouw elke claim met specifieke cijfers/voorbeelden
- Erken tegenargumenten direct
- Heldere, eenvoudige, informatieve taal
- Korte, impactvolle zinnen — de meeste 5-15 woorden
- Gebruik NOOIT em dashes
- Vermijd metaforen, clichés, generalisaties
- Doellengte: 1.500-2.500 woorden standaard
### Context Navigatie voor Graphify
```
## Context NavigationWhen you need to understand the codebase, docs, or any files in this project:1. ALWAYS query the knowledge graph first: /graphify query "your question"2. Only read raw files if I explicitly say "read the file"3. Use graphify-out/wiki/index.md as your navigation entrypoint
```
# Hoofdstuk 5: Essentiële Commando's & Shortcuts
## Slash Commands — Compleet Overzicht

## Top 6 Meest Gebruikte Commando's

| **Commando** | **Beschrijving** |
| --- | --- |
| /init | Scant je codebase en genereert een CLAUDE.md |
| /plan | Maakt een stapsgewijs plan voor een taak — read-only mode, geen code wijzigingen |
| /compact | Comprimeert je sessie om context te besparen zonder essentiële informatie te verliezen |
| /context | Controleer hoeveel sessiegeheugen je hebt gebruikt |
| /review | Bekijk codewijzigingen voor het committen |
| /clear | Wis alles en begin opnieuw |
| /model | Wissel tussen Opus, Sonnet en Haiku |
| /doctor | Diagnosticeer problemen met je setup |
| /find-skills | Blader door en installeer pre-built Skills |
| /add-dir | Voeg een andere map toe aan je sessie |
| /agents | Bekijk subagents die op de achtergrond draaien |
| /config | Open je instellingen |
| /loop | Draai een terugkerend schema |
| /rewind | Draai de laatste actie terug (code wijzigingen ongedaan, gesprek intact) |
| /permissions | Pre-autoriseer specifieke commando's |
| /mcp | Bekijk en beheer verbonden MCP servers |
| /memory | Bekijk en bewerk Claude's auto-geheugen |
| /effort high | Claude redeneert dieper voor complexe taken |
| /cost | Bekijk kosteninformatie voor de huidige sessie |
| /login | Log in of wissel van account |
| /terminal-setup | Configureer terminal-integratie |
| /hooks | Activeer automatiseringsscripts |

**/init** — Genereert CLAUDE.md met projectregels die behouden blijven over sessies
**/compact** — Comprimeert je context window zonder te verliezen wat het belangrijkst is
**/plan** — Read-only mode — bekijk het volledige plan voordat bestanden worden gewijzigd
**/rewind** — Draait codewijzigingen terug terwijl het hele gesprek intact blijft
**/hooks** — Gegarandeerde automatisering bij elke bestandswijziging of bash-commando
**/doctor** — Diagnosticeer en repareer setup-problemen
## Auto Mode
Standaard vraagt Claude Code toestemming voor elke bestandswijziging of commando. Met Auto Mode maakt Claude permissiebeslissingen namens jou met een veiligheidsclassificator.
Activeren:
```
claude --enable-auto-mode# Of druk op Shift+Tab om naar Auto Mode te schakelen
```
Veilige acties gaan automatisch door; riskante acties worden geblokkeerd. Alternatief (niet aanbevolen): claude --dangerously-skip-permissions verwijdert alle controles.
## CLI Flags en Opties

## Headless Mode en Piping
Claude Code kan ook in headless mode draaien voor automatisering en CI/CD:

| **Flag** | **Beschrijving** |
| --- | --- |
| claude | Start interactieve modus |
| claude --enable-auto-mode | Start met Auto Mode aan |
| claude --dangerously-skip-permissions | Verwijder alle permissie-checks (gevaarlijk) |
| claude -p "prompt" | Niet-interactieve modus: voer een prompt uit en sluit af |
| claude --model opus | Specificeer welk model te gebruiken |
| echo "prompt" \| claude | Pipe input naar Claude (headless) |

```
# Pipe een promptecho "analyseer deze codebase en geef een samenvatting" | claude# Niet-interactieve modusclaude -p "genereer unit tests voor src/services/auth.ts"# Output naar bestandclaude -p "maak een README.md" > README.md
```
# Hoofdstuk 6: Skills — Installatie & Gebruik
## Wat zijn Claude Code Skills
Skills zijn herbruikbare workflows die Claude automatisch kan activeren wanneer een taak overeenkomt met de beschrijving van de skill. Denk aan ze als pakketten van instructies die automatisch worden geactiveerd wanneer relevant.
Belangrijke eigenschappen:
- Elke skill leeft in een eigen subdirectory met een SKILL.md bestand
- Skills kunnen ondersteunende bestanden bevatten (referentiedocumenten, templates, checklists)
- Persoonlijke skills staan in ~/.claude/skills/ en zijn beschikbaar voor alle projecten
- Project-specifieke skills staan in .claude/skills/
- Het verschil met rules: rules laden passief op basis van bestandspaden; skills zijn actieve workflows die Claude activeert bij matching taken
## Hoe Skills te Installeren
Methode 1 — Vanuit GitHub (meest gebruikt):
```
npx skills add <github-url> --skill <skill-naam>
```
Methode 2 — Claude skill add:
```
claude skill add <skill-naam>
```
Methode 3 — Handmatig klonen:
```
# Persoonlijk (alle projecten)git clone <repo-url> ~/.claude/skills/<skill-naam># Project-specifiekgit clone <repo-url> .claude/skills/<skill-naam>
```
## Waar Skills te Vinden

## Top 50+ Skills met Beschrijving en Installatie
### Top 10 Meest Populaire Skills


| **Directory** | **Aantal Skills** | **URL** |
| --- | --- | --- |
| skills.sh | 91.608+ | https://skills.sh |
| skillsmp.com | 80.000+ | https://skillsmp.com |
| aitmpl.com/skills | Templates | https://aitmpl.com/skills |
| skillhub.club | 31.000+ | https://skillhub.club |
| agentskills.io | Officiële spec | https://agentskills.io |
| Anthropic Official | Referentie-implementaties | https://github.com/anthropics/skills |
| Awesome Claude Skills | Gecureerde lijst | https://github.com/anthropics/awesome-skills |

Installatie commando's voor de top 10:
```
# 1. Remotion Best Practicesnpx skills add https://github.com/remotion-dev/skills --skill remotion-best-practices
```

| **#** | **Skill** | **Wekelijkse Installs** | **Categorie** |
| --- | --- | --- | --- |
| 1 | remotion-best-practices | 213K | Video/Creative |
| 2 | agent-browser | 161.2K | Automatisering |
| 3 | ui-ux-pro-max | 102.4K | Design |
| 4 | seo-audit | 68.1K | Marketing |
| 5 | mcp-builder | 33.3K | Development |
| 6 | firecrawl | 25.6K | Data |
| 7 | ad-creative | 23.6K | Marketing |
| 8 | grill-me | 17.6K | Productiviteit |
| 9 | gws-gmail | 15.6K | Productiviteit |
| 10 | humanizer | 573 | Schrijven |

```
# 2. Agent Browsernpx skills add https://github.com/vercel-labs/agent-browser --skill agent-browser# 3. UI/UX Pro Maxnpx skills add https://github.com/nextlevelbuilder/ui-ux-pro-max-skill --skill ui-ux-pro-max# 4. SEO Auditnpx skills add https://github.com/coreyhaines31/marketingskills --skill seo-audit# 5. MCP Builder (Officieel Anthropic)npx skills add https://github.com/anthropics/skills --skill mcp-builder# 6. Firecrawlnpx skills add https://github.com/firecrawl/cli --skill firecrawl# 7. Ad Creativenpx skills add https://github.com/coreyhaines31/marketingskills --skill ad-creative# 8. Grill Menpx skills add https://github.com/mattpocock/skills --skill grill-me# 9. Google Workspace Gmailnpx skills add https://github.com/googleworkspace/cli --skill gws-gmail# 10. Humanizernpx skills add https://github.com/softaworks/agent-toolkit --skill humanizer
```
### Officiële Anthropic Skills (Document & Office)

### Design & Creative Skills

### Development & Engineering Skills

### Marketing & SEO Skills

| **Skill** | **Beschrijving** | **Installatie** |
| --- | --- | --- |
| PDF Processing | Lezen, tabellen extraheren, formulieren invullen, samenvoegen/splitsen | npx skills add https://github.com/anthropics/skills --skill pdf |
| DOCX | Word documenten maken en bewerken met tracked changes | npx skills add https://github.com/anthropics/skills --skill docx |
| PPTX | Presentaties bouwen vanuit natuurlijke taal | npx skills add https://github.com/anthropics/skills --skill pptx |
| XLSX | Formules, analyse, grafieken via gewone taal | npx skills add https://github.com/anthropics/skills --skill xlsx |
| Doc Co-Authoring | Collaboratief schrijven | npx skills add https://github.com/anthropics/skills --skill doc-coauthoring |
| Skill Creator | Meta-skill: beschrijf workflow, krijg SKILL.md in 5 min | npx skills add https://github.com/anthropics/skills --skill skill-creator |

### Finance & Trading Skills


| **Skill** | **Beschrijving** | **Installatie** |
| --- | --- | --- |
| Frontend Design | Ontsnap aan "AI slop" esthetiek. 277K+ installs | npx skills add https://github.com/anthropics/skills --skill frontend-design |
| Canvas Design | Social graphics, posters, covers | npx skills add https://github.com/anthropics/skills --skill canvas-design |
| Algorithmic Art | Fractale patronen via p5.js | npx skills add https://github.com/anthropics/skills --skill algorithmic-art |
| Theme Factory | Batch-genereer kleurenschema's | npx skills add https://github.com/anthropics/skills --skill theme-factory |
| Web Artifacts Builder | Calculators, dashboards via taal | npx skills add https://github.com/anthropics/skills --skill web-artifacts-builder |
| Brand Guidelines | Codeer je merk in een skill | npx skills add https://github.com/anthropics/skills --skill brand-guidelines |

### Kennis & Leren Skills

## Hoe Eigen Skills te Maken

| **Skill** | **Beschrijving** | **Installatie** |
| --- | --- | --- |
| Superpowers | 20+ battle-tested skills: TDD, debugging, plan-to-execute | npx skills add https://github.com/obra/superpowers --skill superpowers |
| Systematic Debugging | Root cause analyse eerst, fix daarna | npx skills add https://github.com/obra/superpowers --skill systematic-debugging |
| Context Optimization | Verminder token kosten, KV-cache trucs | npx skills add https://github.com/muratcankoylan/agent-skills-for-context-engineering --skill context-optimization |
| Deep Research | 8-fase onderzoek met auto-continuation | npx skills add https://github.com/199-biotechnologies/claude-deep-research-skill --skill deep-research |

Stap 1: Maak de directory:
```
mkdir -p .claude/skills/mijn-skill
```
Stap 2: Maak SKILL.md met YAML frontmatter:

| **Skill** | **Beschrijving** | **Installatie** |
| --- | --- | --- |
| Marketing Skills (Corey Haines) | 20+ skills: CRO, copywriting, SEO, email, groei | npx skills add https://github.com/coreyhaines31/marketingskills --skill <naam> |
| Claude SEO | Volledige site-audits, schema-validatie, 12 sub-skills | npx skills add https://github.com/AgriciDaniel/claude-seo --skill claude-seo |

```
---name: mijn-skilldescription: Beschrijving van wanneer deze skill geactiveerd moet worden.
```

| **Skill** | **Beschrijving** | **Bron** |
| --- | --- | --- |
| Sector Analyst | Ophalen en interpreteren van sector/marktdata | github.com/tradermonty/claude-trading-skills |
| Technical Analyst | Technische analyse, trendidentificatie | github.com/tradermonty/claude-trading-skills |
| Market News Analyst | Marktnieuws beoordeling | github.com/tradermonty/claude-trading-skills |
| Backtest Expert | Professioneel backtesting framework | github.com/tradermonty/claude-trading-skills |

```
allowed-tools: Read, Grep, Glob, Write, Bash---
```

| **Skill** | **Beschrijving** | **Installatie** |
| --- | --- | --- |
| NotebookLM | Claude + NotebookLM bridge | npx skills add https://github.com/PleasePrompto/notebooklm-skill --skill notebooklm |
| Obsidian Skills | Auto-tagging, auto-linking, vault-native | npx skills add https://github.com/kepano/obsidian-skills --skill obsidian |
| Wiki-Brain | Graphify + Obsidian integratie | git clone https://github.com/tenfoldmarc/wiki-brain-skill ~/.claude/skills/wiki-brain |
| Graphify | Kennisgraaf voor token reductie (71x minder) | pip install graphifyy && graphify install |

```
# Mijn Custom Skill## Wanneer te Gebruiken- Beschrijf situaties waarin deze skill moet activeren## Stappen1. Eerste stap van de workflow2. Tweede stap3. Derde stap## Output FormaatBeschrijf verwacht output formaat
```
Stap 3: Voeg optioneel ondersteunende bestanden toe (templates, referenties, checklists).
Stap 4: Start een nieuwe Claude Code sessie en geef een taak die matcht met de beschrijving.
## SKILL.md Structuur


# Hoofdstuk 7: MCP Servers
## Wat zijn MCP Servers
Terwijl Skills Claude leren HOE dingen te doen, geeft het Model Context Protocol (MCP) Claude TOEGANG tot de buitenwereld. MCP servers zijn processen die externe tools zoals GitHub, Figma, databases en zoekengines direct verbinden met Claude Code.
## Hoe MCP Servers te Configureren
```
# Voeg een MCP server toe (stdio transport — meest gebruikt)claude mcp add <server-naam> -- <commando-om-server-te-draaien># Met scope (user = alle projecten, project = alleen huidig)claude mcp add <server-naam> --scope user -- <commando>claude mcp add <server-naam> --scope project -- <commando>
```

| **Veld** | **Verplicht** | **Beschrijving** |
| --- | --- | --- |
| name | Ja | Unieke naam van de skill |
| description | Ja | Wanneer Claude deze skill moet gebruiken |
| allowed-tools | Nee | Welke tools de skill mag gebruiken (Read, Write, Bash, etc.) |
| model | Nee | Welk model te gebruiken (haiku, sonnet, opus) |

```
# HTTP transportclaude mcp add --transport http <server-naam> <server-url># Lijst van verbonden serversclaude mcp list# Of binnen Claude Code:/mcp# Verwijder een serverclaude mcp remove <server-naam>
```
## Top MCP Servers met Installatie
### 1. Context7 (door Upstash) — Documentatie Server
Altijd up-to-date, versie-specifieke documentatie voor 50+ frameworks. Geen API key nodig. 230.000+ installs.
```
claude mcp add context7 --scope user -- npx -y @upstash/context7-mcp
```
💡 Gebruik "use context7" in je prompts voor automatische documentatie-lookup.
### 2. Figma MCP (door Anthropic) — Design naar Code
Lees Figma bestanden direct, inspecteer design specs, genereer pixel-perfect UI code.
```
# Optie 1: npxclaude mcp add figma -- npx -y @anthropic-ai/mcp-figma# Optie 2: HTTP transportclaude mcp add --scope user --transport http figma https://mcp.figma.com/mcp
```
### 3. Playwright MCP (door Microsoft) — Browser Automatisering
End-to-end testing over Chromium, Firefox en WebKit.
```
claude mcp add playwright --scope project -- npx -y @playwright/mcp --headless
```
### 4. Supabase MCP — Backend Management
Volledige backend management: SQL queries, schema migraties, auth, edge functions.
```
claude mcp add supabase -- npx -y @supabase/mcp-server
```
### 5. Tavily MCP — AI-Geoptimaliseerd Zoeken
Zoekengine gebouwd voor AI agents. GitHub: https://github.com/tavily-ai/tavily-mcp
### 6. Alpaca MCP — Aandelenhandel
Officiële Alpaca server voor natural language trading van aandelen, opties en crypto.
```
claude mcp add alpaca --scope user --transport stdio uvx alpaca-mcp-server \  --env ALPACA_API_KEY=your_paper_api_key \  --env ALPACA_SECRET_KEY=your_paper_secret_key
```
### 7. Task Master AI — Projectmanagement
Feed een PRD, krijg gestructureerde taken met dependencies. GitHub: https://github.com/eyaltoledano/claude-task-master
## MCP Pro Tips
- Schakel ongebruikte MCP servers uit — elke verbonden server voegt toe aan je token context
- Gebruik project scope voor zware servers — installeer Playwright en Supabase met --scope project
- Begin met 2-3 servers — installeer niet alles tegelijk. Start met Context7 (altijd nuttig)
- Verifieer met claude mcp list — controleer actieve servers en hun scopes na installatie
- Connectors synchroniseren niet live — Claude zoekt on-demand. Denk aan het als zoeken, niet als dashboard
## MCP Workflow Pipeline
Een krachtig patroon koppelt MCP servers aan elkaar:
```
Figma → Frontend Design → Context7 → Supabase → Playwright  │          │               │           │           │  ▼          ▼               ▼           ▼           ▼Extract    Bouw           Gebruik     Verbind    Testdesign     gepolijste     correcte    backend    allesspecs      UI             API's
```
# Hoofdstuk 8: GitHub Repos & Plugins
## Essentiële GitHub Repos
### Graphify — Token Reductie Kennisgraaf
Zet elke map van bestanden om in een visuele kennisgraaf. 71x minder tokens per query.
```
# Installatiepip install graphifyy && graphify install# Bouw kennisgraaf/graphify ~/.claude
```
GitHub: https://github.com/safishamsi/graphify
### GO VIRAL BRO — Content Pipeline
Trainbare content pipeline met 7 slash commands.
```
git clone https://github.com/charlesdove977/goviralbro.gitcd goviralbrobash scripts/init-viral-command.sh
```
### Wiki-Brain Skill
Done-for-you versie van Graphify setup met Obsidian integratie.
```
git clone https://github.com/tenfoldmarc/wiki-brain-skill ~/.claude/skills/wiki-brain
```
## Agent Frameworks

## Agent Orchestratie & Multi-Agent

## Lokale AI

## Plugins
Plugins bundelen meerdere Skills, connectors, slash commands en sub-agents in één installeerbaar pakket. Cowork bevat 11 pre-built Plugins voor: sales, finance, legal, marketing, HR, engineering, en meer.
Vier manieren om plugins toe te voegen:
- Browse plugins — Pre-built bibliotheek, one-click installatie
- Add marketplace — Privé plugins van je organisatie (Team/Enterprise)
- Upload plugin — Drop een plugin die een collega heeft gebouwd
- Create with Claude — Beschrijf wat je wilt, Claude bouwt het


| **Repo** | **Beschrijving** | **URL** |
| --- | --- | --- |
| OpenClaw | De virale AI agent. 210K+ stars | github.com/openclaw/openclaw |
| AutoGPT | Agent platform voor langlopende taken | github.com/Significant-Gravitas/AutoGPT |
| LangGraph | Agents als grafen. Multi-agent orchestratie | github.com/langchain-ai/langgraph |
| CrewAI | Multi-agent met rollen, doelen, backstories | github.com/crewAIInc/crewAI |
| Dify | Open-source LLM app builder | github.com/langgenius/dify |

# Hoofdstuk 9: Hooks Systeem
## Wat zijn Hooks
Hooks zijn shell scripts die automatisch worden uitgevoerd op specifieke punten in Claude's workflow. Het verschil: CLAUDE.md zegt "draai prettier alsjeblieft" (90% van de tijd). Een hook zegt "draai prettier" (100% van de tijd).

| **Repo** | **Beschrijving** | **URL** |
| --- | --- | --- |
| gstack | Claude Code als virtueel engineering team | github.com/garrytan/gstack |
| cmux | Meerdere Claude agents parallel | github.com/craigsc/cmux |
| figaro | Orchestreer Claude agent fleets op desktop | github.com/byt3bl33d3r/figaro |
| claude-squad | Terminal agents in parallelle sessies | github.com/smtg-ai/claude-squad |
| deer-flow (ByteDance) | Sub-agents en sandboxes via skills | github.com/bytedance/deer-flow |

Exit codes:

💡 BELANGRIJK: Exit 1 blokkeert NIET. Gebruik exit 2 voor beveiliging.

| **Repo** | **Beschrijving** | **URL** |
| --- | --- | --- |
| Ollama | Draai LLMs lokaal met één commando | github.com/ollama/ollama |
| Open WebUI | Self-hosted ChatGPT-achtige interface | github.com/open-webui/open-webui |
| LlamaFile | LLM als enkel uitvoerbaar bestand | github.com/Mozilla-Ocho/llamafile |
| Unsloth | Fine-tune 2x sneller, 70% minder geheugen | github.com/unslothai/unsloth |

## Hook Events

## PreToolUse Hooks — Bash Firewall
Maak .claude/hooks/bash-firewall.sh:
```
#!/bin/bashINPUT=$(cat)COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')if [ -z "$COMMAND" ]; then exit 0; fiBLOCKED_PATTERNS=(  "rm -rf /"  "rm -rf ~"  "rm -rf ."
```

| **Exit Code** | **Betekenis** | **Actie** |
| --- | --- | --- |
| 0 | Succes | Ga door |
| 1 | Error (niet-blokkerend) | Log error, ga door |
| 2 | Blokkeer | Stop alles. Stuur error naar Claude voor zelfcorrectie |

```
  "git push --force"  "git push -f"  "git checkout main"  "git reset --hard"
```

| **Event** | **Wanneer het Vuurt** | **Gebruik voor** |
| --- | --- | --- |
| PreToolUse | VOOR elke tool draait | Beveiligingspoort — blokkeer gevaarlijke commando's |
| PostToolUse | NA een tool slaagt | Cleanup — formatteer bestanden, lint, log |
| Stop | Als Claude klaar wil zijn | Kwaliteitspoort — draai tests, type checking |
| UserPromptSubmit | Als je Enter drukt | Prompt validatie of logging |
| Notification | Als Claude aandacht wil | Desktop meldingen |
| SessionStart | Begin van sessie | Setup, context injecteren |
| SessionEnd | Einde van sessie | Cleanup tijdelijke bestanden |

```
  "DROP TABLE"  "DROP DATABASE"  "truncate"  "chmod 777"  "curl.| bash"  "wget.| bash")for pattern in "${BLOCKED_PATTERNS[@]}"; do  if echo "$COMMAND" | grep -qi "$pattern"; then    echo "BLOCKED: Command matches dangerous pattern: $pattern" >&2    exit 2  fidoneexit 0
```
Maak uitvoerbaar en configureer in settings.json:
```
chmod +x .claude/hooks/bash-firewall.sh# settings.json configuratie:{  "hooks": {    "PreToolUse": [{      "matcher": "Bash",      "hooks": [{        "type": "command",        "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/bash-firewall.sh"      }]    }]  }}
```
## PostToolUse Hooks — Auto-Format
Maak .claude/hooks/auto-format.sh:
```
#!/bin/bashINPUT=$(cat)FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')if [ -z "$FILE_PATH" ]; then exit 0; fiif [ -f "$FILE_PATH" ]; then  case "$FILE_PATH" in    *.ts|*.tsx|*.js|*.jsx|*.json|*.css|*.md)      npx prettier --write "$FILE_PATH" 2>/dev/null      ;;    *.py)      black "$FILE_PATH" 2>/dev/null      ;;  esacfiexit 0
```
## Stop Hooks — Test Enforcement
Maak .claude/hooks/enforce-tests.sh:
```
#!/bin/bashINPUT=$(cat)STOP_HOOK_ACTIVE=$(echo "$INPUT" | jq -r '.stop_hook_active // false')if [ "$STOP_HOOK_ACTIVE" = "true" ]; then  exit 0finpm run test 2>&1if [ $? -ne 0 ]; then  echo "Tests falen. Fix ze voordat je afrondt." >&2  exit 2finpx tsc --noEmit 2>&1if [ $? -ne 0 ]; then  echo "TypeScript type errors gevonden. Fix ze." >&2  exit 2fiexit 0
```
💡 De stop_hook_active check voorkomt oneindige loops. Hooks worden gesnapshot bij sessiestart — wijzigingen vereisen een herstart.
## Security Hooks
Combineer PreToolUse hooks met het deny-systeem in settings.json voor meerdere beveiligingslagen:
- Bash Firewall: blokkeer destructieve commando's (rm -rf, DROP TABLE, git push --force)
- Secret Scanner: voorkom dat gevoelige bestanden worden gelezen (.env, credentials/)
- Network Guard: blokkeer onbekende netwerkaanroepen (curl, wget naar onbekende URLs)
- File Scope Guard: voorkom schrijfacties buiten het project directory

# Hoofdstuk 10: Workflow & Orchestratie
## Plan Mode Gebruiken
De optimale Claude Code workflow:
1. /plan — Beschrijf wat je wilt. Bekijk het plan voor je iets goedkeurt.
2. Wees specifiek over het resultaat. Noem het formaat, de structuur, het bestandstype.
3. Laat Claude het opsplitsen in stappen. Lees ze. Vang misverstanden op.
4. Maak een of twee wijzigingen, keur dan goed.
5. Laat Claude de hele taak uitvoeren zonder te onderbreken.
6. Verfijn de output in dezelfde sessie.
## Subagent Strategie
Subagents zijn gespecialiseerde AI-workers die in hun eigen context window draaien. Ze werken onafhankelijk, comprimeren bevindingen, en rapporteren terug. Het hoofdgesprek wordt niet vervuild met tussentijdse tokens.
Voeg "use subagents" toe aan je prompt en Claude spawnt parallelle workers:
```
/plan Use subagents to run these three research streams in parallel:scrape my last 20 LinkedIn posts via Apify,scrape my last 10 Instagram Reels via Apify,and pull the top 20 trending Reels in my niche this week.When all three are done, cross-reference and write the top 5 scripts.
```
## Multi-Agent Workflows
Voorbeeld van een multi-agent design-to-code pipeline:
```
Figma → Claude MCP → UI Code → Motion → Remotion VideoAgent 1 — UX Designer (Product UX Strategist)Agent 2 — UI Designer (UI System Architect)Agent 3 — Frontend Engineer (UI Implementation Engineer)Agent 4 — Motion DesignerAgent 5 — QA ReviewerUitvoeringsregels:- Agents moeten sequentieel werken- Elke agent moet outputs duidelijk labelen- Sla geen stappen over- Elke agent moet de output van de vorige verbeteren
```
## Task Management (todo.md, lessons.md)
Gebruik een gestructureerd taakbeheersysteem:
```
# tasks/todo.md## Huidige Sprint- [x] Database schema ontwerpen- [x] API endpoints implementeren- [ ] Unit tests schrijven voor auth service- [ ] Frontend formulier bouwen- [ ] E2E tests draaien## Review- Auth service: werkend, alle edge cases afgedekt- Database: migraties succesvol gedraaid# tasks/lessons.md## Geleerde Lessen### 2026-04-14- FOUT: Vergeten om database transacties te gebruiken bij multi-step operaties- REGEL: Altijd transacties gebruiken wanneer meerdere tabellen worden gewijzigd- IMPACT: Data inconsistentie voorkomen### 2026-04-13- FOUT: Tests draaiden niet omdat test database niet was gereset- REGEL: Altijd npm run db:test:reset voor het draaien van tests- IMPACT: Geen valse test failures meer
```
## Verificatie voor Completion
- Markeer nooit een taak als compleet zonder te bewijzen dat het werkt
- Draai tests, controleer logs, demonstreer correctheid
- Diff het gedrag tussen main en jouw wijzigingen
- Vraag jezelf af: "Zou een senior engineer dit goedkeuren?"
- Toon bewijs van werkende code, niet alleen "ik heb de wijziging gemaakt"
## Persistent Memory Systeem
Maak een /memory directory met gestructureerde bestanden:
```
Maak een persistent memory systeem voor mij.Maak een /memory directory met deze bestanden:  decisions.md — Belangrijke beslissingen  people.md — Belangrijke mensen  preferences.md — Hoe je dingen graag gedaan wilt hebben  user.md — Wie je bent, waar je aan werktSchrijf dan een CLAUDE.md die zegt om al deze bestandente lezen aan het begin van elke sessie, en maak een hookdie ze bijwerkt aan het einde.
```
## Het "Coworker" Methode (Ruben Hassid)
Behandel Claude als een agent (collega), niet als een chatbot:
- ABOUT ME map: Biografie, schrijfstijl, doelen, waarden
- PROJECTS map: Per-project mappen met bronbestanden
- TEMPLATES map: Succesvolle eerdere outputs als voorbeelden
- OUTPUTS map: Waar Claude resultaten opslaat
Formule: Context → Rol → Beperkingen → Output → Verfijning

# Hoofdstuk 11: Token Efficiëntie & Kosten Besparen
## Dual-Engine Architecture met Ollama
Het kernprincipe: de meeste AI-taken hebben niet het slimste model nodig. Route 70-90% van het werk naar gratis lokale inferentie.
### Setup (15 minuten)
```
# Installeer Ollamacurl -fsSL https://ollama.com/install.sh | sh# Pull een model op basis van GPU:# 8GB VRAM: ollama pull gemma3:12b# 12-16GB VRAM: ollama pull gemma4:27b# 24GB+ VRAM: ollama pull gemma4:31b
```
## Taak Classificatie Matrix

## De Beslisregel
*"Als deze output 85% correct is in plaats van 95%, maakt het uit?"*
- Nee → Lokaal model (gratis). Ja → Cloud model (betaald).
## Het Compound Patroon: Lokaal Verkent, Cloud Beslist
```
Stap 1 (LOKAAL, gratis):  Genereer 10 benaderingenStap 2 (LOKAAL, gratis):  Score elke benadering 1-10Stap 3 (CLOUD, betaald):  Review top 3, kies beste, implementeerTOKEN BESPARING: ~70%
```
## Verwachte Besparingen

## /compact Commando
Gebruik /compact wanneer je context window vol raakt. Het comprimeert je sessie zonder de belangrijkste informatie te verliezen. Ideaal voor lange sessies.
## Graphify Kennisgraaf Systeem
Graphify leest je bestanden één keer, bouwt een kennisgraaf, en je kunt het hele project in gewone taal bevragen zonder opnieuw te lezen. 71.5x token reductie.
```
# Installatiepip install graphifyy && graphify install
```

| **Taak Type** | **Model** | **Kosten** |
| --- | --- | --- |
| Bestanden lezen, scannen, indexeren | Lokaal (Ollama) | Gratis |
| Samenvatting en compressie | Lokaal | Gratis |
| Brainstormen en ideeën genereren | Lokaal | Gratis |
| Eerste concepten | Lokaal | Gratis |
| Data extractie uit tekst | Lokaal | Gratis |
| Classificatie en categorisatie | Lokaal | Gratis |
| Testcases genereren | Lokaal | Gratis |
| Code uitleg en documentatie | Lokaal | Gratis |
| Productie code generatie | Cloud (Claude) | Betaald |
| Architectuur en design beslissingen | Cloud | Betaald |
| Security review | Cloud | Betaald |
| Finale klantgerichte copy | Cloud | Betaald |
| Complexe multi-step redenering | Cloud | Betaald |

```
# Bouw kennisgraaf/graphify ~/.claude# Token berekening:# 30-40 bestanden = 15.000-20.000 tokens per sessie voor context# 20 sessies/week = 300.000-400.000 tokens die niets productiefs doen# Graphify: betaal eenmaal, graaf blijft, incrementele updates
```
## Kosten Monitoring
Gebruik /cost om kosteninformatie voor de huidige sessie te bekijken.
- Monitor je token gebruik regelmatig met /cost
- Gebruik /compact wanneer je context window vol raakt

| **Use Case** | **Voorheen (100% cloud)** | **Na (dual engine)** | **Besparing** |
| --- | --- | --- | --- |
| Content creatie (50 posts/week) | ~$75/week | ~$12/week | 84% |
| Code review (20 PRs/week) | ~$40/week | ~$8/week | 80% |
| Klantenservice (100 tickets/dag) | ~$150/dag | ~$30/dag | 80% |
| Data verwerking (1000 docs/dag) | ~$200/dag | ~$20/dag | 90% |
| Onderzoek & analyse | ~$50/sessie | ~$10/sessie | 80% |

- Start met Sonnet voor dagelijkse taken, schakel naar Opus alleen voor complexe taken
- Schakel Web Search uit tenzij nodig — het verbruikt extra tokens
- Schakel ongebruikte MCP servers uit

# Hoofdstuk 12: Geavanceerde Tips & Tricks
## Prompt Engineering voor Claude Code
### 5 Geheime Codes
**Code #1: Think Step By Step**
"Think step by step before answering."
Gebruik voor: wiskunde, logica, debugging, multi-stap plannen.
**Code #2: Be Brutally Honest**
"Be brutally honest. Don't sugarcoat anything."
Gebruik voor: landing page feedback, business plannen, code reviews.
**Code #3: What Am I Missing?**
"What am I missing? What haven't I considered?"
Gebruik voor: na het delen van een plan of strategie. Zet Claude in "stress test" modus.
**Code #4: Pretend I'm Wrong**
"Pretend I'm wrong. Argue the opposite position."
Gebruik voor: wanneer je te dicht bij een idee zit.
**Code #5: Skip the Intro**
"Skip the intro. Start with the answer. Be concise."
Gebruik voor: elke keer dat je een snel, schoon antwoord wilt.
### CSI-FBI Prompting Framework (Nicolas Boucher)

### Stijl Klonen
- Geef Claude 3-5 schrijfvoorbeelden (bijschriften, scripts, toon)
- Instructie: "match this style exactly"
- Claude past structuur, ritme en woordkeuze aan
### Anti-AI Schrijfstrategie (Ruben Hassid)
1. Upload 5 van je eigen beste teksten
2. Vraag Claude: "Analyseer mijn zinsbouw, ritme en woordkeuze. Maak een stijlgids van 10 punten."
3. Gebruik de stijlgids voor elke nieuwe taak
4. Vermijd AI-tell woorden: "delve", "tapestry", "comprehensive", "leverage"
## Humanizer Protocollen
De Humanizer skill detecteert 24 verschillende AI-schrijfpatronen:
- Opgeblazen symboliek
- Promotioneel taalgebruik
- Overmatig gebruik van em dashes
- Vage toeschrijvingen
- Overdreven bijvoeglijke naamwoorden
```
npx skills add https://github.com/softaworks/agent-toolkit --skill humanizer
```
## AI-Verraadwoorden om te Vermijden
Woorden die AI-tekst verraden:

| **Letter** | **Betekenis** | **Uitleg** |
| --- | --- | --- |
| C | Context | Achtergrond informatie over de situatie |
| S | Specific | Wees zo specifiek mogelijk |
| I | Instruction | Wat Claude precies moet doen |
| F | Format | Hoe het resultaat eruit moet zien |
| B | Blueprint | Structuur of template om te volgen |
| I | Identity | Welke rol Claude moet aannemen |

delve, tapestry, testament, landscape, foster, garner, bolster, cultivate, vibrant, intricate, meticulous, profound, seamless, Additionally, Furthermore, Moreover, Notably, harness, leverage, game-changer, revolutionary, unveil, navigate, ecosystem, journey, groundbreaking, cutting-edge
## Extended Thinking Mode
- Toggle aan onder de model selector
- Claude redeneert stap-voor-stap voor het antwoord geeft
- Altijd gebruiken met Opus
- Activeer met: "think deeply before answering"
## Template Prompt Patroon
```
Build me a [[wat je wilt gebouwd]].Read my [[context bestanden/directories]].Use [[tools/stack]] to [[actie]].When [[trigger]], [[wat Claude moet doen]].Save the output to [[locatie/bestand]].Store any credentials in .env as [[VAR_NAME]].
```
# Hoofdstuk 13: Claude Code voor Finance & Trading
## Setup voor Financiële Analyse
Claude Code is bijzonder geschikt voor complexe financiële workflows die data-analyse, modellering en geautomatiseerde handelsstrategieën combineren.
Aanbevolen setup:
- Installeer trading skills: Sector Analyst, Technical Analyst, Backtest Expert
- Verbind Alpaca MCP voor marktdata en orderuitvoering
- Gebruik Claude in Excel voor spreadsheet-analyse
- Stel een dedicated CLAUDE.md in voor financiële projecten (zie Deliverable 5)
## MCP Servers voor Trading
### Alpaca MCP Server
De officiële server van Alpaca voor natural language trading:
```
claude mcp add alpaca --scope user --transport stdio uvx alpaca-mcp-server \  --env ALPACA_API_KEY=your_paper_api_key \  --env ALPACA_SECRET_KEY=your_paper_secret_key
```
Na verbinding kun je commando's geven zoals:
- "What is my current buying power on Alpaca?"
- "Place a market order to buy 5 shares of AAPL"
- "Show me my current positions"
- "What's the current price of TSLA?"
### Data Provider MCPs
Connectors voor Daloopa en Carbon Arc bieden institutioneel-grade financiële data en markt-intelligence.
## Workflows voor Stock Analyse
Voorbeeld workflow voor aandelenanalyse:
```
Stap 1: Configureer MCP servers (Alpaca, Context7)Stap 2: Installeer trading skills (sector-analyst, technical-analyst)Stap 3: Definieer analyse parameters in CLAUDE.mdStap 4: Prompt: "Analyseer de top 5 tech aandelen van de S&P 500.         Gebruik technische indicatoren (RSI, MACD, SMA) en         fundamentele data. Genereer een rapport met         koop/verkoop/houd aanbevelingen."Stap 5: Laat Claude het rapport genereren als Artifact of bestandStap 6: Review en verfijn in dezelfde sessie
```
## Claude in Excel voor Finance
De Claude for Excel add-in transformeert spreadsheets in dynamische analyse-tools:

## Automatisering van Trading Strategieën
Gebruik hooks en scheduled tasks voor geautomatiseerde trading workflows:
- Ochtend briefing: dagelijkse marktanalyse om 8:00 via scheduled task
- Signal monitoring: technische indicatoren controleren via hooks
- Risicomanagement: positie-limieten afdwingen met PreToolUse hooks
- Backtesting: strategieën valideren met de Backtest Expert skill
- Rapportage: wekelijkse portfolio-rapporten genereren
💡 Begin ALTIJD met paper trading. Implementeer kill switches voor alle live trading systemen.

# Hoofdstuk 14: Troubleshooting & FAQ
## Veelvoorkomende Problemen

## /doctor Commando
Draai /doctor om veelvoorkomende configuratieproblemen te diagnosticeren. Dit controleert je setup op bekende problemen en geeft aanbevelingen.
## Performance Optimalisatie
- Begin met Sonnet voor dagelijkse taken — schakel naar Opus alleen voor complexe taken
- Gebruik /compact wanneer je context window vol raakt
- Schakel Web Search uit tenzij nodig
- Schakel ongebruikte MCP servers uit
- Gebruik project scope voor zware MCP servers

| **Actie** | **Voorbeeld Prompt** |
| --- | --- |
| Formule generatie | "Build a formula that flags overdue invoices" |
| Model bouwen | "Build a three-statement financial model for a SaaS company" |
| Forecasting | "Build a 12-month revenue forecast based on historical data" |
| Data extractie | "Extract the financial tables from this uploaded 10-K PDF" |
| Scenario analyse | "Build a sensitivity table showing IRR across exit multiples" |
| Variance analyse | "Compare actuals to budget and explain the largest variances" |

- Overweeg Graphify voor grote codebases
- Gebruik de dual-engine architectuur met Ollama voor 80-90% kostenbesparing
## Community Resources

## Modellen Vergelijking

Regel: Begin met Sonnet. Schakel naar Opus wanneer de taak het vereist.
