# Contributing (team working agreement)

This is how the two of us work. Change it by agreement in a retrospective.

## Branches
- Never commit directly to `main`.
- One branch per story or task, named by type:
  - `feature/ticket-tiers`
  - `fix/login-redirect`
  - `chore/update-readme`
- Keep branches short-lived (1-2 days) and merge often. Long branches cause painful merge conflicts.
- Every morning, before starting work:
  ```
  git checkout main
  git pull
  ```
  Then pull `main` into your branch if you're mid-story.

## Commits
- Small, focused commits with a message that says what changed: `Add ticket tier validation`.
- Don't commit `.env` files, keys or `node_modules`.

## Pull requests
1. Push your branch and open a PR using the template.
2. Wait for CI (lint, typecheck, tests) to go green.
3. The **other person** reviews and approves. Nobody merges their own PR without an approval.
4. The author merges, then deletes the branch.

Reviewing means actually reading the code: does it do what the story says, is anything unclear, is anything secret in there. Ask questions in comments. That is how both of us understand the whole codebase.

## Before opening a PR
```
npm run lint
npm run typecheck
```

## Database and packages
- **Schema changes:** tell your teammate *before* editing `prisma/schema.prisma`, merge schema PRs quickly, and commit the new `prisma/migrations` folder. After pulling a schema change, run `npx prisma generate`. Only the author runs `migrate dev`, because we share one database.
- **Adding a package on purpose:** commit `package.json` and `package-lock.json` together and tell your teammate to pull and run `npm install`.
- **Didn't add anything?** If `package-lock.json` shows as modified after `npm install`, run `git restore package-lock.json` instead of committing it.
- Keep `prisma`, `@prisma/client` and `@prisma/adapter-pg` on the same version (currently 7.10.1). Don't upgrade major versions mid-sprint.

## Secrets
- Real keys live only in `.env` / `.env.local` and in Vercel's environment settings.
- Share secrets privately (direct message or password manager), never in the repo, an issue or a PR.
- Stripe stays in **test mode** until we deliberately go live.

## Definition of Done
A story is done when:
- The code is reviewed and approved by the other person.
- CI is green and the PR is merged to `main`.
- It is deployed to staging (Vercel) and works there.
- It meets the story's acceptance criteria and can be demoed.

## Scrum routine (one-week sprints)
| When | What |
|---|---|
| Day 1 | Sprint planning: pick stories from the top of the backlog, aiming for about 80% of capacity (the other 20% is buffer for bugs and carry-over) |
| Daily | 15-minute stand-up: what I did, what I'm doing, what's blocking me |
| Last day | Sprint review (demo what works), then retrospective (what to keep, change, try) |

**Roles:** we are both developers. One of us is **Product Owner** (orders the backlog, accepts stories) and the other is **Scrum Master** (runs the meetings, removes blockers). We swap every few sprints.

**Board:** GitHub Projects with the columns Backlog, Sprint, In Progress, In Review, Done.