# AGENTS.md — Developer & AI Agent Guidelines for Sirochan v2

This document provides operational context, technical rules, database schema references, and environment guidelines for developers and AI subagents working on **Sirochan v2**.

---

## 🚀 Development Server Management

When starting the Astro development server, run in background mode as specified by project standards:

```bash
astro dev --background
```

Manage the background server with:
- `astro dev status` — Check server health.
- `astro dev logs` — View live console logs.
- `astro dev stop` — Terminate dev process.

---

## 🛠️ Environment & Microservices Architecture

Agents must respect the multi-service architecture of Sirochan v2:

| Service | Protocol / Base URL | Responsibility |
| :--- | :--- | :--- |
| **Frontend / App** | `http://localhost:4321` | Astro 7 SSR application, UI components, API routes |
| **Loouwd Core** | `http://localhost:8000` | FastAPI adapter registry for manga pages, anime video playback, search |
| **SushiGuard Auth** | `http://localhost:3000` | Bun + Fastify authentication service (`/api/v1/auth/*`) |
| **PostgreSQL 16** | `localhost:5432` (`sirochan_db`) | Relational persistence for profiles, library bookmarks, reading progress |

### Environment Variables (`.env`)
- `DATABASE_URL`: Connection string for PostgreSQL (`postgresql://sirochan:sirochan_secret@localhost:5432/sirochan_db`).
- `LOOUWD_URL`: Microservice URL for media content (`http://localhost:8000`).
- `AUTH_URL`: Microservice URL for authentication (`http://localhost:3000`).

---

## 🗄️ Database & Schema Guidelines (Drizzle ORM)

All database operations must use Drizzle ORM defined in `src/db/schema.ts` and initialized via `src/db/client.ts`.

### Core Tables Summary
1. `users`: Synchronized profile table mapped to Auth `userId` (`email`, `username`, `handle`, `chaptersRead`, `hoursWatched`, `preferredReaderMode`, `preferredStreamQuality`).
2. `media`: Cached catalog metadata for manga/anime titles (`sourceId`, `sourceTitleId`, `title`, `type`, `coverImage`, `bannerImage`, `genres`, `rating`).
3. `chapters`: Manga chapter catalog cache (`mediaId`, `chapterNumber`, `title`, `pageCount`).
4. `episodes`: Anime episode catalog cache (`mediaId`, `episodeNumber`, `title`, `durationSeconds`).
5. `user_progress`: Combined real-time read/watch progress (`userId`, `mediaId`, `contentType`, `contentId`, `lastPageNumber`, `timeMarkerSeconds`, `progressPercent`, `completed`).
6. `bookmarks`: User library bookmarks across folders (`reading`, `watching`, `plan_to_read`, `plan_to_watch`, `completed`, `favorites`).
7. `custom_lists` & `custom_list_items`: Manga stacks & anime playlists.
8. `comments` & `comment_reactions`: Episode and chapter community discussion system.

### Database Commands
- `bun run db:generate`: Create SQL migration file from updated `schema.ts`.
- `bun run db:push`: Synchronize schema directly with PostgreSQL database.

---

## 🔑 Authentication & Strict Authorization Rules

- **Token Extraction**: `src/middleware.ts` extracts JWT tokens from either `sys_access_token` HTTP-only cookies or `Authorization: Bearer <token>` HTTP headers on every incoming request.
- **Session Validation & DB Sync**: Validates token with `AuthClient.getMe(token)` against `http://localhost:3000/api/v1/auth/me`, auto-syncs user profile records in PostgreSQL `users` table, and attaches the profile to `Astro.locals.user`.
- **Strict Route Protection**:
  - **Whitelisted Public Routes**: `/login`, `/api/auth/*`, and static assets (`/_astro/*`, images, scripts).
  - **Protected Page Routes** (`/`, `/discover`, `/library`, `/profile`, `/manga/*`, `/anime/*`, etc.): Unauthenticated visitors are automatically redirected to `/login` (302 Redirect).
  - **Protected API Routes** (`/api/progress/*`, `/api/library/*`): Unauthenticated requests return HTTP `401 Unauthorized`.
  - **Authenticated Visitor Redirect**: Authenticated users visiting `/login` are automatically redirected back to home (`/`).

---

## 🎨 UI & Design System Rules

All new UI components, pages, or modifications MUST adhere strictly to [`DESIGN.md`](./DESIGN.md):

1. **Dark Mode First**:
   - Page canvas background: Pitch black (`#000000` / `var(--bg-deep)`).
   - Container surfaces: `#121212` (`var(--bg-surface)`).
   - Elevated cards/inputs: `#1E1E1E` (`var(--bg-elevated)`).
   - Solid 1px structural borders: `#2A2A2A` (`var(--border-subtle)`).
2. **Color Palette**:
   - Primary Accent: Warm Red (`#E63946`) for active tabs, primary action buttons, and `#1 TRENDING` badges.
   - Secondary Accent: Soft Orange (`#F4A261`) for timeline fills and secondary badges.
3. **Typography**:
   - Display headlines: **Hanken Grotesk** (`var(--font-hero)`).
   - Body & Form inputs: **Inter** (`var(--font-body)`).
   - Technical metadata & badges: **JetBrains Mono** (`var(--font-mono)`).
4. **Interactive Controls**:
   - Always include hover states and touch micro-interactions for buttons and cards.

---

## 📚 Official Documentation & Guides

Consult these Astro documentation guides when working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
