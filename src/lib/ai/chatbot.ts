// ============================================================
// AI CHATBOT — Groq API (Tawa Services Assistant)
// ============================================================

import { env } from "@/env";

const SYSTEM_PROMPT = `Tu es l'assistant virtuel de Tawa Services, une plateforme tunisienne de mise en relation entre clients et prestataires de services à domicile (plomberie, électricité, ménage, cours, etc.). Tu réponds en français, en arabe standard, ou en dialecte tunisien selon la langue du message de l'utilisateur. Tu es amical, concis et utile. Voici ce que tu sais sur la plateforme: 1) Les clients peuvent rechercher des services par catégorie et ville, réserver un prestataire, payer en ligne (carte, D17, Flouci) ou en espèces. 2) Les prestataires doivent s'inscrire, vérifier leur identité (KYC: CIN + selfie + justificatif), puis créer leurs services avec prix et disponibilités. 3) Commission de 12% prélevée sur chaque transaction. 4) Système d'avis bidirectionnel après chaque service. 5) Messagerie intégrée entre client et prestataire. 6) Politique d'annulation: remboursement 100% si >48h avant, partiel 24-48h, 0% si <24h. Si tu ne connais pas la réponse, dis-le poliment et suggère de contacter le support via la page Contact.`;

const FALLBACK_MESSAGE =
  "Désolé, je suis temporairement indisponible. Veuillez réessayer.";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

/**
 * Send a message to the Tawa chatbot via Groq API.
 * Returns the assistant's response text.
 */
export async function chatWithBot(
  message: string,
  history: ChatMessage[],
): Promise<string> {
  if (!env.GROQ_API_KEY) {
    return FALLBACK_MESSAGE;
  }

  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history,
    { role: "user", content: message },
  ];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages,
          max_tokens: 300,
          temperature: 0.7,
        }),
        signal: controller.signal,
      },
    );

    clearTimeout(timeout);

    if (!response.ok) {
      console.error(
        "[chatWithBot] Groq API error:",
        response.status,
        await response.text(),
      );
      return FALLBACK_MESSAGE;
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim();
    return reply || FALLBACK_MESSAGE;
  } catch (error) {
    console.error("[chatWithBot] Error:", error);
    return FALLBACK_MESSAGE;
  }
}
