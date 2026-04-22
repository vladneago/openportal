# 🌐 OpenPortal

**The Open Source Enterprise Collaboration Platform**

OpenPortal unifică și depășește funcționalitățile oferite de SharePoint — totul într-o singură aplicație, disponibilă atât on-premises cât și în cloud.

## Quick Start

### Prerequisites

- **Node.js** 20+
- **pnpm** 9+ (`npm install -g pnpm`)
- **Docker** & Docker Compose

### 1. Clone & Install

```bash
git clone https://github.com/your-org/openportal.git
cd openportal
cp .env.example .env.local
pnpm install
```

### 2. Start Infrastructure

```bash
pnpm docker:dev
```

This starts PostgreSQL, Redis, Meilisearch, MinIO, and Mailpit.

### 3. Setup Database

```bash
pnpm db:push
```

### 4. Start Development Servers

```bash
pnpm dev
```

- **Frontend:** http://localhost:3000
- **API:** http://localhost:4000
- **API Health:** http://localhost:4000/api/health
- **Meilisearch:** http://localhost:7700
- **MinIO Console:** http://localhost:9001 (openportal / openportal_dev)
- **Mailpit:** http://localhost:8025

## Project Structure

```
openportal/
├── apps/
│   ├── web/          # Next.js frontend
│   ├── api/          # Hono backend API
│   └── mobile/       # React Native (placeholder)
├── packages/
│   ├── db/           # Drizzle ORM schema & migrations
│   ├── shared/       # Shared TypeScript types
│   ├── ui/           # Shared UI components
│   └── config/       # Shared configs
├── docker/           # Docker Compose files
├── docs/             # Documentation
└── scripts/          # Utility scripts
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, TailwindCSS, TipTap |
| Backend | Hono, Node.js, Zod, Jose (JWT) |
| Database | PostgreSQL 16, Drizzle ORM |
| Cache | Redis 7 |
| Search | Meilisearch |
| Storage | MinIO (on-prem) / S3 (cloud) |
| Auth | Custom JWT + Keycloak (OIDC) |
| Monorepo | Turborepo, pnpm workspaces |

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all dev servers |
| `pnpm build` | Build all packages |
| `pnpm lint` | Lint all packages |
| `pnpm type-check` | TypeScript type checking |
| `pnpm test` | Run all tests |
| `pnpm docker:dev` | Start infrastructure |
| `pnpm docker:dev:down` | Stop infrastructure |
| `pnpm db:push` | Push schema to database |
| `pnpm db:studio` | Open Drizzle Studio |

## License

AGPL-3.0 — See [LICENSE](LICENSE) for details.
