# Project Structure

Monorepo with two top-level packages: `client/` (React frontend) and `server/` (Express backend).

```
/
├── AGENTS.md                  # AI agent rules & architecture decisions
├── .env                       # Root environment variables
│
├── client/                    # React frontend (Vite)
│   ├── src/
│   │   ├── App.tsx            # Route definitions (BrowserRouter)
│   │   ├── main.tsx           # Entry point (QueryClient, Toaster)
│   │   ├── index.css          # Tailwind base imports
│   │   ├── components/
│   │   │   ├── ai/            # AI feature panels (Chat, Quiz, Flashcard, Summary, Cheatsheet)
│   │   │   ├── files/         # File management (upload, grid, list, filters, folder tree)
│   │   │   ├── layout/        # App shell, sidebar, breadcrumb, search, keyboard shortcuts
│   │   │   ├── notes/         # Note editor and list
│   │   │   ├── shared/        # Reusable non-UI components (Skeleton)
│   │   │   ├── ui/            # shadcn/ui primitives (button, card, input, label)
│   │   │   └── viewer/        # Document viewers (PDF, DOCX, highlights)
│   │   ├── hooks/index.ts     # ALL TanStack Query hooks (single file)
│   │   ├── lib/
│   │   │   ├── api.ts         # Axios instance with auth interceptor
│   │   │   └── utils.ts       # cn() helper (clsx + tailwind-merge)
│   │   ├── pages/             # Route pages (Dashboard, Login, Register, Study, Quizzes, Settings)
│   │   ├── store/             # Zustand stores (auth.ts, uiStore.ts)
│   │   └── types/             # Shared TypeScript interfaces
│   └── package.json
│
├── server/                    # Express backend
│   ├── src/
│   │   ├── index.ts           # App setup, middleware, route registration
│   │   ├── controllers/       # Request handlers (ai, auth, file, folder, settings, upload)
│   │   ├── routes/            # Express routers (one per resource)
│   │   ├── services/          # Business logic (ai, auth, file, folder, parsing, prompts)
│   │   ├── middleware/        # auth.middleware.ts, error.middleware.ts
│   │   ├── db/
│   │   │   ├── index.ts       # Drizzle DB connection
│   │   │   └── schema/        # Drizzle table schemas + relations
│   │   └── utils/             # asyncHandler, encrypt, truncateText
│   ├── drizzle.config.ts      # Drizzle Kit config
│   └── package.json
│
└── .kiro/steering/            # AI steering documents
```

## Conventions

- **Data fetching**: All hooks live in `client/src/hooks/index.ts` — one centralized file
- **State split**: TanStack Query for server state, Zustand for UI-only state
- **Backend pattern**: routes → controllers → services → DB (Drizzle)
- **API shape**: Success `{ data, message }`, Error `{ error }`
- **Auth**: Every protected route uses `authMiddleware`; DB queries always filter by `userId`
- **Validation**: Zod schemas defined in route files for request body validation
- **Styling**: Tailwind utility classes only — no custom CSS files
- **Components**: shadcn/ui primitives only — no custom component libraries
