import { z } from "zod";

const ChatInput = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string().max(4000),
      }),
    )
    .min(1)
    .max(30),
  language: z.string().max(20).default("en"),
  seat: z.string().max(60).optional(),
});

export async function stadiumChat(input: unknown) {
  const data = ChatInput.parse(input);
  const key = import.meta.env.VITE_LOVABLE_API_KEY ?? "";
  if (!key) throw new Error("Missing LOVABLE_API_KEY — set VITE_LOVABLE_API_KEY");

  const system = `You are Guardian AI, the friendly, calm safety concierge for Metropolis Stadium.
- Answer in ${data.language} unless the user writes in another language.
- Fan seat context: ${data.seat ?? "unknown"}.
- Give short, direct answers (2-3 sentences).
- Topics you know well: nearest restroom, first-aid, food & drink, exits, gates (N/E/S/W), fire safety, evacuation, security, lost items, family services.
- When a request needs human staff, end with: "I've flagged staff to help you."
- Never invent match scores or ticket data.`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [{ role: "system", content: system }, ...data.messages],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`AI gateway failed [${res.status}]: ${body}`);
  }
  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const reply = json.choices?.[0]?.message?.content ?? "I'm here — try again.";
  return { reply };
}

const TranslateInput = z.object({
  text: z.string().min(1).max(2000),
  targetLanguage: z.string().min(2).max(20),
});

export async function stadiumTranslate(input: unknown) {
  const data = TranslateInput.parse(input);
  const key = import.meta.env.VITE_LOVABLE_API_KEY ?? "";
  if (!key) throw new Error("Missing LOVABLE_API_KEY — set VITE_LOVABLE_API_KEY");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "system",
          content: `Translate the user's text to ${data.targetLanguage}. Reply ONLY with the translation, nothing else.`,
        },
        { role: "user", content: data.text },
      ],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Translate failed [${res.status}]: ${body}`);
  }
  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return { translation: json.choices?.[0]?.message?.content?.trim() ?? "" };
}
