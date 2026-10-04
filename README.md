# CPF Group Analytics Dashboard

A prototype multi-subsidiary analytics dashboard for CPF Group — Rukisha, CPF Financial
Services and CPF Capital & Advisory — built for a CPF Group finance manager. All data is
illustrative dummy data; see the Phase 1 Scope Note for what's in and out of scope.

**Picking this project up fresh (human or AI)? Read [`docs/HANDOFF.md`](docs/HANDOFF.md)
first** — it states current status, what's verified vs. assumed, and exactly what's left,
in that order. This README covers setup; HANDOFF.md covers "where things actually stand."

Built against the Software Design Document (`docs/Phase 3 - Design (Software Design
Document).docx`) and the Week 7 & 8 Execution Plan in `docs/`.

## Tech stack

- **Next.js** (App Router) + **TypeScript** — application framework, hosted on Vercel
- **Postgres via Supabase** — system of record, subsidiary-partitioned schema
- **Python + pandas + Faker** — dummy data generation (`data/`)
- **GitHub Actions** — CI (format check, lint, build) on every push/PR
- **Vercel** — CI/CD deployment and hosting
- **ESLint + Prettier + Husky + lint-staged** — code quality, enforced locally and in CI

## Local setup

```bash
npm install
cp .env.local.example .env.local   # fill in your own Supabase project values
npm run dev                        # http://localhost:3000
```

### Python environment (dummy data)

```bash
cd data
python -m venv .venv
.venv\Scripts\activate             # Windows; use `source .venv/bin/activate` on macOS/Linux
pip install -r requirements.txt
python seed.py                     # generates and loads the dummy dataset
```

## Scripts

| Command                | Purpose                               |
| ---------------------- | ------------------------------------- |
| `npm run dev`          | Start the local dev server            |
| `npm run build`        | Production build (same check CI runs) |
| `npm run lint`         | ESLint                                |
| `npm run format`       | Prettier — write                      |
| `npm run format:check` | Prettier — check only (what CI runs)  |

## Git workflow

- **Commit messages** follow [Conventional Commits](https://www.conventionalcommits.org/):
  `feat: add default rate tile`, `fix: handle zero-denominator in repayment rate`,
  `chore: update eslint config`, `docs: update README setup steps`.
- A **pre-commit hook** (Husky + lint-staged) runs ESLint and Prettier on staged files
  before every commit.
- **CI** (`.github/workflows/ci.yml`) runs a format check, lint and build on every push and
  pull request to `main`; a failing check blocks the merge.

## One-time manual setup (not automatable from this repo)

These three steps need your own GitHub, Vercel and Supabase accounts — do them once, in
this order:

### 1. GitHub repository

```bash
git add -A
git commit -m "chore: initial Next.js scaffold, CI, and tooling (Phase 4)"
```

Then, on [github.com](https://github.com), create a new **empty** repository (no README/
.gitignore/license — this project already has them), and push:

```bash
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git branch -M main
git push -u origin main
```

### 2. Vercel

1. Sign in at [vercel.com](https://vercel.com) with your GitHub account.
2. **Add New → Project**, and import the repository you just pushed.
3. Vercel auto-detects Next.js — leave the default build settings.
4. Add the same environment variables from `.env.local` under **Project Settings →
   Environment Variables** (so the deployed app can reach Supabase).
5. Deploy. Every push to `main` will now auto-deploy to production, and every pull request
   gets its own preview deployment.

### 3. Supabase

1. Sign in at [supabase.com](https://supabase.com) and create a new project.
2. Once provisioned, go to **Project Settings → API** and copy the Project URL and the
   `anon` and `service_role` keys into your `.env.local` (and into Vercel's environment
   variables, step 2 above).
3. Go to **Project Settings → Database** and copy the connection string into
   `DATABASE_URL` in `.env.local` — this is what `data/seed.py` uses to load the dummy
   dataset.
4. Run the schema migrations (added in Phase 5) and then `python data/seed.py` to populate
   the dummy data.

## Project structure

```
src/           Next.js application (App Router)
data/          Python dummy-data generation (requirements.txt, seed.py)
.github/       GitHub Actions CI workflow
.husky/        Pre-commit hook
```
