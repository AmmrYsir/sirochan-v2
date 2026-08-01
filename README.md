# Sirochan v2 — Modern Japanese Editorial Manga Reader & Anime Streaming Platform

Sirochan v2 is a high-performance, dark-mode unified platform for **Manga Reading** and **Anime Streaming**, designed around the **Modern Japanese Editorial** design philosophy (high contrast dark mode, pitch black canvas, authoritative typography, and warm red `#E63946` accents).

---

## 🌟 Key Features & Improvements

- **Mobile-First & Multi-Screen Viewport Architecture**:
  - **Mobile (< 768px)**: Ergonomic glassmorphic bottom navigation bar (`NavigationBar.astro`), compact spotlight cards, touch-optimized swipe containers.
  - **Tablet (768px – 1024px)**: Left Rail Sidebar Navigation (`SidebarNav.astro`) with icon tooltips and compact branding.
  - **Laptop & Desktop (1024px – 1440px)**: Full vertical Sidebar Navigation with menu items (*Home*, *Discover*, *Library*, *Profile*), day streak counter, user status widget, and collapse/expand toggle.
  - **Ultra-Wide Screens (> 1440px / 1600px+)**: Fluid multi-column media grids scaling up to 6–8 columns on 4K/2K desktop monitors.
- **Privacy Protection & URL Obfuscation Layer**:
  - Converts readable title and chapter URLs into short, anonymous, encrypted hash tokens ([privacy.ts](file:///c:/Users/ammar/Desktop/sirochan-v2/src/utils/privacy.ts)).
  - **Anonymous Protected Routes**: Media Details (`/v/[token]`), Manga Reader (`/read/[token]`), Anime Player (`/watch/[token]`).
  - Browser address bars, window titles, tab labels, browser history, and network logs reveal **ZERO plain text titles, categories, or chapter numbers**.
- **Comprehensive Local Caching & Disk Thumbnail Storage**:
  - Automatically downloads remote cover binaries server-side and persists them to local disk (`./public/cache/covers/[mediaId].jpg`).
  - Saves local thumbnail static paths and full metadata into PostgreSQL `media` table on every bookmark or reading/watching progress update.
  - **Instant Cache Re-use**: Dashboard (*Continue Reading / Continue Watching*) and **My Library** instantly render cached database records with 0 network latency.
  - **Manual Re-Cache Action ("SYNC / RE-CACHE")**: Detail pages include an interactive button to re-fetch live metadata and update the local thumbnail binary on demand (`POST /api/media/recache`).
  - **Browsing Exemption**: Discover (`/discover`), Source catalog pages (`/sources/*`), and Search remain 100% live API requests.
- **Strict Environment Validation**:
  - Strict validation for `DATABASE_URL` and `LOOUWD_URL` in `.env` without assuming or hardcoding silent fallbacks.

---

## 🛠️ Architecture & Microservices

Sirochan v2 operates as an integrated frontend & local backend orchestrating two core microservices:

```
┌─────────────────────────────────────────────────────────────┐
│                      Sirochan v2 App                        │
│             (Astro 7 + Bun + Drizzle ORM + SSR)            │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
  HTTP / SSE   │                              │ HTTP / REST
               ▼                              ▼
┌─────────────────────────────┐  ┌─────────────────────────────┐
│     Loouwd Microservice     │  │   SushiGuard Auth Service   │
│  (FastAPI Source Adapters)  │  │    (Bun + Fastify Auth)    │
│    http://localhost:8000    │  │    http://localhost:3000    │
└─────────────────────────────┘  └─────────────────────────────┘
               │                              │
               └──────────────┬───────────────┘
                              │
                              ▼
               ┌──────────────────────────────┐
               │    PostgreSQL 16 Database    │
               │  (Host 5433 / Container 5432)│
               └──────────────────────────────┘
```

1. **Loouwd Microservice Core (`LOOUWD_URL`)**: FastAPI multi-source registry providing title catalog feeds, chapter image reader pages, anime HLS/MP4 playback URLs, tag autocompletion, SSE real-time search streams, and health checks.
2. **SushiGuard Auth Microservice (`AUTH_URL`)**: Enterprise Bun + Fastify authentication service providing user registration, login, JWT bearer/cookie session management (`sys_access_token` and 7-day `sys_refresh_token` automatic token renewal), email verification, API keys, and passkeys.
3. **PostgreSQL 16 Database**: Orchestrated via Drizzle ORM on host port `5433` to prevent port collisions with other local Postgres instances running on port `5432`.

---

## 🚀 Quick Start

### 1. Requirements
- **Bun** >= 1.2
- **Node.js** >= 22.12.0
- **PostgreSQL** 16 (running locally or via Docker Compose)

### 2. Environment Setup

Copy `.env.example` to `.env` and set your credentials:

```bash
cp .env.example .env
```

```env
# Database connection string (Port 5433 avoids conflict with existing local Postgres on 5432)
DATABASE_URL=postgresql://sirochan:sirochan_secret@localhost:5433/sirochan_db

# Microservice Endpoints
LOOUWD_URL=http://localhost:8000
AUTH_URL=http://localhost:3000
```

### 3. Install Dependencies & Push DB Schema

```bash
bun install
bun run db:push
```

### 4. Run Development Server

```bash
bun dev
```

Visit the app at [http://localhost:4321](http://localhost:4321).

---

## 🧞 Available Commands

| Command | Action |
| :--- | :--- |
| `bun dev` | Starts local dev server at `localhost:4321` |
| `bun astro check` | Runs full TypeScript diagnostic check across all 44 Astro components |
| `bun run build` | Builds the production SSR bundle to `./dist/` |
| `bun run start` | Runs production SSR standalone server entrypoint (`dist/server/entry.mjs`) |
| `bun run preview` | Previews production build locally |
| `bun run db:generate` | Generates new Drizzle ORM SQL migration files |
| `bun run db:push` | Pushes current `schema.ts` directly to PostgreSQL database |
| `bun run db:migrate` | Applies pending SQL migrations |

---

## 📂 Project Structure

```text
/
├── drizzle/                # Database SQL migration files & snapshots
├── public/                 # Static assets (favicons, fonts)
├── src/
│   ├── components/
│   │   ├── common/         # Badges, Buttons, Lightbox ImageViewer
│   │   ├── layout/         # Header, NavigationBar, SidebarNav
│   │   ├── media/          # HeroBanner, AnimeCard, MangaCard, EditorialItem
│   │   ├── player/         # Custom AnimePlayer video player component
│   │   └── reader/         # Custom MangaReader canvas component
│   ├── db/
│   │   ├── apiService.ts   # Loouwd microservice API client
│   │   ├── client.ts       # Drizzle PostgreSQL connection client
│   │   └── schema.ts       # Drizzle ORM database schema definitions
│   ├── layouts/            # MainLayout shell with adaptive sidebar/bottom-bar wrapper
│   ├── lib/
│   │   └── authClient.ts   # SushiGuard Auth microservice client
│   ├── pages/
│   │   ├── api/            # Server endpoints (auth, progress, library/bookmark)
│   │   ├── read/           # Privacy-protected Manga Reader route (/read/[token])
│   │   ├── watch/          # Privacy-protected Anime Player route (/watch/[token])
│   │   ├── v/              # Privacy-protected Media Detail route (/v/[token])
│   │   ├── [sourceId]/     # Legacy catalog viewer routes
│   │   ├── discover.astro  # Catalog search & genre filters
│   │   ├── index.astro     # Editorial home feed with live items & spotlight banner
│   │   ├── library.astro   # Real user bookmark & progress library
│   │   ├── login.astro     # Japanese Editorial Login UI
│   │   └── profile.astro   # User statistics & reader preferences dashboard
│   ├── styles/             # Global CSS design tokens & responsive grid utilities
│   ├── utils/
│   │   └── privacy.ts      # Privacy token encoder/decoder utility
│   ├── middleware.ts       # Astro JWT session & PostgreSQL profile sync middleware
│   └── env.d.ts            # Astro App.Locals typing declarations
├── .env.example            # Environment variables template
├── docker-compose.yml      # Local Docker container orchestrator (Postgres on port 5433)
├── drizzle.config.ts       # Drizzle Kit configuration
└── package.json            # Project dependencies & scripts
```

---

## 🎨 Design System

Sirochan v2 follows the **Japanese Editorial** design specification detailed in [`DESIGN.md`](./DESIGN.md):
- **Base Canvas**: Pitch black (`#000000`) for media letterboxing and reader canvases.
- **Surfaces**: `#121212` for card containers; `#1E1E1E` for elevated modals, dropdowns, and form inputs.
- **Typography**: Display headlines in **Hanken Grotesk**, body text in **Inter**, technical metadata in **JetBrains Mono**.
- **Accents**: Warm Red (`#E63946`) for primary actions and active states; Soft Orange (`#F4A261`) for timeline indicators.
