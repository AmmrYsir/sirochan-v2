# Sirochan v2 — Modern Japanese Editorial Manga Reader & Anime Streaming Platform

Sirochan v2 is a high-performance, dark-mode unified platform for **Manga Reading** and **Anime Streaming**, designed around the **Modern Japanese Editorial** design philosophy (high contrast dark mode, pitch black canvas, authoritative typography, and warm red `#E63946` accents).

---

## 🌟 Architecture & Microservices

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

1. **Loouwd Microservice Core (`http://localhost:8000`)**: FastAPI multi-source registry providing title catalog feeds, chapter image reader pages, anime HLS/MP4 playback URLs, tag autocompletion, SSE real-time search streams, and health checks.
2. **SushiGuard Auth Microservice (`http://localhost:3000`)**: Enterprise Bun + Fastify authentication service providing user registration, login, JWT bearer/cookie session management, email verification, API keys, and passkeys.
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
| `bun run build` | Builds the production SSR bundle to `./dist/` |
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
│   │   ├── layout/         # Header, NavigationBar
│   │   ├── media/          # HeroBanner, AnimeCard, MangaCard, EditorialItem
│   │   ├── player/         # Custom AnimePlayer video player component
│   │   └── reader/         # Custom MangaReader canvas component
│   ├── db/
│   │   ├── apiService.ts   # Loouwd microservice API client
│   │   ├── client.ts       # Drizzle PostgreSQL connection client
│   │   └── schema.ts       # Drizzle ORM database schema definitions
│   ├── layouts/            # MainLayout shell
│   ├── lib/
│   │   └── authClient.ts   # SushiGuard Auth microservice client
│   ├── pages/
│   │   ├── api/            # Server endpoints (auth, progress, bookmarks)
│   │   ├── [sourceId]/     # Title details and Chapter/Episode viewer routes
│   │   ├── discover.astro  # Catalog search & genre filters
│   │   ├── index.astro     # Editorial home feed
│   │   ├── library.astro   # User bookmark library
│   │   ├── login.astro     # Japanese Editorial Login UI
│   │   └── profile.astro   # User statistics & reader preferences
│   ├── styles/             # Global CSS design tokens
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
