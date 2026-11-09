# ISW Leuven Website

Terminal-themed info hub for the ISW Leuven student society, live at **https://iswleuven.be**.

A React frontend plus three small APIs, all deployed to Kubernetes by ArgoCD.

> This repo is **public**. Never commit passwords, tokens or filled-in `k8s-secret.yaml` files. See [Secrets](#secrets).

---

## What's in here

```
src/                  # Website (React + TypeScript + Tailwind + Vite)
├── data/
│   └── site-data.tsx # ✏️ MOST CONTENT LIVES HERE (events, board, resources, lokaal, menu, sponsors)
├── pages/            # One file per route (see App.tsx)
├── components/       # Shared UI (PageLayout, TerminalHero, CommandGrid, ...)
├── game/             # The terminal game (engine, maps, NPCs, dialogue)
└── index.css         # Theme colors + CRT effects

food-api/             # /api/*        food & drinks menu for /lokaal + game leaderboard (MariaDB)
members-api/          # /api/members  member sign-up emails (+ members DB later)
door-api/             # /api/door     live "is the lokaal open" status from the door sensor Pi

k8s/                  # Kubernetes manifests, synced to the cluster by ArgoCD
argocd/               # ArgoCD Application (points at k8s/)
.github/workflows/    # CI: builds images and bumps the image tag in k8s/
nginx.conf            # Serves the built website in production
```

### Pages

| Route | Page |
|-------|------|
| `/` | Homepage |
| `/events` | Upcoming activities |
| `/resources` | Study links & tools |
| `/about` | Mission + board members |
| `/contact` | Contact info |
| `/lokaal` | The room: live door status, 3D printer, food & drinks prices |
| `/members`, `/member-signup` | Membership info and sign-up form |
| `/privacypolicy` | Privacy policy |

There are a few more routes that aren't in the menu. They're part of the site's hidden puzzles, so they're not listed here on purpose.

---

## Quick edits

| What | Where |
|------|-------|
| Add event | `src/data/site-data.tsx` → `events` |
| Add board member | `src/data/site-data.tsx` → `boardMembers` |
| Add resource link | `src/data/site-data.tsx` → `resources` |
| Change nav buttons | `src/data/site-data.tsx` → `commands` |
| Lokaal info (location, printer, ...) | `src/data/site-data.tsx` → `lokaalBlocks` |
| Food & drinks prices | In the database / inventory app, **not** in the code (see [food-api](#food-api)) |
| Change colors | `src/index.css` → `:root` variables |
| Edit game maps | `src/game/data.ts` → `FLOOR_1/2/3` |
| Add game enemies | `src/game/data.ts` → `ENEMY_TEMPLATES` |
| Edit game classes | `src/game/data.ts` → `CLASS_DATA` |
| Tweak NPC dialogue | `src/game/data.ts` → `NPC_DIALOGUES` |
| Edit game items | `src/game/data.ts` → `ITEM_TEMPLATES` |

> **Game easter egg:** enter the Konami Code (↑↑↓↓←→←→BA) on the homepage.

---

## Run locally

You need Node 22.18 or newer (the APIs run their `.ts` files directly, without a build step).

```sh
npm install
npm run dev          # website on http://localhost:8080
npm test             # all tests (vitest)
npm run build        # production build into dist/
```

The website works on its own. Pages that use an API fall back to static data when that API isn't running: the menu shows the last known prices and the door shows "Maybe.".

To run the APIs too, start each one in its own terminal. The Vite dev server proxies `/api/*` to them:

| API | Command | Port |
|-----|---------|------|
| food-api | `npm --prefix food-api install && npm --prefix food-api run dev` | 3000 |
| members-api | `PORT=3001 npm --prefix members-api run dev` | 3001 |
| door-api | `PORT=3002 DOOR_SENSOR_TOKEN=test npm --prefix door-api run dev` | 3002 |

food-api needs a MariaDB to talk to (`DB_HOST`, `DB_USER`, ... as env vars). members-api only emails sign-ups and needs `SMTP_*` vars to actually send them.

Each API has `npm run typecheck`.

---

## The APIs

### food-api

- `GET /api/food`: the menu shown on `/lokaal`. It uses the inventory app when `INVENTORY_API_URL` and `INVENTORY_API_TOKEN` are set, and falls back to the database otherwise.
- `/api/scores`: the game leaderboard.
- On startup it applies `food-api/sql/schema.sql` (everything in there must be safe to run again).
- Seed the menu from `food-api/data/food.json`:
  ```sh
  kubectl -n iswleuven exec deploy/food-api -- npm run seed:food
  ```
  After the first seed, the database is the source of truth: edit prices there.

### members-api

- `POST /api/members`: the sign-up form. It emails each sign-up to `MAIL_TO` and stores it in the members DB once that exists (without `DB_HOST` it only emails).

### door-api

- `GET /api/door` → `{ "status": "open" | "closed" | "unknown", "since": "<ISO time>" | null }`
- `POST /api/door` is called by the door sensor Pi with an `X-Door-Token` header. The Pi sends on every change and as a heartbeat every 60 s.
- The status is kept **in memory only**, with no database. After a restart the next heartbeat restores it within a minute.
- If the Pi has been silent for 3 minutes the status becomes `unknown`, unless a Discord bot is configured. In that case it reads the door channel instead.
- The Pi code lives in a separate project (`ISW_Deursensor`), which has its own README for wiring and installation.

---

## Deploying

Everything deploys from `main`:

1. Push to `main`.
2. GitHub Actions builds the changed image(s) and pushes them to `ghcr.io/stray-gleb-tanakov/...`:
   - `package.yaml` builds the website (on every push)
   - `food-api-package.yaml`, `members-api-package.yaml` and `door-api-package.yaml` build an API, only when its folder changed
3. The workflow commits the new image tag into `k8s/*-deployment.yaml` as a `ci: deploy ...` commit.
4. ArgoCD sees the change in `k8s/` and syncs the cluster (namespace `iswleuven`).

The ingress (`k8s/ingress.yaml`) routes `/api/members` → members-api, `/api/door` → door-api, the rest of `/api` → food-api, and everything else → the website.

**A brand-new image is private on GHCR.** The cluster pulls without credentials, so after the first build of a new service go to GitHub → Packages → *that package* → Package settings and set it to **Public**.

The `dev`/`devbranch` branches build a separate dev image (`dev-package.yaml`).

---

## Secrets

Secrets are **never** in git. Each API has a template next to it:

| Template (committed) | Filled in (gitignored) | k8s Secret |
|----------------------|------------------------|------------|
| `food-api/k8s-secret.example.yaml` | `food-api/k8s-secret.yaml` | `food-api-secrets` |
| `members-api/k8s-secret.example.yaml` | `members-api/k8s-secret.yaml` | `members-api-secrets` |
| `door-api/k8s-secret.example.yaml` | `door-api/k8s-secret.yaml` | `door-api-secrets` |

Copy the template, fill it in, and apply it by hand. Then restart the API so it picks up the change:

```sh
kubectl apply -f door-api/k8s-secret.yaml
kubectl -n iswleuven rollout restart deploy/door-api
```

They're kept out of `k8s/` on purpose: ArgoCD syncs that folder and would deploy (and expose) them.

Store the actual values in the society's password manager, so the next board can find them.

- `DOOR_SENSOR_TOKEN` (door-api) must match `website_api_token` in the Pi's `config.py`.
- MariaDB only reads its root/user passwords when the database is **first created**. Changing them in the secret later doesn't change the real password. Use `ALTER USER` inside the database as well.

---

## Tech

React + TypeScript + Tailwind CSS + Vite for the website (served by nginx), Hono on Node for the APIs, MariaDB, Kubernetes + ArgoCD.
