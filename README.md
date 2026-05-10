# Lumio 🌟

> **Illuminate your learning.** Upload documents, annotate, take notes, and let AI help you study smarter.

Lumio is a student learning platform that turns passive document reading into an active, AI-assisted study experience. Upload your PDFs, DOCX files, and text documents — then highlight, annotate, chat with your content, generate quizzes, flashcards, summaries, and cheat sheets — all in one place.

---

## ✨ Features

### 📁 File & Organization
- Upload PDF, DOCX, and TXT files
- Organize files into color-coded folders with nested hierarchy
- Drag and drop files between folders
- Search across all your documents

### 📖 Study Tools
- **Document Viewer** — read PDFs page by page inside the app
- **Text Highlighting** — select any text and save with color-coded highlights (yellow, green, pink, blue)
- **Inline Notes** — markdown-powered notes attached to any document
- **Highlight Browser** — see all your highlights in one panel with jump-to-location

### 🤖 AI Features (powered by OpenRouter)
- **Summarize** — get a concise summary of any document
- **Quiz Generator** — generate MCQ or True/False quizzes and attempt them in-app
- **Flashcard Generator** — create flip-card decks from document content
- **Cheat Sheet** — auto-structured key points, definitions, and formulas
- **Explain This** — plain-English explanation of selected or highlighted text
- **Ask Your Doc** — chat with your document in a Q&A interface

---

## 🧱 Tech Stack

| Layer         | Technology                                      |
|---------------|-------------------------------------------------|
| Frontend      | React 18 + Vite + TypeScript                    |
| Styling       | Tailwind CSS + shadcn/ui                        |
| State         | TanStack Query + Zustand                        |
| Backend       | Node.js + Express + TypeScript                  |
| Database      | PostgreSQL via NeonDB (serverless)              |
| ORM           | Drizzle ORM                                     |
| Auth          | JWT (access + refresh tokens) + bcrypt          |
| File Storage  | UploadThing                                     |
| File Parsing  | pdf-parse + mammoth                             |
| AI            | OpenRouter (user-supplied API key)              |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- pnpm (recommended) or npm
- A [NeonDB](https://neon.tech) account and database
- A [UploadThing](https://uploadthing.com) account
- An [OpenRouter](https://openrouter.ai) API key (for testing AI features)

### 1. Clone & Install

```bash
git clone https://github.com/your-username/lumio.git
cd lumio

# Install server dependencies
cd server && pnpm install

# Install client dependencies
cd ../client && pnpm install
```

### 2. Configure Environment Variables

**Server** — create `server/.env`:
```env
DATABASE_URL=postgresql://...        # Your NeonDB connection string
JWT_SECRET=your-256-bit-secret
JWT_REFRESH_SECRET=your-refresh-secret
ENCRYPTION_KEY=your-32-byte-hex-key  # For encrypting user API keys at rest
UPLOADTHING_SECRET=sk_live_...
UPLOADTHING_APP_ID=your-app-id
APP_URL=http://localhost:5173
PORT=3001
```

**Client** — create `client/.env`:
```env
VITE_API_URL=http://localhost:3001
VITE_UPLOADTHING_APP_ID=your-app-id
```

### 3. Set Up the Database

```bash
cd server
pnpm drizzle-kit push     # Push schema to NeonDB
```

### 4. Run the App

```bash
# In /server
pnpm dev

# In /client (separate terminal)
pnpm dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:3001

---

## 🗂️ Project Structure

```
lumio/
├── client/         # React + Vite frontend
├── server/         # Node.js + Express backend
├── README.md
├── AGENTS.md       # Agent/AI coding instructions
├── PROGRESS.md     # Feature development tracker
└── PROMPT.md       # Master prompt for agent CLI tools
```

See `PROMPT.md` for full detailed structure, database schema, API endpoints, and coding conventions.

---

## 🔑 OpenRouter API Key

Lumio uses **your own OpenRouter API key** — it's never shared and is stored encrypted in the database. You can set it in **Settings → API Key** after creating an account. No key is bundled with the app.

Get a free key at [openrouter.ai](https://openrouter.ai).

---

## 📦 Key Scripts

| Command                         | Description                      |
|---------------------------------|----------------------------------|
| `server: pnpm dev`              | Start backend in watch mode      |
| `server: pnpm drizzle-kit push` | Sync schema to NeonDB            |
| `server: pnpm drizzle-kit studio` | Open Drizzle Studio (DB GUI)  |
| `client: pnpm dev`              | Start frontend dev server        |
| `client: pnpm build`            | Build for production             |

---

## 🔐 Security Notes

- Passwords hashed with bcrypt (12 rounds)
- OpenRouter API keys encrypted with AES-256 before storage
- JWT access tokens expire in 15 minutes; refresh tokens in 7 days
- Refresh tokens stored in httpOnly cookies (not accessible to JS)
- All user data is scoped — users can only access their own files

---

## 🛣️ Roadmap

- [ ] Spaced repetition reminders
- [ ] Concept map / mind map generator
- [ ] Web clipper (save links/articles)
- [ ] Collaborative shared folders
- [ ] Export cheat sheets as PDF
- [ ] Mobile app (React Native)

---

## 📄 License

MIT