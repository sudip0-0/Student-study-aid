# Lumio API inventory

Response shape (all routes):

- Success: `{ "data": T, "message": string }`
- Error: `{ "error": string }`

Auth: `Authorization: Bearer <accessToken>` on protected routes. Refresh token is an httpOnly cookie scoped to `/api/auth`.

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/api/auth/register` | No | Password ≥10, letter+number |
| POST | `/api/auth/login` | No | Sets refresh cookie |
| POST | `/api/auth/logout` | Cookie | Revokes refresh family |
| POST | `/api/auth/refresh` | Cookie | Rotates refresh; returns accessToken |
| GET | `/api/auth/me` | Yes | Current user (no apiKey plaintext) |
| PATCH | `/api/auth/settings/*` | Yes | Profile, email, password, api-key, model |
| DELETE | `/api/auth/settings/account` | Yes | Transactional user delete |
| GET/POST/PATCH/DELETE | `/api/files/*` | Yes | Ownership-scoped |
| GET/POST/PATCH/DELETE | `/api/folders/*` | Yes | Ownership-scoped |
| GET/POST/PATCH/DELETE | `/api/notes/*` | Yes | Ownership-scoped |
| GET/POST/PATCH/DELETE | `/api/highlights/*` | Yes | Ownership-scoped |
| POST | `/api/upload/file` | Yes | Enqueues extraction job |
| POST | `/api/upload/uploadthing` | UploadThing secret + callback JWT | No body.userId |
| POST | `/api/ai/*` | Yes | Rate-limited via Upstash |
| GET | `/api/search?q=` | Yes | Trigram-backed ILIKE, user-scoped |
| GET | `/api/health` | No | `{ database, redis, uptimeSeconds }` |
| * | `/api/quizzes`, `/flashcards`, `/cheatsheets`, `/chat` | Yes | Study artifacts |

AI calls always go through the server (`ai.service.ts` → OpenRouter). Never call OpenRouter from the client.
