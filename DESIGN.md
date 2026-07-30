---
name: Sirochan Editorial System
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#c4c7c8'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#8e9192'
  outline-variant: '#444748'
  surface-tint: '#c6c6c7'
  primary: '#ffffff'
  on-primary: '#2f3131'
  primary-container: '#e2e2e2'
  on-primary-container: '#636565'
  inverse-primary: '#5d5f5f'
  secondary: '#ffb3b1'
  on-secondary: '#680011'
  secondary-container: '#ad0224'
  on-secondary-container: '#ffb8b5'
  tertiary: '#ffffff'
  on-tertiary: '#4e2600'
  tertiary-container: '#ffdcc4'
  on-tertiary-container: '#955419'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c7'
  on-primary-fixed: '#1a1c1c'
  on-primary-fixed-variant: '#454747'
  secondary-fixed: '#ffdad8'
  secondary-fixed-dim: '#ffb3b1'
  on-secondary-fixed: '#410007'
  on-secondary-fixed-variant: '#92001c'
  tertiary-fixed: '#ffdcc4'
  tertiary-fixed-dim: '#ffb780'
  on-tertiary-fixed: '#2f1400'
  on-tertiary-fixed-variant: '#6f3800'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
  surface-deep: '#000000'
  surface-default: '#121212'
  surface-elevated: '#1E1E1E'
  border-subtle: '#2A2A2A'
  text-muted: '#A0A0A0'
  text-dim: '#666666'
  accent-red: '#E63946'
  accent-orange: '#F4A261'
typography:
  hero-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  hero-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.01em
  title-xl:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  title-lg:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  section-header:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  body-main:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  metadata:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 12px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1440px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style Philosophy

The **Sirochan v2** design system is rooted in the **"Modern Japanese Editorial"** aesthetic—a philosophy that prioritizes high content density, distraction-free legibility, and high-contrast dark mode. It draws inspiration from physical manga magazine mastheads and modern editorial platforms like Apple and Linear.

### Core Principles
- **Dual-App Integration:** Unifies **Manga Reader** and **Anime Streaming** into a single cohesive interface without fragmenting user flows.
- **Content-First Mentality:** The UI acts as a transparent, high-contrast frame for vibrant manga covers, anime stills, and video content.
- **Precision Editorial Typography:** Heavy, authoritative display headlines (**Hanken Grotesk**) paired with clean body text (**Inter**) and technical mono metadata (**JetBrains Mono**).
- **Structured Grid System:** Built on a strict 8pt spatial grid for predictable vertical rhythm and horizontal alignment across mobile, tablet, and desktop viewports.

---

## Color System

The system operates on a **Dark Mode First** logic. The palette is intentionally restricted:

- **Canvas Base:** `#000000` is reserved for media letterboxing, video backgrounds, and reader canvases.
- **Surfaces:** `#121212` defines section containers; `#1E1E1E` defines elevated modals, dropdowns, and floating toolbars.
- **Outlines & Borders:** Solid 1px borders of `#2A2A2A` provide clean, shadowless structural boundaries.
- **Accents:** 
  - **Warm Red (`#E63946`):** Primary action buttons, active navigation states, `#1 TRENDING` badges, and progress bar fills.
  - **Soft Orange (`#F4A261`):** Secondary progression (video timelines, quality tags, streak indicators).
- **Text & Hierarchy:** Pure White (`#ffffff`) for titles; Soft White (`#e5e2e1`) for body text; Muted Gray (`#A0A0A0`) for metadata and section headers; Dim Gray (`#666666`) for background accents.

---

## Typography Hierarchy

- **Hero Headings (`hero-lg`):** **Hanken Grotesk** 800-weight, uppercase, tight tracking (`-0.02em`), line height `1.05`. Used for master banners (e.g. *CHAINSAW MAN*, *Blue Lock*).
- **Section Headers (`section-header`):** **Hanken Grotesk** 600-weight, `14px` (`16px` on desktop), uppercase, `0.05em` letter-spacing, `#A0A0A0` muted gray.
- **Card Titles:** **Hanken Grotesk** 700-weight, `15px`, line height `20px`.
- **Body Text (`body-main` / `body-sm`):** **Inter** 400-weight, 1.6x line height for comfortable reading of descriptions and synopses.
- **Technical Metadata (`metadata`):** **JetBrains Mono** 500-weight, `11px`, uppercase, `0.02em` tracking for timestamps (`4M AGO`, `YESTERDAY`), episode markers (`S1 EP. 11 • 12:45 / 23:10`), and chapter numbers (`CH. 256`).

---

## Navigation Architecture

### Bottom Navigation Bar (Mobile / Touch Devices)
The fixed bottom navigation consists strictly of **4 core sections**:
1. **Home (`/`):** Media feed featuring Hero Showcase, User Greeting ("Good evening, Arata"), Continue Reading (3:4 cards), Continue Watching (16:9 cards), Trending Spotlight, 2x2 Media Grid, and Curated Editorials.
2. **Discover (`/discover`):** Live search, media type toggle (*All*, *Manga*, *Anime*), and genre filter chips (*Action*, *Dark Fantasy*, *Sports*, *Drama*, *Sci-Fi*, *Supernatural*).
3. **Library (`/library`):** Filter tabs for *In Progress*, *Bookmarks*, *Favorites*, and *History*.
4. **Profile (`/profile`):** User stats (Chapters Read, Hours Watched, Day Streak) and settings (Reader mode: Single vs Continuous, Stream default: 1080p HD).

*Note: On desktop devices (≥ 768px), navigation transitions smoothly to a top sticky header bar.*

---

## Component Specifications

### 1. Media Cards
- **Manga Card:** Vertical **3:4 ratio** portrait cover. Rounded corners (`12px` / `--radius-md`). `#E63946` red progress bar track at the bottom. Title and chapter metadata placed below.
- **Anime Card:** Horizontal **16:9 ratio** landscape thumbnail. Rounded corners (`12px` / `--radius-md`). Includes hover play overlay, `#E63946` red progress bar fill, episode number, and timestamp.

### 2. Interactive Manga Reader
- **Route:** `/manga/[id]/[chapter]`
- **Canvas:** Fullscreen pitch-black (`#000000`) canvas. Supports continuous vertical scrolling or single page navigation.
- **Top Bar:** Floating semi-transparent toolbar with back action, manga title, chapter picker dropdown.
- **Bottom Controls:** Floating bar with page slider, Page indicator ("Page 1 of 4"), and Previous/Next buttons.

### 3. Interactive Anime Video Player
- **Route:** `/anime/[id]/[episode]`
- **Video Skin:** HTML5 video container with custom overlay controls.
- **Controls:** Play/Pause button, time display (`12:45 / 23:10`), progress bar fill (`#F4A261`), quality badge (`1080p HD`), and Fullscreen trigger.
- **Overlay Action:** **SKIP INTRO (+85s) ⚡** pill button overlay in bottom right.
- **Episode Carousel:** Next episodes scrollable list below player.

---

## Technical Stack & Deployment

- **Framework:** Astro 7 (TypeScript strict mode).
- **Package Manager:** Bun (`bun install`, `bun run build`).
- **Containerization:** Multi-stage `Dockerfile` (`oven/bun:1`).
- **Database Layer:** PostgreSQL 16 database orchestrated via `docker-compose.yml` and `docker/init.sql` schema (`users`, `media`, `chapters`, `episodes`, `user_progress`, `bookmarks`).