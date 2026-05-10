# Tech Stack & Build System

## Frontend (`client/`)

| Category | Technology |
|----------|-----------|
| Framework | React 19 + TypeScript 5.7 |
| Build Tool | Vite 6 |
| Routing | React Router DOM 6 |
| Server State | TanStack Query 5 |
| UI State | Zustand 5 (UI-only — auth, sidebar) |
| Styling | Tailwind CSS 3 + PostCSS + Autoprefixer |
| Components | shadcn/ui (Radix UI + CVA + tailwind-merge) |
| HTTP Client | Axios (with auth refresh interceptor) |
| Forms | React Hook Form + Zod |
| PDF Viewer | react-pdf / pdfjs-dist |
| Icons | Lucide React |
| Toasts | Sonner |

## Backend (`server/`)

| Category | Technology |
|----------|-----------|
| Runtime | Node.js + Express 4 + TypeScript 5.7 |
| Dev Runner | tsx (watch mode) |
| ORM | Drizzle ORM 0.36 + drizzle-kit 0.28 |
| Database | NeonDB (serverless PostgreSQL) via `postgres` driver |
| File Storage | UploadThing 7 |
| Validation | Zod |
| Auth | jsonwebtoken + bcryptjs |
| Rate Limiting | express-rate-limit |
| Doc Parsing | pdf-parse (PDF), mammoth (DOCX) |
| AI Provider | OpenRouter API (server-side only) |

## Common Commands

### Client
```bash
pnpm dev          # Start Vite dev server (localhost:5173)
pnpm build        # TypeScript check + Vite production build
pnpm preview      # Preview production build locally
```

### Server
```bash
pnpm dev          # Start Express with tsx watch (localhost:3001)
pnpm build        # Compile TypeScript to dist/
pnpm db:push      # Push Drizzle schema changes to NeonDB
pnpm db:studio    # Open Drizzle Studio (DB browser)
```

## TypeScript Configuration

- Target: ES2022
- Module: ES2022 (ESM)
- Module Resolution: bundler
- Strict mode enabled
- Path alias: `@/*` → `./src/*` (server)

## Environment Variables

- `DATABASE_URL` — NeonDB connection string
- `CLIENT_URL` — Frontend origin for CORS (default: http://localhost:5173)
- `PORT` — Server port (default: 3001)
- `VITE_API_URL` — API base URL for frontend (default: /api)
