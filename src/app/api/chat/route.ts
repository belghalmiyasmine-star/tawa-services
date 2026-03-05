import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { chatWithBot, type ChatMessage } from "@/lib/ai/chatbot";

// Simple in-memory rate limiter: sessionId -> timestamps[]
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT = 20;
const WINDOW_MS = 60_000; // 1 minute

function isRateLimited(sessionId: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(sessionId) ?? [];

  // Remove expired entries
  const valid = timestamps.filter((t) => now - t < WINDOW_MS);

  if (valid.length >= RATE_LIMIT) {
    rateLimitMap.set(sessionId, valid);
    return true;
  }

  valid.push(now);
  rateLimitMap.set(sessionId, valid);
  return false;
}

// Periodically clean stale entries (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of rateLimitMap) {
    const valid = timestamps.filter((t) => now - t < WINDOW_MS);
    if (valid.length === 0) {
      rateLimitMap.delete(key);
    } else {
      rateLimitMap.set(key, valid);
    }
  }
}, 300_000);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, history, sessionId } = body as {
      message?: string;
      history?: ChatMessage[];
      sessionId?: string;
    };

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Le message est requis." },
        { status: 400 },
      );
    }

    // Rate limit by sessionId (falls back to IP-based identifier)
    const clientId =
      sessionId ||
      request.headers.get("x-forwarded-for") ||
      "anonymous";

    if (isRateLimited(clientId)) {
      return NextResponse.json(
        { error: "Trop de messages. Veuillez patienter une minute." },
        { status: 429 },
      );
    }

    const sanitizedHistory: ChatMessage[] = Array.isArray(history)
      ? history
          .filter(
            (m) =>
              (m.role === "user" || m.role === "assistant") &&
              typeof m.content === "string",
          )
          .slice(-20) // Keep only last 20 messages for context
      : [];

    const reply = await chatWithBot(message.trim(), sanitizedHistory);

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("[POST /api/chat] Error:", error);
    return NextResponse.json(
      { error: "Erreur serveur. Veuillez réessayer." },
      { status: 500 },
    );
  }
}
