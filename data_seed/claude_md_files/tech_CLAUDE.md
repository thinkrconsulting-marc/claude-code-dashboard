# CLAUDE.md — Full-Stack Web Development

> Place this file in your project root. Claude Code reads it at session start and follows it as authoritative instructions.
> Optimized for React/Next.js/TypeScript/Node.js/Python full-stack projects.

## Workflow Orchestration

### 1. Plan Mode Default
- Enter plan mode (`/plan`) for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately — don't keep pushing
- Write detailed specs upfront to reduce ambiguity
- Review the plan before approving any code changes

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- One task per subagent for focused execution
- Use subagents for: code review, test writing, documentation, refactoring exploration

### 3. Self-Improvement Loop
- After ANY correction: update `tasks/lessons.md` with the pattern
- Write rules that prevent the same mistake twice
- Review `tasks/lessons.md` at session start

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Run tests, type checks, linting before declaring done
- Ask yourself: "Would a staff engineer approve this?"
- Show evidence of working code

### 5. Autonomous Bug Fixing
- When given a bug report: investigate and fix. Don't ask for hand-holding.
- Check logs, errors, failing tests — then resolve them

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Capture Lessons**: Update `tasks/lessons.md` after corrections

## Core Principles

- **Simplicity First**: Make every change as simple as possible
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary
- **Type Safety**: TypeScript strict mode everywhere. No `any`. No type assertions without justification.
- **Explicit Over Implicit**: Even if it means more code

## Tech Stack Preferences

### Frontend
- **Framework**: Next.js (App Router) with React 18+
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS — utility classes only, no custom CSS files
- **Components**: Functional components with hooks, never class components
- **State**: React Query (TanStack Query) for server state, Zustand for client state
- **Forms**: React Hook Form + Zod validation
- **UI Library**: shadcn/ui components (preferred) or Radix primitives
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js 20+ with TypeScript
- **Framework**: Express.js or Fastify for REST APIs; tRPC for type-safe APIs
- **Alternative**: Python 3.11+ with FastAPI for ML/data-heavy services
- **ORM**: Prisma (Node.js) or SQLAlchemy (Python)
- **Validation**: Zod for all request/response validation
- **Auth**: NextAuth.js / Auth.js or Clerk

### Database
- **Primary**: PostgreSQL
- **Cache**: Redis for sessions, rate limiting, caching
- **Search**: If needed, use pg_trgm or Elasticsearch
- **Migrations**: Prisma Migrate or Alembic (Python)

### Infrastructure
- **Hosting**: Vercel (frontend), Railway/Fly.io (backend)
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry for errors, Vercel Analytics for performance
- **Containerization**: Docker for local dev and deployment

## Architecture Rules

### Project Structure (Next.js)
```
src/
  app/                  # Next.js App Router pages and layouts
    (auth)/             # Auth route group
    (dashboard)/        # Dashboard route group
    api/                # API routes
    layout.tsx          # Root layout
    page.tsx            # Home page
  components/
    ui/                 # Reusable UI primitives (shadcn)
    forms/              # Form components
    layouts/            # Layout components
    [feature]/          # Feature-specific components
  lib/                  # Shared utilities and configs
    db.ts               # Database client
    auth.ts             # Auth configuration
    utils.ts            # General utilities
    validations/        # Zod schemas
  services/             # Business logic layer
  types/                # Shared TypeScript types and interfaces
  hooks/                # Custom React hooks
  middleware.ts         # Next.js middleware
prisma/
  schema.prisma         # Database schema
  migrations/           # Migration files
tests/
  unit/                 # Unit tests
  integration/          # Integration tests
  e2e/                  # End-to-end tests (Playwright)
```

### Backend Structure (Standalone API)
```
src/
  handlers/             # Request handlers (thin — call services)
  services/             # Business logic (all DB access here)
  middleware/            # Auth, validation, error handling, rate limiting
  types/                # Type definitions
  utils/                # Helper functions
  db/                   # Database client and queries
  config/               # Environment and app configuration
```

### Naming Conventions
- Files: `kebab-case.ts` for utilities, `PascalCase.tsx` for React components
- Variables/functions: `camelCase`
- Types/interfaces: `PascalCase`, prefix interfaces with `I` only if ambiguous
- Constants: `SCREAMING_SNAKE_CASE`
- Database tables: `snake_case` (plural)
- API routes: `kebab-case`, plural nouns (`/api/users`, `/api/blog-posts`)

## Code Quality Standards

### TypeScript
- Strict mode enabled: `"strict": true` in tsconfig
- No `any` type — use `unknown` and narrow
- No type assertions (`as`) without a comment explaining why
- All function parameters and return types must be explicitly typed
- Use discriminated unions over optional fields where possible
- Prefer `interface` for object shapes, `type` for unions/intersections

### React
- All components must have explicit TypeScript props interfaces
- Extract reusable logic into custom hooks in `src/hooks/`
- Loading and error states are required for every async component
- Use `Suspense` boundaries for code splitting
- Memoize expensive computations (`useMemo`, `useCallback` only when profiling shows need)
- No inline styles — use Tailwind classes

### API Design
- All handlers return `{ data, error }` shape
- Use Zod for request body/query validation in every handler
- Never expose stack traces or internal errors to clients
- All async handlers wrapped in error handling middleware
- Rate limiting required on all public endpoints
- Use proper HTTP status codes (don't always return 200)
- Paginate all list endpoints
- Version your API (`/api/v1/...`)

### Database
- All queries go through the ORM — never raw SQL strings
- Database calls only happen inside `src/services/`, never in handlers
- Use transactions for multi-step operations
- Index frequently queried columns
- Always include `created_at` and `updated_at` timestamps
- Use soft deletes (`deleted_at`) for important records
- Write migrations for every schema change — no manual DB edits

## Testing Requirements

- **Unit tests**: For all services and utility functions
- **Integration tests**: For API endpoints (test full request/response cycle)
- **E2E tests**: For critical user flows (Playwright)
- Every feature needs at least one happy-path and one error-path test
- Tests run against a real local database, not mocks
- Run `npm run db:test:reset` before test suites
- Test file naming: `[filename].test.ts`
- Use factories (`src/test/factories/`) for test data — never hardcode
- Test behavior, not implementation details
- Target: >80% code coverage for services

## Testing Commands
```bash
npm run test              # Run all tests (Jest)
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
npm run test:e2e          # Playwright E2E tests
npm run db:test:reset     # Reset test database before running tests
npx tsc --noEmit          # Type check (must pass before committing)
npm run lint              # ESLint + Prettier
npm run build             # Production build (must succeed)
```

## CI/CD Integration

- All PRs must pass: type check → lint → unit tests → integration tests → build
- E2E tests run on staging deployments
- Auto-deploy to preview on PR creation (Vercel)
- Merge to `main` triggers production deployment
- Database migrations run automatically in CI pipeline

## Security Best Practices

- Never log sensitive data (tokens, passwords, PII)
- All user input validated with Zod before use
- SQL queries only through ORM, never raw strings
- Never expose stack traces in API responses
- Rate limiting on all public endpoints
- Authentication middleware on all non-public routes
- File uploads: validate MIME type and size
- CORS configured for specific origins only
- Secrets in environment variables only — never in code
- Use `helmet` middleware for HTTP security headers
- CSRF protection on all state-changing endpoints
- Input sanitization for HTML/XSS prevention

## Performance Optimization

- Use `React.lazy()` and dynamic imports for code splitting
- Optimize images with `next/image` (automatic WebP, sizing, lazy loading)
- Use `ISR` or `SSG` for static content, `SSR` only when needed
- Cache API responses with appropriate `Cache-Control` headers
- Use database connection pooling
- Implement pagination on all list queries (default: 20 items)
- Use `select` in Prisma queries — don't fetch unnecessary fields
- Monitor Core Web Vitals (LCP < 2.5s, FID < 100ms, CLS < 0.1)

## Git Workflow

- Commit messages: conventional commits (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`)
- One logical change per commit
- Never commit to `main` directly — use feature branches
- Branch naming: `feat/description`, `fix/description`, `refactor/description`
- Never force push to shared branches
- Squash merge feature branches to main
- Review diffs before committing

## Communication Style

- Be direct and concise
- Lead with the answer, then explain
- Show code diffs for changes
- Use bullet points for multiple items
- Admit uncertainty when genuinely uncertain

## Things to Never Do

- Never use `any` type
- Never commit secrets, API keys, or `.env` files
- Never run `rm -rf`, `DROP TABLE`, `git push --force`
- Never modify files outside the project directory
- Never skip tests
- Never use `console.log` in production code — use the logger module
- Never install dependencies without justification
- Never use `innerHTML` or `dangerouslySetInnerHTML` without sanitization
