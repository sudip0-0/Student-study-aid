# Lumio deployment

## Environment variables

### Server (`server/.env`)

| Variable | Required | Notes |
|----------|----------|--------|
| `DATABASE_URL` | Yes | Neon Postgres connection string (pooler URL recommended) |
| `JWT_SECRET` | Yes | Access token signing |
| `JWT_REFRESH_SECRET` | Yes | Refresh token signing |
| `UPLOADTHING_TOKEN` | Yes | File uploads |
| `ENCRYPTION_KEY` | Yes | 32-byte hex for API key encryption |
| `CLIENT_URL` | Prod | e.g. `https://your-app.vercel.app` |
| `PORT` | No | Default `3001` |

### Client

Set `VITE_API_URL` to your API origin in production (e.g. `https://api.your-app.railway.app`).

## Database

After schema changes:

```bash
pnpm db:push
```

## Build

```bash
pnpm install
pnpm build
```

## Run API locally (production build)

```bash
pnpm start
```

## Suggested hosting

- **Client**: Vercel (`vercel.json` included) — set `VITE_API_URL`
- **API**: Railway (`railway.toml` included) — set env vars, enable health check on `/api/health`

## Phase 14 smoke checklist

1. Register / login / refresh session
2. Upload PDF, DOCX, TXT (including `.docx` with `application/octet-stream`)
3. Wait for extraction banner → ready; AI panel enabled with API key
4. Study: highlights, Explain on selection, find in document
5. AI: summary, quiz, flashcards, cheatsheet, Ask Doc (chat persists per file)
6. Re-parse failed extraction
7. Move file via sidebar drag or dashboard drop on current folder
8. Global search includes document text
9. `GET /api/health` returns 200
