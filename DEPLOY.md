# Lumio deployment

## Topology

```
Vercel (Vite client) ──► Railway (Express API) ──► Neon Postgres
                              │
                              ├──► Upstash Redis (rate limits + job locks)
                              └──► UploadThing (file blobs)
```

Single-region Railway API + Upstash + Neon is the supported production shape. Scale API replicas only after Redis is configured — rate limits and extraction locks require it.

## Environment variables

### Server (`server/.env`)

| Variable | Required | Notes |
|----------|----------|--------|
| `DATABASE_URL` | Yes | Neon Postgres connection string (**pooler URL recommended** for production) |
| `JWT_SECRET` | Yes | Access token signing |
| `JWT_REFRESH_SECRET` | Yes | Refresh token signing |
| `UPLOADTHING_SECRET` | Yes | File uploads (UploadThing API secret) |
| `UPLOADTHING_APP_ID` | No | App id if used by client tooling |
| `UPLOAD_CALLBACK_SECRET` | Prod | HMAC secret for signed upload callbacks (defaults to `JWT_SECRET` if unset in dev) |
| `ENCRYPTION_KEY` | Yes | 64-char hex (32 bytes) for API key encryption |
| `UPSTASH_REDIS_REST_URL` | Prod | Upstash REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Prod | Upstash REST token |
| `CLIENT_URL` | Prod | e.g. `https://your-app.vercel.app` |
| `CORS_ORIGINS` | No | Comma-separated extra allowed origins |
| `APP_URL` | No | Public app URL (optional) |
| `PORT` | No | Default `3001` |
| `NODE_ENV` | Prod | `production` |

### Client

Set `VITE_API_URL` to your API origin in production (e.g. `https://api.your-app.railway.app`).

Optional: `VITE_UPLOADTHING_APP_ID` if client tooling needs it.

## Database

Generate migrations after schema changes:

```bash
pnpm db:generate
pnpm db:migrate
```

`pnpm db:push` is for local prototyping only — **do not use push in production**.

Use Neon’s **pooled** connection string in production (`DATABASE_URL`).

## Upstash Redis

1. Create a Redis database in Upstash (same region as Railway if possible).
2. Copy REST URL + token into `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`.
3. Confirm `GET /api/health` returns `redis: "connected"`.

Without Redis in development, rate limiting allows traffic and job locks use a local in-memory fallback.

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
3. Set all **required** server env vars above (use Neon pooler URL + Upstash).
4. Set a **release command** (or pre-deploy): `pnpm db:migrate`.
5. Set `CLIENT_URL` to your Vercel URL so CORS allows credentials.
6. Deploy and confirm `GET /api/health` returns 200 with `database: connected` and `redis: connected`.

> Hosting dashboards require your own Vercel/Railway/Neon/Upstash credentials. Config files and env templates are ready; connect accounts and paste secrets to finish go-live.

## Smoke checklist

Run against production (or local prod build) after deploy:

1. Register / login / refresh session / **log out** from sidebar
2. Hard-reload after login — session recovers via httpOnly refresh cookie (access token is memory-only)
3. Upload PDF, DOCX, TXT (including `.docx` with `application/octet-stream`)
4. Wait for extraction banner → ready; AI panel enabled with API key
5. Study: highlights, Explain on selection, find in document
6. AI: summary (persists on refresh), quiz, flashcards, cheat sheets, Ask Doc
7. Re-parse failed extraction
8. Move file via sidebar drag or dashboard drop on current folder
9. Global search includes document text
10. `GET /api/health` returns 200 with database + redis
