import { Router } from "express";
import {
  summarizeDoc,
  quizDoc,
  flashcardsDoc,
  cheatsheetDoc,
  explainDoc,
  chatDoc,
} from "../controllers/ai.controller";

export const aiRouter = Router();

aiRouter.post("/summarize", summarizeDoc);
aiRouter.post("/quiz", quizDoc);
aiRouter.post("/flashcards", flashcardsDoc);
aiRouter.post("/cheatsheet", cheatsheetDoc);
aiRouter.post("/explain", explainDoc);
aiRouter.post("/chat", chatDoc);
