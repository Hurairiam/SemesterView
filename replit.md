# SemesterView

SemesterView is a local-data ULAB academic assistant that brings CSE schedules, exams, rooms, faculty research, and advisor discovery into one personalized semester view.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/semesterview/src/App.tsx` — routed student and teacher experiences.
- `artifacts/semesterview/src/data.ts` — normalization and derived schedule/room/course data.
- `artifacts/semesterview/src/index.css` — SemesterView visual tokens and responsive styling.
- `artifacts/semesterview/src/data/exams.json` — normalized undergraduate midterm workbook records.
- `attached_assets/` — supplied semester plan, faculty source, exam workbook, and product brief.

## Architecture decisions

- The first prototype is frontend-only and uses the supplied local datasets directly; user choices use localStorage.
- Course, faculty, day, and time normalization is kept in a small data layer so inconsistent source formatting does not leak into UI logic.
- Missing values stay explicit as TBA or empty states rather than being fabricated.
- Student and teacher flows share normalized source data but have separate role-specific navigation and dashboards.

## Product

- Students can demo-login with a ULAB ID, select CSE courses, view a generated schedule, find free rooms, review exams and calendar events, search faculty and research, select an advisor, and save research interests.
- Teachers can demo-login from the supplied faculty records and view their day-by-day and full recurring teaching schedule plus research context.

## User preferences

- Prioritize a reliable, polished hackathon demo over unnecessary backend complexity.
- Use the uploaded datasets as the source of truth and do not implement Google OAuth.

## Gotchas

- The source schedule includes non-array markers for some days; the normalization layer must treat those days as empty.
- The app is local-data only for the prototype; no database or external authentication is required for the core flows.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
