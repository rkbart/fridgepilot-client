# FridgePilot Client

Browser frontend for **FridgePilot** — a smart pantry, recipe, and grocery-list manager with an optional AI assistant.

Built with **React 19**, **TypeScript**, and **Vite**, styled with a minimal custom CSS design system.

## Repositories

- **This repo (client):** <https://github.com/rkbart/fridgepilot-client>
- **API:** <https://github.com/rkbart/fridgepilot-api>
- **Parent:** <https://github.com/rkbart/fridgepilot>

## Tech stack

- [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev) (build tool + dev server with HMR)
- [React Router v7](https://reactrouter.com) (SPA routing)
- [Oxlint](https://oxc.rs/docs/guide/usage/linter/rules) (linting)

## Getting started

Prerequisites: Node.js 18+ and the API running (see [fridgepilot-api](https://github.com/rkbart/fridgepilot-api)).

```bash
npm install
cp .env.example .env   # set VITE_API_URL if needed
npm run dev
```

Open <http://localhost:5173>.

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3001` | Base URL of the FridgePilot API |

Create a `.env` file (see `.env.example`). Only `VITE_*` variables are exposed to the browser.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server with HMR |
| `npm run build` | Type-check (`tsc -b`) and build for production |
| `npm run lint` | Lint with Oxlint |
| `npm run preview` | Preview the production build locally |

## Pages

| Route | Page | Description |
|---|---|---|
| `/login` | Login | Sign in with email/password (JWT) |
| `/signup` | Signup | Create an account |
| `/pantry` | Pantry | Add / edit / delete items you have on hand; duplicate names (case-insensitive) are rejected |
| `/recipes` | Recipes | Manage your recipes and view AI suggestions |
| `/grocery-lists` | Grocery lists | Create lists; add / edit / delete / check off items with quantity + unit dropdown |
| `/ai-suggestions` | AI suggestions | AI recipe suggestions based on pantry contents |
| `/settings` | Settings | Configure your AI provider API key & endpoint |

## Structure

```
src/
├── App.tsx               # Router + auth-aware layout
├── components/
│   ├── RequireAuth.tsx    # Redirects unauthenticated users to /login
│   ├── ChevronActions.tsx # Row with a chevron-reveal Edit/Delete action panel
│   └── EditModal.tsx      # Generic field-driven edit modal (bottom-sheet on mobile, centered card on desktop)
├── pages/                # One component per route
├── services/
│   └── api.ts            # API client (fetch wrapper, JWT handling, typed endpoints)
└── styles/               # Global CSS design system
```

The API client in `src/services/api.ts` handles the JWT bearer token (stored in `localStorage`), typed requests for every endpoint, and shared constants such as `UNITS` (unit-of-measurement options used by grocery items).

## Deployment

- **Vercel** — configured via `vercel.json` (build command `npm run build`, output `dist`, SPA rewrites). Deploy with `vercel --prod`.
- **Docker** — `Dockerfile` serves the built app via nginx, which also proxies `/api/` and `/auth/` to the backend (used by the parent repo's `docker-compose.yml`).

## License

All rights reserved. No license is granted for redistribution or commercial use without prior written permission.