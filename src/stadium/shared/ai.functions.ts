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

function mockReply(lastMsg: string, language: string): string {
  const q = lastMsg.toLowerCase();
  if (q.includes("restroom") || q.includes("bathroom") || q.includes("toilet"))
    return "The nearest restrooms are located at each gate. Follow the signs overhead to the nearest concourse restroom. Accessible stalls are available at all locations.";
  if (q.includes("first") && q.includes("aid"))
    return "First aid stations are at East Gate (E1) and West Concourse (W1). Medical staff are on-site and ready to assist.";
  if (q.includes("food") || q.includes("halal") || q.includes("eat") || q.includes("drink"))
    return "Concession stands are throughout the venue offering halal, vegetarian, vegan, and gluten-free options. Check the Food & Drink page for the full menu.";
  if (q.includes("exit"))
    return "Illuminated exit signs lead to the nearest gate. Follow them and proceed to your designated meeting point outside.";
  if (q.includes("fire") || q.includes("evacuation"))
    return "If you hear an alarm, follow illuminated exit signs to the nearest gate. Do not use elevators. Proceed to your designated assembly point.";
  return "I'm here to help with venue navigation, amenities, and safety. Ask about restrooms, first aid, food, exits, or anything else about the stadium.";
}

export async function stadiumChat(input: unknown) {
  const data = ChatInput.parse(input);
  const lastMsg = data.messages[data.messages.length - 1].content;
  return { reply: mockReply(lastMsg, data.language) };
}

const TranslateInput = z.object({
  text: z.string().min(1).max(2000),
  targetLanguage: z.string().min(2).max(20),
});

export async function stadiumTranslate(input: unknown) {
  const data = TranslateInput.parse(input);
  return { translation: data.text };
}
