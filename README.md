# Event Aggregator

A platform for discovering, selling and managing event tickets, built by Team Meridian using Scrum (one-week sprints).

- **Organizers** create events and ticket tiers, track sales and attendance, and reward attendees with digital achievement badges.
- **Attendees** browse events, buy tickets, and check in at the door with a QR code.

## Tech stack

| Layer | Tool |
|---|---|
| App (frontend + backend) | Next.js (App Router), React, TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL on Neon |
| ORM | Prisma 7 (with the `@prisma/adapter-pg` driver adapter) |
| Payments | Stripe (test mode) |
| Email | Resend |
| QR codes | `qrcode` (generate), `html5-qrcode` (scan) |
| Tests | Vitest |
| CI | GitHub Actions |
| Hosting | Vercel |

## Getting started

You need Node.js 22 (LTS) or newer and Git.

1. Clone the repo and go into it:
   ```
   git clone https://github.com/Jesse-Kistow/Team-Meridian.git
   cd Team-Meridian
   ```
2. Install the packages. This also runs `prisma generate` automatically:
   ```
   npm install
   ```
3. Create your environment file. Copy `.env.example` to `.env` and fill in the values (ask your teammate privately for `DATABASE_URL`). Use the **direct** Neon connection string, whose host has no `-pooler`.
4. Check that you can reach the database:
   ```
   npx prisma migrate status
   ```
5. Start the app:
   ```
   npm run dev
   ```
   Open http://localhost:3000. The health check at http://localhost:3000/api/health should return `{"ok":true}`.

Never commit `.env` or any real keys.

## Useful commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Generate Next.js types and run the TypeScript check |
| `npx vitest run` | Run the tests |
| `npx prisma generate` | Regenerate the Prisma client after pulling schema changes |
| `npx prisma migrate dev --name <name>` | Create and apply a migration (only when you changed `schema.prisma`) |

We share one development database, so tell your teammate before running a migration, and never run `prisma migrate reset` without agreeing first.

## Project structure

```
app/            Pages and API routes (Next.js App Router)
lib/            Shared code, e.g. the Prisma client (lib/prisma.ts)
prisma/         schema.prisma and migrations
generated/      Prisma client output (git-ignored, created by prisma generate)
.github/        CI workflow and pull request template
```

## How we work

See [CONTRIBUTING.md](CONTRIBUTING.md) for branch names, pull request rules and our Scrum routine, and `docs/product-backlog.md` for the sprint plan.

## Team

Team Meridian