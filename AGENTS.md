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
| **PostgreSQL 16** | `localhost:5433` (`sirochan_db`) | Relational persistence for profiles, library bookmarks, reading progress |

### Environment Variables (`.env`) & Strict Error Rules
- `DATABASE_URL`: Connection string for PostgreSQL (`postgresql://sirochan:sirochan_secret@localhost:5433/sirochan_db`).
- `LOOUWD_URL`: Microservice URL for media content (`http://localhost:8000` on host, or `http://host.docker.internal:8000` when running app in Docker).
- `AUTH_URL`: Microservice URL for authentication (`http://localhost:3000` on host, or `http://host.docker.internal:3000` when running app in Docker).

> [!CAUTION]
> **Strict Environment Fallback Rule**: NEVER hardcode fallback default strings for `DATABASE_URL` or `LOOUWD_URL` in codebase files (e.g. `client.ts` or `apiService.ts`). If an environment variable is omitted from `.env`, code MUST throw an explicit, readable `Error` exception so the user can supply the exact value.

---

## 🗄️ Database & Schema Guidelines (Drizzle ORM)

All database operations must use Drizzle ORM defined in `src/db/schema.ts` and initialized via `src/db/client.ts`.

### Core Tables Summary
1. `users`: Synchronized profile table mapped to Auth `userId` (`username`, `handle`, `avatar`, `chaptersRead`, `hoursWatched`, `readingStreakDays`, `preferredReaderMode`, `preferredStreamQuality`).
2. `media`: Cached catalog metadata for manga/anime titles (`sourceId`, `sourceTitleId`, `title`, `type`, `coverImage`, `bannerImage`, `genres`, `rating`).
3. `chapters`: Manga chapter catalog cache (`mediaId`, `chapterNumber`, `title`, `pageCount`).
4. `episodes`: Anime episode catalog cache (`mediaId`, `episodeNumber`, `title`, `durationSeconds`).
5. `user_progress`: Combined real-time read/watch progress (`userId`, `mediaId`, `contentType`, `contentId`, `contentNumber`, `timeMarkerSeconds`, `progressPercent`, `lastReadOrWatchedAt`).
6. `bookmarks`: User library bookmarks across folders (`reading`, `watching`, `in_progress`, `bookmarks`, `favorites`).
7. `custom_lists` & `custom_list_items`: Manga stacks & anime playlists.
8. `comments` & `comment_reactions`: Episode and chapter community discussion system.

### Database & Quality Commands
- `bun run db:generate`: Create SQL migration file from updated `schema.ts`.
- `bun run db:push`: Synchronize schema directly with PostgreSQL database.
- `bun astro check`: Run TypeScript diagnostic check across all 44 Astro components & TypeScript files.

---

## 🔒 Privacy Protection & Route Architecture

- **Opaque Token Encryption ([privacy.ts](file:///c:/Users/ammar/Desktop/sirochan-v2/src/utils/privacy.ts))**:
  - `encodePrivacySlug(sourceId, titleId, contentId)` converts target metadata into opaque hash tokens.
  - `decodePrivacySlug(token)` decodes tokens on SSR page load.
- **Privacy Routes**:
  - `/v/[token]` — Media detail view.
  - `/read/[token]` — Manga reader view.
  - `/watch/[token]` — Anime player view.
- **Strict Privacy Rule**: Browser address bar, window title, tab label, browser history, and network logs MUST reveal zero plain text titles, genres, or chapter/episode numbers.

---

## 🔑 Authentication & Strict Authorization Rules

- **Dual Cookie & 7-Day Refresh Architecture**:
  - `sys_access_token`: Short-lived access token (15-minute expiration).
  - `sys_refresh_token`: Long-lived refresh token (7-day expiration limit).
- **Automatic SSR Token Renewal**:
  - `src/middleware.ts` extracts `sys_access_token` and `sys_refresh_token` HTTP-only cookies on every request.
  - If `sys_access_token` is expired but `sys_refresh_token` is valid, `middleware.ts` transparently calls `AuthClient.refreshToken(refreshToken)` (`POST /api/v1/auth/refresh`), updates access cookies, and keeps the user logged in seamlessly.
  - If `sys_refresh_token` is expired (> 7 days) or invalid, cookies are cleared and the user is redirected to `/login`.
- **Session Validation & DB Sync**: Validates active access token with `AuthClient.getMe(token)` against `AUTH_URL`, auto-syncs user profile records in PostgreSQL `users` table, and attaches profile to `Astro.locals.user`.
- **Strict Route Protection**:
  - **Whitelisted Public Routes**: `/login`, `/api/auth/*`, and static assets (`/_astro/*`, images, scripts).
  - **Protected Page Routes** (`/`, `/discover`, `/library`, `/profile`, `/v/*`, `/read/*`, `/watch/*`, etc.): Unauthenticated visitors are automatically redirected to `/login` (302 Redirect).
  - **Protected API Routes** (`/api/progress/*`, `/api/library/*`): Unauthenticated requests return HTTP `401 Unauthorized`.
  - **Authenticated Visitor Redirect**: Authenticated users visiting `/login` are automatically redirected back to home (`/`).

---

## 🎨 UI, Viewport & Design System Rules

All UI components and page modifications MUST adhere strictly to [`DESIGN.md`](./DESIGN.md) and responsive multi-screen standards:

1. **Responsive Viewports**:
   - Mobile (`< 768px`): Bottom Navigation Bar (`NavigationBar.astro`), compact 115px spotlight banner, single-column responsive media grid.
   - Tablet (`768px – 1024px`): Collapsed Left Rail Sidebar Navigation (`SidebarNav.astro`).
   - Desktop (`≥ 1024px`): Full vertical Sidebar Navigation with user streak badge and profile widget.
2. **Dark Mode First**:
   - Page canvas background: Pitch black (`#000000` / `var(--bg-deep)`).
   - Container surfaces: `#121212` (`var(--bg-surface)`).
   - Elevated cards/inputs: `#1E1E1E` (`var(--bg-elevated)`).
   - Solid 1px structural borders: `#2A2A2A` (`var(--border-subtle)`).
3. **Color Palette**:
   - Primary Accent: Warm Red (`#E63946`) for active tabs, primary action buttons, and `#1 TRENDING` badges.
   - Secondary Accent: Soft Orange (`#F4A261`) for timeline fills and secondary badges.
4. **Typography**:
   - Display headlines: **Hanken Grotesk** (`var(--font-hero)`).
   - Body & Form inputs: **Inter** (`var(--font-body)`).
   - Technical metadata & badges: **JetBrains Mono** (`var(--font-mono)`).

---

## 📚 Official Documentation & Guides

Consult these Astro documentation guides when working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
