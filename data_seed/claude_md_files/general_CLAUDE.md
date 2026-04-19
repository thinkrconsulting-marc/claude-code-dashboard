# CLAUDE.md — General Software Development

> Place this file in your project root. Claude Code reads it at session start and follows it as authoritative instructions.

## Workflow Orchestration

### 1. Plan Mode Default
- Enter plan mode (`/plan`) for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately — don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity
- Review the plan before approving any code changes

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution
- Add "use subagents" to prompts when parallel work is beneficial

### 3. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake twice
- Ruthlessly iterate on these lessons until mistake rate drops
- Review `tasks/lessons.md` at session start for relevant patterns

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness
- Show evidence of working code, not just "I made the change"

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes — don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding.
- Point at logs, errors, failing tests — then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.
- **No Guessing**: If you're unsure about something, investigate first. Read the code.
- **Explain the Why**: When making changes, explain *why* not just *what*.
- **One Thing at a Time**: Complete one task fully before starting the next.

## Code Quality Standards

- All functions should do one thing and do it well
- Use descriptive variable and function names
- Error handling is mandatory — never swallow errors silently
- No magic numbers or hardcoded strings — use constants
- Keep functions under 50 lines; files under 300 lines
- Prefer composition over inheritance
- Prefer explicit over implicit, even if it means more code
- Remove dead code — don't comment it out

## Testing Requirements

- Every feature needs at least one happy-path test and one error-path test
- Tests must be independent — no shared mutable state between tests
- Test behavior, not implementation details
- If a test needs more than 50 lines of setup, the code under test probably needs refactoring
- Run the full test suite before declaring any task complete
- Test file naming: `[filename].test.[ext]`

## Git Workflow

- Commit messages follow conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`
- One logical change per commit
- Never commit directly to `main` or `master`
- Never force push
- Review diffs before committing
- Keep commits atomic and reversible

## Communication Style

- Be direct and concise
- Lead with the answer, then explain
- Use bullet points for multiple items
- Show code diffs for changes
- Admit uncertainty when genuinely uncertain
- No filler words or unnecessary preambles

## File Structure Conventions

```
src/                    # Source code
  services/             # Business logic
  handlers/             # Request handlers / controllers
  types/                # Shared type definitions
  utils/                # Utility functions
  middleware/            # Middleware functions
tests/                  # Test files (mirror src/ structure)
tasks/                  # Task management
  todo.md               # Current task list
  lessons.md            # Lessons learned from corrections
docs/                   # Documentation
```

## Things to Never Do

- Never use `any` type (TypeScript) or equivalent weak typing
- Never commit secrets, API keys, or credentials
- Never modify files outside the project directory without explicit permission
- Never run destructive commands (`rm -rf`, `DROP TABLE`, `git push --force`)
- Never ignore failing tests
- Never introduce dependencies without justification
