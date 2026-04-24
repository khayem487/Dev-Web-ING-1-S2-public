# DECISIONS.md

## Functional scope (validated)
- Theme: **Maison Intelligente**
- Modules in scope:
  1. Information
  2. Visualisation
  3. Gestion
- **Administration module is intentionally excluded** (teacher correction after initial spec).

## Mandatory constraints
- Real **database** required (no file-only storage).
- Use framework(s): backend + frontend frameworks are mandatory.
- Search features must support **>= 2 filters**.
- Git workflow with regular commits.
- Responsive + basic UX + accessibility checks.

## User progression logic (project rule)
- Roles/type include visitor + authenticated member flow.
- Levels: debutant/intermediaire/avance (expert/admin not in scope for module delivery).
- Points/usage tracking required (connections + actions), with level updates.

## Collaboration rules
- Keep all project coordination context in:
  - `SYNC_CONTEXT.md`
  - `WORKLOG.md`
  - `NEXT_TASKS.md`
  - `DECISIONS.md`
- Never store secrets/tokens in repo files.
