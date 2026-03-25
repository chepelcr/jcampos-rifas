# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite (Tailwind CSS, shadcn/ui)
- **Export**: Puppeteer (PDF + PNG)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── rifas/              # Raffle management React app (previewPath: /)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
├── pnpm-workspace.yaml     # pnpm workspace
├── tsconfig.base.json      # Shared TS options
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## Application: Gestor de Rifas

A raffle management web app in Spanish supporting:

- **Raffles**: Create/edit/delete raffles with name, description, draw date, price per number
- **Raffle Types**: Single amount prize or multiple prizes
- **Numbers**: 0-100 grid, available (white) or sold (gray + X)
- **Buyers**: Name, phone, email; can buy multiple numbers; no duplicate numbers
- **Draw**: Random selection, displays winners
- **Export**: PDF and PNG image via Puppeteer

### DB Schema (`lib/db/src/schema/raffles.ts`)

- `raffles` — raffle data (name, description, draw date, price, type, status, prizes)
- `raffle_numbers` — 101 numbers per raffle (0-100), status available/sold, buyer FK
- `buyers` — buyer info per raffle
- `winners` — draw results

### API Routes (`artifacts/api-server/src/routes/raffles.ts`)

- `GET /api/raffles` — list all raffles
- `POST /api/raffles` — create raffle (auto-generates 101 numbers 0-100)
- `GET /api/raffles/:id` — get detail (with numbers, buyers, winners)
- `PUT /api/raffles/:id` — update raffle
- `DELETE /api/raffles/:id` — delete raffle
- `POST /api/raffles/:id/draw` — perform draw
- `GET /api/raffles/:id/numbers` — list numbers
- `POST /api/raffles/:id/numbers/:number/assign` — assign number to buyer
- `POST /api/raffles/:id/numbers/:number/release` — release number
- `GET /api/raffles/:id/buyers` — list buyers
- `GET /api/raffles/:id/export/pdf` — export as PDF (Puppeteer)
- `GET /api/raffles/:id/export/image` — export as PNG (Puppeteer)

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — only emit `.d.ts` files during typecheck
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/rifas` (`@workspace/rifas`)

React + Vite frontend raffle management app in Spanish. Served at `/`.

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes in `src/routes/`.

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL.

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI 3.1 spec + Orval codegen config.

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec.
