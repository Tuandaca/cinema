# Project: CoiCine Turborepo

## Architecture
- **Monorepo Layout**: pnpm workspace managed by Turborepo 2.4.
- **Backend (`apps/api`)**: NestJS 10 REST API with Prisma ORM 5 connecting to PostgreSQL, Redis (ioredis) for distributed locks and caching, JWT authentication with RBAC (`RolesGuard`).
- **Frontend (`apps/web`)**: Next.js 15 App Router, React 19, TailwindCSS, TanStack Query, Axios, Socket.io client, Premium Dark Mode UI (`#0A0A0E`, `#121218`, `#14141D`, `#E5A93C`).
- **Shared Packages (`packages/shared`)**: Shared constants, types, and domain enums (`@cinema/shared`).
- **DevOps**: Multi-stage Dockerfiles (`apps/api/Dockerfile`, `apps/web/Dockerfile`), local composition stack (`docker-compose.yml`), and automated GitHub Actions CI pipeline (`.github/workflows/ci.yml`).

## Code Layout & File Boundaries
To guarantee zero merge conflicts and strictly independent worker execution:
- **Milestone 1 (Admin RBAC & Test Hermeticity)**:
  - `apps/api/src/auth/guards/roles.guard.ts`
  - `apps/api/src/auth/guards/roles.guard.spec.ts`
  - `apps/api/src/admin/admin.service.spec.ts`
  - `apps/api/src/admin/admin.integration.spec.ts`
  - `packages/shared/index.ts`
- **Milestone 2 (Resilient Redis Caching & Invalidation)**:
  - `apps/api/src/redis/redis.module.ts`
  - `apps/api/src/redis/redis.service.ts`
  - `apps/api/src/app.module.ts`
  - `apps/api/src/movies/movies.module.ts`
  - `apps/api/src/movies/movies.service.ts`
  - `apps/api/src/admin/admin.module.ts`
  - `apps/api/src/admin/admin.service.ts`
  - `apps/api/src/movies/movie-sync.service.ts`
  - `apps/api/src/main.ts`
- **Milestone 3 (Offline Font Resilience, SEO Dynamic Metadata & Web Build)**:
  - `apps/web/src/app/layout.tsx`
  - `apps/web/src/app/globals.css`
  - `apps/web/src/app/movies/[id]/page.tsx`
  - `apps/web/src/components/movies/MovieDetailView.tsx`
  - `apps/web/next.config.mjs`
- **Milestone 4 (Multi-stage Docker & GitHub Actions CI)**:
  - `apps/api/Dockerfile`
  - `apps/web/Dockerfile`
  - `docker-compose.yml`
  - `.github/workflows/ci.yml`
  - `package.json`
  - `turbo.json`
- **Milestone 5 (Final Monorepo Verification & Audit Gate)**:
  - Integration testing, build verification (`pnpm build`), typecheck (`tsc --noEmit`), and full test verification (`pnpm --filter api test`).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | RBAC Guard Hardening | Safe check `user?.role` in `RolesGuard` to prevent uncaught TypeError on missing user | M1 | Survey (Explorer 2) |
| 2 | RBAC Guard Unit Tests | Dedicated `roles.guard.spec.ts` testing public, unauthenticated, unauthorized, and authorized ADMIN access | M1 | ORIGINAL_REQUEST §R1 |
| 3 | Admin Service Unit Coverage | Expand `admin.service.spec.ts` unit test suite covering analytics, movies, showtimes, rooms, bookings | M1 | ORIGINAL_REQUEST §R1 |
| 4 | Offline Test Hermeticity | Isolate or mock remote Supabase/Upstash connection in `admin.integration.spec.ts` so `pnpm test` runs 100% offline | M1 | Survey (Explorer 1, 2) |
| 5 | Shared Type Alignment | Reconcile `BookingStatus` enum in `@cinema/shared` (`PAID` instead of `CONFIRMED`) matching Prisma | M1 | Survey (Explorer 1) |
| 6 | Resilient Redis Module & Service | Create `RedisModule` and `RedisService` with in-memory fallback / safe no-op on disconnect | M2 | ORIGINAL_REQUEST §R2 |
| 7 | Read-Through Query Caching | Cache `findAll` (1h), `findOne` (1h), and `getShowtimes` (10m) in `MoviesService` using Redis | M2 | ORIGINAL_REQUEST §R2 |
| 8 | Mutation Cache Invalidation | Auto-invalidate movie list/detail and showtimes cache on admin movie/showtime create/update/delete and sync | M2 | ORIGINAL_REQUEST §R2 |
| 9 | API Port & CORS Alignment | Align default API port in `main.ts` to 3006 and update CORS allowed origins | M2 | Survey (Explorer 1) |
| 10 | Offline Font Loading Resilience | Replace Google Fonts network fetch in `layout.tsx` with CSS system font variables in `globals.css` | M3 | ORIGINAL_REQUEST §R3 |
| 11 | Dynamic Movie SEO Metadata | Export `generateMetadata` for dynamic OpenGraph & Twitter Cards on `/movies/[id]` Server Component | M3 | ORIGINAL_REQUEST §R3 |
| 12 | Next.js Standalone Build Config | Enable `output: 'standalone'` in `apps/web/next.config.mjs` for optimized Docker build | M3 | Survey (Explorer 3) |
| 13 | Multi-stage NestJS Dockerfile | Create `apps/api/Dockerfile` using multi-stage node:20-alpine build with pnpm prune | M4 | ORIGINAL_REQUEST §R4 |
| 14 | Multi-stage Next.js Dockerfile | Create `apps/web/Dockerfile` using multi-stage build leveraging `.next/standalone` output | M4 | ORIGINAL_REQUEST §R4 |
| 15 | Local Docker Compose Stack | Create `docker-compose.yml` orchestrating `postgres:16`, `redis:7-alpine`, `api`, and `web` | M4 | ORIGINAL_REQUEST §R4 |
| 16 | GitHub Actions CI Workflow | Create `.github/workflows/ci.yml` running checkout, pnpm setup, typecheck, lint, test, and build | M4 | ORIGINAL_REQUEST §R4 |
| 17 | Root Monorepo Pipeline Scripts | Add `test` and `typecheck` tasks to root `package.json` and `turbo.json` | M4 | Survey (Explorer 1) |
| 18 | Monorepo Build & Test Verification | Validate `pnpm build`, `tsc --noEmit`, and `pnpm --filter api test` passing 100% | M5 | ORIGINAL_REQUEST §Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1: Admin RBAC & Unit Test Hermeticity | Guard hardening, `roles.guard.spec.ts`, `admin.service.spec.ts`, test isolation, `@cinema/shared` enum | none | DONE |
| 2 | M2: Resilient Redis Cache & Invalidation | `RedisModule`, `RedisService` fallback, Movies caching, Admin invalidation, port alignment | M1 | DONE |
| 3 | M3: Offline Font Resilience & Dynamic SEO | `layout.tsx` font fix, `globals.css`, `/movies/[id]` `generateMetadata`, `next.config.mjs` standalone | none | DONE |
| 4 | M4: Multi-stage Docker & GitHub Actions CI | `apps/api/Dockerfile`, `apps/web/Dockerfile`, `docker-compose.yml`, `.github/workflows/ci.yml`, `turbo.json` | M3 | DONE |
| 5 | M5: Monorepo Verification & Audit Gate | `pnpm build`, `tsc --noEmit`, `pnpm --filter api test`, Code Reviewer & Forensic Auditor | M1, M2, M3, M4 | DONE |

## Interface Contracts

### Backend Redis Caching Contract
```typescript
export interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: any, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  delPattern(pattern: string): Promise<void>;
  isAvailable(): boolean;
}
```
- Cache Key Format:
  - Movie list: `movies:list:<genre>:<page>:<limit>`
  - Movie detail: `movies:detail:<id>`
  - Movie showtimes: `movies:showtimes:<id>`
- Invalidation Triggers:
  - `createMovie`, `updateMovie`, `deleteMovie`, `syncTrendingMovies` -> Invalidate `movies:list:*` and `movies:detail:<id>`.
  - `createShowtime`, `updateShowtime`, `deleteShowtime` -> Invalidate `movies:showtimes:*`.

### Frontend Dynamic Metadata Contract
```typescript
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata>
```
- Await `params` first (Next.js 15 requirement).
- Fetch movie by `id`. Fallback to sensible defaults if movie not found.
- Returns `title`, `description`, `openGraph` (title, description, images, type `video.movie`), and `twitter` (card `summary_large_image`).
