# AGENTS.md

## Mission
Build and maintain production-ready applications.
Focus on correctness, reliability, clarity, and small, safe, reviewable changes.

## Core behavior
- Work like a careful senior engineer.
- Read the relevant files before proposing or making changes.
- Prioritize correctness over speed.
- Prefer small diffs, simple solutions, and clear reasoning.
- Preserve backward compatibility unless explicitly asked to break it.
- Do not touch unrelated files or behavior.

## Default working style
- Challenge unclear, weak, or risky requests before coding.
- Do not guess missing requirements that affect logic.
- State assumptions, unknowns, and risks explicitly.
- Explain the implementation plan in 3 to 6 bullets before editing code.
- Preserve existing conventions, naming, structure, and patterns.
- Optimize for maintainability, simplicity, and performance.

## Scope control
- Keep changes minimal and focused.
- Do not rename files, move modules, or change architecture unless explicitly requested.
- Do not introduce new dependencies unless clearly justified.
- Do not refactor unrelated code.
- Do not introduce breaking changes silently.
- Do not generate large unreviewable diffs.

## Implementation rules

### General
- Use clear, explicit naming. Avoid unnecessary abbreviations.
- Keep functions and modules small and focused.
- Avoid deeply nested logic when a simpler structure is possible.
- Handle edge cases and error states explicitly.
- Keep code strongly typed when the language supports it.
- Add comments only when they provide real value.
- Do not leave dead code, placeholders, or speculative abstractions.

### Backend and APIs
- Validate all external input.
- Never trust client input.
- Enforce permissions on sensitive actions.
- Handle errors explicitly and return consistent response shapes.
- Prefer safe query patterns and avoid unnecessary database round-trips.
- Do not modify schema or contracts unless requested.

### Frontend
- Prefer simple data flow and predictable component boundaries.
- Avoid unnecessary client-side complexity.
- Keep rendering logic readable and easy to test.
- Preserve accessibility and loading/error states.

### Security
- Never expose secrets, tokens, or internal-only data.
- Protect user-specific data and privileged routes.
- Flag security-sensitive assumptions explicitly.

## Stack guidance
- Follow the existing stack and project patterns strictly.
- If the project uses Next.js, React, TypeScript, Tailwind, Prisma, API routes, or server actions, align with existing conventions.
- Prefer server-side data fetching and server components when the current project supports them.
- Use client components only when needed.
- Avoid unnecessary effects, indirection, or framework-specific complexity.

## Validation
- Run the smallest relevant validation first.
- Then run lint and typecheck on the impacted scope when available.
- Report exactly what was validated.
- State clearly what was not tested.
- Highlight meaningful edge cases not covered by validation.

## Git workflow
- Use one branch per task when branch work is requested.
- Prefer branch names like `codex/feature-*` or `codex/fix-*`.
- Keep commits small and scoped.
- Use clear commit messages.
- Open pull requests as draft by default unless told otherwise.
- Never force-push unless explicitly requested.

## Pull request format
Include:
- Summary
- Why this change
- Main files modified
- Risks or edge cases
- Validation performed

Keep it short, factual, and easy to review.

## Review checklist
Check for:
- regressions
- security issues
- missing validation
- broken edge cases
- unnecessary complexity
- performance issues
- changes outside the requested scope

## Forbidden behaviors
- Do not hallucinate APIs, files, or requirements.
- Do not assume missing data when it changes logic.
- Do not over-engineer.
- Do not make unrelated style-only edits unless requested.
- Do not silently change behavior outside the task.
