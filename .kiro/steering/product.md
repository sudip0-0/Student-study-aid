# Product: Lumio

Lumio is an AI-powered student study aid. Users upload documents (PDF, DOCX, TXT), and the app generates study materials using AI.

## Core Features

- **Document Management** — Upload, organize into folders, view/read documents in-browser
- **AI Summarization** — Generate bullet-point summaries at short/medium/long lengths
- **Quiz Generation** — AI creates multiple-choice quizzes from document content
- **Flashcard Generation** — AI creates flashcard decks for spaced repetition
- **Cheatsheet Generation** — AI produces condensed reference sheets
- **AI Chat** — Conversational Q&A grounded in document content
- **Text Explanation** — Explain highlighted text at simple/moderate/detailed levels
- **Highlights & Notes** — Annotate documents with colored highlights and freeform notes
- **Search** — Full-text search across uploaded files

## Key Design Decisions

- Users provide their own OpenRouter API key (stored AES-256 encrypted server-side)
- AI calls are always proxied through the backend — never called from the frontend
- Multi-model support via OpenRouter (users can switch between AI providers)
- JWT auth with access token in localStorage + refresh token in httpOnly cookie
