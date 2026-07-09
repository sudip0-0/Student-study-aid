# Lumio deployment

## Environment variables

### Server (`server/.env`)

| Variable | Required | Notes |
|----------|----------|--------|
| `DATABASE_URL` | Yes | Neon Postgres connection string (**pooler URL recommended** for production) |
| `JWT_SECRET` | Yes | Access token signing |
| `JWT_REFRESH_SECRET` | Yes | Refresh token signing |
| `UPLOADTHING_SECRET` | Yes | File uploads (UploadThing API secret) |
| `UPLOADTHING_APP_ID` | No | App id if used by client tooling |
| `ENCRYPTION_KEY` | Yes | 64-char hex (32 bytes) for API key encryption |
| `CLIENT_URL` | Prod | e.g. `https://your-app.vercel.app` |
| `CORS_ORIGINS` | No | Comma-separated extra allowed origins |
| `APP_URL` | No | Public app URL (optional) |
| `PORT` | No | Default `3001` |
| `NODE_ENV` | Prod | `production` |

### Client

Set `VITE_API_URL` to your API origin in production (e.g. `https://api.your-app.railway.app`).

Optional: `VITE_UPLOADTHING_APP_ID` if client tooling needs it.

## Database

After schema changes:

```bash
pnpm db:push
```

Use Neon’s **pooled** connection string in production (`DATABASE_URL`).

## Build

```bash
pnpm install
pnpm build
```

Verify locally:

```bash
pnpm build:server
pnpm build:client
pnpm start
# then GET http://localhost:3001/api/health → 200
```

## Run API locally (production build)

```bash
pnpm start
```

## Suggested hosting

### Client — Vercel

1. Import the repo in Vercel (root directory = monorepo root).
2. `vercel.json` already sets install/build/output for the Vite client.
3. Set env: `VITE_API_URL=https://<your-railway-api-host>`
4. Deploy. Public routes: `/` (landing), `/login`, `/register`, `/app/*` (authenticated).

### API — Railway

1. Create a Railway service from this repo.
2. `railway.toml` sets build/start and health check on `/api/health`.
3. Set all **required** server env vars above (use Neon pooler URL).
4. Set `CLIENT_URL` to your Vercel URL so CORS allows credentials.
5. Deploy and confirm `GET /api/health` returns 200 with `database: connected`.

> Hosting dashboards require your own Vercel/Railway/Neon credentials. Config files and env templates are ready; connect accounts and paste secrets to finish go-live.

## Phase 14 smoke checklist

Run against production (or local prod build) after deploy:

1. Register / login / refresh session / **log out** from sidebar
2. Upload PDF, DOCX, TXT (including `.docx` with `application/octet-stream`)
3. Wait for extraction banner → ready; AI panel enabled with API key
4. Study: highlights, Explain on selection, find in document
5. AI: summary (persists on refresh), quiz, flashcards, cheatsheet, Ask Doc (chat persists per file on server)
6. Re-parse failed extraction
7. Move file via sidebar drag or dashboard drop on current folder
8. Global search includes document text
9. `GET /api/health` returns 200
10. First-run checklist appears for new accounts; long docs show AI truncation notice
