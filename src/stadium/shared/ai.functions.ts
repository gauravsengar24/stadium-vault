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

const zoneInfo: Record<string, { name: string; exits: string; amenities: string }> = {
  N1: { name: "North Concourse", exits: "Gate N (North Exit)", amenities: "Restrooms, Concession Stand C4" },
  N2: { name: "North Upper", exits: "Gate N (North Exit)", amenities: "Family Room, Restrooms, Water Station" },
  E1: { name: "East Gate", exits: "Gate E (East Exit)", amenities: "First Aid Station, Ticket Booth" },
  E2: { name: "East Concourse", exits: "Gate E (East Exit)", amenities: "Restrooms, Concession Stand B2, Merchandise" },
  S1: { name: "South Field", exits: "Gate S (South Exit)", amenities: "Concession Main Court, Lost & Found" },
  S2: { name: "South Upper", exits: "Gate S (South Exit)", amenities: "Restrooms, Water Station" },
  W1: { name: "West Concourse", exits: "Gate W (West Exit)", amenities: "First Aid Station, Concession Stand A1" },
  W2: { name: "West Gate", exits: "Gate W (West Exit)", amenities: "Parking Structure B, Restrooms, ATM" },
};

function seatContext(seat?: string): string {
  if (!seat) return "";
  const zone = seat.match(/\(([^)]+)\)/)?.[1];
  const info = zone ? zoneInfo[zone] : null;
  if (info) return ` You're in ${info.name}. Nearest exit: ${info.exits}. Nearby: ${info.amenities}.`;
  return "";
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

interface Intent {
  name: string;
  weight: number;
  keywords: { term: string; score: number }[];
  responses: ((query: string, ctx: string) => string)[];
}

const intents: Intent[] = [
  {
    name: "greeting",
    weight: 1,
    keywords: [
      { term: "hi", score: 3 }, { term: "hello", score: 3 }, { term: "hey", score: 3 },
      { term: "good morning", score: 5 }, { term: "good evening", score: 5 },
      { term: "good afternoon", score: 5 }, { term: "howdy", score: 4 },
      { term: "sup", score: 2 }, { term: "yo", score: 2 }, { term: "what's up", score: 3 },
    ],
    responses: [
      (q, ctx) => `Hey there! Welcome to Guardian AI.${ctx}\n\nI'm your stadium guide — ask me about directions, food, safety, or anything you need to make your visit better. What can I help with?`,
      (q, ctx) => `Hi! Guardian AI here, ready to assist.${ctx}\n\nNeed help finding something? I can point you to restrooms, food, first aid, exits, or help with any situation. What's on your mind?`,
      (q, ctx) => `Hello! I'm your AI concierge for today's event.${ctx}\n\nWhether you need directions, food recommendations, or safety info — just ask. How can I help you?`,
    ],
  },
  {
    name: "how_are_you",
    weight: 1,
    keywords: [
      { term: "how are you", score: 5 }, { term: "how's it going", score: 5 },
      { term: "how do you do", score: 4 }, { term: "you good", score: 3 },
      { term: "what's good", score: 2 },
    ],
    responses: [
      (q, ctx) => `Doing great, thanks for asking!${ctx}\n\nAll systems are running smoothly and I'm here to help. What do you need assistance with?`,
      (q, ctx) => `I'm fully operational and ready to assist!${ctx}\n\nHow can I make your stadium experience better today?`,
    ],
  },
  {
    name: "thanks",
    weight: 1,
    keywords: [
      { term: "thanks", score: 4 }, { term: "thank you", score: 5 },
      { term: "thx", score: 3 }, { term: "ty", score: 2 }, { term: "appreciate it", score: 4 },
      { term: "thank you so much", score: 5 }, { term: "cheers", score: 2 },
    ],
    responses: [
      (q, ctx) => `You're very welcome!${ctx}\n\nGlad I could help. If you need anything else, just ask. Enjoy the event!`,
      (q, ctx) => `Happy to help!${ctx}\n\nI'm always here if you need anything. Have a fantastic time at the stadium!`,
    ],
  },
  {
    name: "goodbye",
    weight: 1,
    keywords: [
      { term: "bye", score: 4 }, { term: "goodbye", score: 5 }, { term: "see you", score: 4 },
      { term: "cya", score: 2 }, { term: "farewell", score: 4 }, { term: "later", score: 2 },
      { term: "see ya", score: 3 },
    ],
    responses: [
      (q, ctx) => `Take care and enjoy the rest of your time at the stadium!${ctx}\n\nIf you need anything, you know where to find me.`,
      (q, ctx) => `Goodbye!${ctx}\n\nStay safe and have a great time. I'm always a message away if you need help!`,
    ],
  },
  {
    name: "restroom",
    weight: 5,
    keywords: [
      { term: "restroom", score: 5 }, { term: "bathroom", score: 5 }, { term: "toilet", score: 5 },
      { term: "washroom", score: 5 }, { term: "loo", score: 4 }, { term: "lavatory", score: 4 },
      { term: "potty", score: 3 }, { term: "i need to pee", score: 5 },
      { term: "i need to go", score: 3 }, { term: "where can i pee", score: 5 },
      { term: "wc", score: 4 },
    ],
    responses: [
      (q, ctx) => `You can find restrooms at every gate and concourse level throughout the stadium.${ctx}\n\nJust follow the blue wayfinding signs overhead — they clearly mark the nearest restrooms. All locations have accessible stalls and baby changing facilities available.`,
      (q, ctx) => `Restrooms are conveniently located at all gates and concourse areas.${ctx}\n\nThe closest ones should be visible from the signage overhead — look for the blue restroom signs. Family restrooms with changing tables are also available at each location.`,
      (q, ctx) => `Heading to the restroom? They're at every gate and concourse.${ctx}\n\nFollow the overhead signage to the nearest one. All are well-maintained and stocked throughout the event. Accessible stalls are available at every restroom location.`,
    ],
  },
  {
    name: "first_aid",
    weight: 5,
    keywords: [
      { term: "first aid", score: 5 }, { term: "medic", score: 5 }, { term: "paramedic", score: 5 },
      { term: "hurt", score: 4 }, { term: "injury", score: 5 }, { term: "bleeding", score: 5 },
      { term: "unconscious", score: 5 }, { term: "heart attack", score: 5 },
      { term: "medical", score: 4 }, { term: "doctor", score: 4 }, { term: "nurse", score: 4 },
      { term: "ambulance", score: 5 }, { term: "sick", score: 3 },
      { term: "feel dizzy", score: 4 }, { term: "fell down", score: 4 },
      { term: "emergency", score: 3 },
    ],
    responses: [
      (q, ctx) => `First Aid stations are staffed at East Gate (Zone E1) and West Concourse (Zone W1), with paramedics ready to assist.${ctx}\n\nIf you can't reach a station, flag down any staff member — they can radio for help and dispatch medical personnel to your location immediately. If it's urgent, don't wait — call out to the nearest staff member.`,
      (q, ctx) => `Medical help is available right away.${ctx}\n\nThere are First Aid stations at East Gate (Zone E1) and West Concourse (Zone W1) with trained medical staff. For immediate assistance, any venue staff member can radio for a rapid medical response to your exact location.`,
    ],
  },
  {
    name: "food",
    weight: 4,
    keywords: [
      { term: "food", score: 4 }, { term: "eat", score: 3 }, { term: "hungry", score: 4 },
      { term: "concession", score: 5 }, { term: "restaurant", score: 3 },
      { term: "snack", score: 3 }, { term: "lunch", score: 3 }, { term: "dinner", score: 3 },
      { term: "drink", score: 3 }, { term: "coffee", score: 3 }, { term: "pizza", score: 3 },
      { term: "hot dog", score: 3 }, { term: "burger", score: 3 }, { term: "taco", score: 3 },
      { term: "menu", score: 3 }, { term: "order", score: 3 }, { term: "buy food", score: 4 },
      { term: "something to eat", score: 4 },
    ],
    responses: [
      (q, ctx) => `There are concession stands throughout the venue with plenty of options.${ctx}\n\nSouth Field (Zone S1) has the Main Concourse with the biggest selection — hot dogs, pizza, nachos, tacos, and more. East Concourse (Zone E2) has Stand B2. West Concourse (Zone W1) has Stand A1. You can browse the full menu and order from your seat on the Food & Drink page.`,
      (q, ctx) => `Looking for food? You've got options!${ctx}\n\nThe Main Concession at South Field (Zone S1) has the widest variety. East Concourse (Zone E2) and West Concourse (Zone W1) also have stands. Check the Food & Drink page to browse menus, filter by diet, and order directly to your seat for pickup.`,
    ],
  },
  {
    name: "dietary",
    weight: 5,
    keywords: [
      { term: "halal", score: 5 }, { term: "kosher", score: 5 }, { term: "vegan", score: 5 },
      { term: "vegetarian", score: 4 }, { term: "gluten free", score: 5 },
      { term: "gluten-free", score: 5 }, { term: "allergy", score: 4 },
      { term: "allergen", score: 4 }, { term: "dietary", score: 4 }, { term: "diet", score: 3 },
      { term: "lactose", score: 4 }, { term: "nut allergy", score: 4 },
    ],
    responses: [
      (q, ctx) => `We've got you covered for dietary needs.${ctx}\n\nHalal options are at Stand B2 (East Concourse, Zone E2) and Main Concession (South Field, Zone S1). Vegetarian and vegan options are available at most stands — try the plant-based burger at Stand A1 (West Concourse, Zone W1). Gluten-free buns and wraps are available on request at any concession stand. Ask any vendor about specific ingredients.`,
      (q, ctx) => `Dietary accommodations are available across the venue.${ctx}\n\nHalal and kosher options at Stand B2 (Zone E2). Most stands offer vegetarian and vegan choices. Gluten-free available on request at any location. If you have a specific allergy, ask the vendor directly — they have full ingredient lists.`,
    ],
  },
  {
    name: "exit",
    weight: 4,
    keywords: [
      { term: "exit", score: 5 }, { term: "leave", score: 3 }, { term: "get out", score: 4 },
      { term: "way out", score: 4 }, { term: "gate", score: 3 }, { term: "outside", score: 2 },
      { term: "how do i get out", score: 5 }, { term: "evacuate", score: 5 },
    ],
    responses: [
      (q, ctx) => `Follow the illuminated EXIT signs overhead — they lead to the nearest gate.${ctx}\n\nOnce outside, head to your designated meeting point. For reference: North gates lead to the main parking areas, South gates to public transit, and East/West gates to ride-share pickup zones.`,
      (q, ctx) => `The nearest exit is clearly marked with illuminated overhead signage.${ctx}\n\nFollow the EXIT signs — they're designed to be visible even in low visibility conditions. If you're leaving for the day, remember your parking level or pickup location.`,
    ],
  },
  {
    name: "parking",
    weight: 4,
    keywords: [
      { term: "parking", score: 5 }, { term: "park", score: 3 }, { term: "car", score: 3 },
      { term: "garage", score: 4 }, { term: "parking lot", score: 5 },
      { term: "parking structure", score: 5 }, { term: "where did i park", score: 5 },
      { term: "find my car", score: 4 }, { term: "valet", score: 3 },
    ],
    responses: [
      (q, ctx) => `Parking Structure B is accessed through West Gate (Zone W2).${ctx}\n\nIt's a cashless facility — cards and mobile wallets only. Heads-up: take a photo of your parking level and row number before heading in — it makes finding your car afterward much easier.`,
      (q, ctx) => `All parking is at Structure B via West Gate (Zone W2).${ctx}\n\nCashless entry and exit. If you took a ride-share, the designated pickup zone is at the South Gate (Zone S1).`,
    ],
  },
  {
    name: "seat",
    weight: 4,
    keywords: [
      { term: "seat", score: 4 }, { term: "section", score: 4 }, { term: "row", score: 4 },
      { term: "where am i sitting", score: 5 }, { term: "find my seat", score: 5 },
      { term: "my seat", score: 4 }, { term: "where's my seat", score: 5 },
      { term: "ticket", score: 3 },
    ],
    responses: [
      (q, ctx) => `Look for the section number banners hanging from the ceiling — they're large and easy to spot.${ctx}\n\nUshers at each section entrance can guide you to your specific row and seat number. If you entered your seat details at the entrance, you can view your ticket on the My Ticket page.`,
      (q, ctx) => `Your section number is displayed on large overhead banners.${ctx}\n\nOnce you find your section, an usher will help you find your row and seat. If you need help locating your section on the map, use the Navigation page.`,
    ],
  },
  {
    name: "lost_child",
    weight: 5,
    keywords: [
      { term: "lost child", score: 5 }, { term: "lost kid", score: 5 },
      { term: "lost my child", score: 5 }, { term: "can't find my child", score: 5 },
      { term: "can't find my kid", score: 5 }, { term: "missing child", score: 5 },
      { term: "missing kid", score: 5 }, { term: "lost son", score: 5 },
      { term: "lost daughter", score: 5 }, { term: "lost my baby", score: 5 },
      { term: "i lost my", score: 4 },
    ],
    responses: [
      (q, ctx) => `I'm flagging security to your zone right now.${ctx}\n\nPlease contact the nearest staff member immediately. Security has been alerted. Head to the Family Room at North Upper (Zone N2) — lost children are taken there for safety. Describe what they're wearing and where you last saw them. We'll find them quickly.`,
      (q, ctx) => `Don't panic — we have procedures for this.${ctx}\n\nSecurity has been alerted to your location. Lost children are taken to the Family Room at North Upper (Zone N2). Please go there or speak to the nearest staff member. Tell us what they're wearing and any distinguishing features.`,
    ],
  },
  {
    name: "lost_item",
    weight: 4,
    keywords: [
      { term: "lost my phone", score: 5 }, { term: "lost my wallet", score: 5 },
      { term: "lost my bag", score: 5 }, { term: "lost my keys", score: 5 },
      { term: "lost item", score: 4 }, { term: "lost and found", score: 5 },
      { term: "lost something", score: 4 }, { term: "misplaced", score: 3 },
      { term: "dropped my", score: 3 },
    ],
    responses: [
      (q, ctx) => `Check the Lost & Found at South Field (Zone S1).${ctx}\n\nAlso check with the nearest concession stand or gate attendant — items are often handed in there. If you remember where you were sitting, retrace your steps and check around your seat area first.`,
      (q, ctx) => `Lost items are held at South Field (Zone S1) Lost & Found.${ctx}\n\nYou can also ask at any Guest Services desk or check with nearby staff. If it's a phone, try calling it — someone may have picked it up.`,
    ],
  },
  {
    name: "suspicious",
    weight: 5,
    keywords: [
      { term: "suspicious", score: 5 }, { term: "unattended bag", score: 5 },
      { term: "unattended package", score: 5 }, { term: "suspicious package", score: 5 },
      { term: "suspicious bag", score: 5 }, { term: "threat", score: 4 },
      { term: "danger", score: 3 }, { term: "weapon", score: 5 },
      { term: "someone acting weird", score: 5 }, { term: "suspicious activity", score: 5 },
      { term: "something doesn't look right", score: 4 },
    ],
    responses: [
      (q, ctx) => `Security has been alerted to your zone.${ctx}\n\nDo NOT approach or confront anyone. Move to a safe distance and wait for security personnel to arrive. If you see an unattended bag or package, notify the nearest staff member right away — do not touch it. Your vigilance helps keep everyone safe.`,
      (q, ctx) => `I'm notifying security immediately.${ctx}\n\nPlease move away from the area and do not engage. Security personnel are trained to handle these situations. Report what you saw to the responding officers. Thank you for looking out for everyone's safety.`,
    ],
  },
  {
    name: "help",
    weight: 3,
    keywords: [
      { term: "help", score: 3 }, { term: "assistance", score: 4 },
      { term: "wheelchair", score: 5 }, { term: "disabled", score: 4 },
      { term: "accessibility", score: 5 }, { term: "special assistance", score: 5 },
      { term: "service animal", score: 4 }, { term: "mobility", score: 4 },
      { term: "crutches", score: 3 }, { term: "can't walk", score: 4 },
    ],
    responses: [
      (q, ctx) => `Staff have been notified and someone will be with you shortly.${ctx}\n\nWheelchair access is available at all gates. If you need mobility assistance, ask any staff member for a wheelchair escort. Accessible restrooms are at every concourse level, and service animals are welcome throughout the venue.`,
      (q, ctx) => `I'm connecting you with a venue team member.${ctx}\n\nAll gates are wheelchair accessible. If you need assistance getting to your seat or around the venue, Guest Services can provide a mobility escort. Just ask the nearest staff member or visit any Guest Services desk.`,
    ],
  },
  {
    name: "fire",
    weight: 5,
    keywords: [
      { term: "fire", score: 5 }, { term: "smoke", score: 5 }, { term: "smelling smoke", score: 5 },
      { term: "see smoke", score: 5 }, { term: "fire alarm", score: 5 },
      { term: "evacuation", score: 5 }, { term: "evacuate", score: 5 },
      { term: "alarm going off", score: 5 },
    ],
    responses: [
      (q, ctx) => `Stay calm and act quickly.${ctx}\n\nIf you hear the alarm or see smoke: follow the illuminated EXIT signs to the nearest gate. DO NOT use elevators. If you see fire or smoke, alert the nearest staff member. Help those around you who may need assistance — especially elderly fans or those with disabilities. Proceed to your assembly point.`,
      (q, ctx) => `Your safety is the priority.${ctx}\n\nLeave the area immediately using the nearest marked exit. Do not use elevators. If there's smoke, stay low where the air is clearer. Staff members are trained to guide you — follow their instructions. Once outside, move away from the building to your designated meeting point.`,
    ],
  },
  {
    name: "wifi",
    weight: 3,
    keywords: [
      { term: "wifi", score: 5 }, { term: "wi-fi", score: 5 }, { term: "internet", score: 4 },
      { term: "network", score: 4 }, { term: "signal", score: 3 }, { term: "online", score: 2 },
      { term: "connect", score: 3 }, { term: "wireless", score: 3 },
    ],
    responses: [
      (q, ctx) => `Free Wi-Fi is available throughout the venue.${ctx}\n\nConnect to "Stadium-Free" — no password needed. For the best speeds, try areas away from crowded concession spots during peak times.`,
      (q, ctx) => `Yes, we've got free Wi-Fi!${ctx}\n\nJust select "Stadium-Free" on your device — no password required. If the connection seems slow, try moving to a less crowded area.`,
    ],
  },
  {
    name: "water",
    weight: 3,
    keywords: [
      { term: "water", score: 4 }, { term: "thirsty", score: 4 }, { term: "drinking fountain", score: 4 },
      { term: "water station", score: 5 }, { term: "refill", score: 4 },
      { term: "free water", score: 5 }, { term: "hydration", score: 3 },
    ],
    responses: [
      (q, ctx) => `Free water refill stations are at every concourse restroom area.${ctx}\n\nYou'll also find dedicated water stations at North Upper (Zone N2) and South Upper (Zone S2). Bottled water is available at all concession stands for $4. Stay hydrated — especially on warm days!`,
      (q, ctx) => `Stay hydrated! Free water refill stations are located near restrooms throughout the venue.${ctx}\n\nBottled water is also available at concession stands. Don't hesitate to ask any vendor for a cup of water — they're happy to help.`,
    ],
  },
];

function scoreIntent(intent: Intent, query: string): number {
  let score = 0;
  for (const kw of intent.keywords) {
    if (query.includes(kw.term)) {
      score += kw.score;
    }
  }
  score *= intent.weight;
  if (score > 0 && query.split(/\s+/).length <= 3) {
    score *= 1.5;
  }
  return score;
}

function extractKeyInfo(query: string): string {
  const tokens = query.split(/\s+/).filter(t => t.length > 2);
  const stopWords = new Set([
    "the", "this", "that", "with", "from", "have", "are", "was", "were",
    "can", "you", "your", "for", "and", "not", "but", "its", "all", "any",
    "how", "why", "what", "where", "who", "when", "which", "about", "just",
    "like", "know", "need", "want", "tell", "give", "show", "help", "does",
    "doing", "some", "there", "would", "could", "should", "been", "being",
    "very", "too", "much", "more", "here", "over", "into", "than", "then",
  ]);
  return tokens.filter(t => !stopWords.has(t)).slice(0, 4).join(" ");
}

function fallback(query: string, ctx: string): string {
  const keyInfo = extractKeyInfo(query);
  const keyWords = keyInfo ? ` regarding "${keyInfo}"` : "";
  return [
    `I understand you're asking${keyWords ? keyWords.replace(/"/g, '') : " something"} but I'm not entirely sure what you're looking for.${ctx}\n\nCould you try rephrasing? Here are some things I can help with:\n• 🚻 Finding restrooms, exits, or parking\n• 🍔 Food options, menus, and dietary needs\n• 🏥 First aid, medical help, or emergencies\n• 🔒 Safety concerns or security issues\n• 📶 Wi-Fi, ATMs, or venue info\n\nWhat do you need?`,
    `I want to make sure I help you correctly${keyWords}.${ctx}\n\nCould you be a bit more specific? Try asking something like:\n• "Where's the nearest restroom?"\n• "Show me halal food options"\n• "How do I get to first aid?"\n• "What do I do in an emergency?"`,
    `I'm here to help but I want to give you the right information${keyWords}.${ctx}\n\nCan you tell me more about what you need? For example:\n• Directions to somewhere in the stadium\n• Information about food or amenities\n• Help with a safety or medical concern\n• General venue questions`,
  ][Math.floor(Math.random() * 3)];
}

function mockReply(lastMsg: string, seat: string | undefined): string {
  const q = lastMsg.toLowerCase().trim();
  const ctx = seatContext(seat);
  if (!q) return `I didn't catch that.${ctx}\n\nHow can I help you today?`;

  let bestIntent: Intent | null = null;
  let bestScore = 0;

  for (const intent of intents) {
    const score = scoreIntent(intent, q);
    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent;
    }
  }

  if (bestIntent && bestScore >= 4) {
    return pick(bestIntent.responses)(q, ctx);
  }

  return fallback(q, ctx);
}

export async function stadiumChat(input: unknown) {
  const data = ChatInput.parse(input);
  const lastMsg = data.messages[data.messages.length - 1].content;
  return { reply: mockReply(lastMsg, data.seat) };
}

const TranslateInput = z.object({
  text: z.string().min(1).max(2000),
  targetLanguage: z.string().min(2).max(20),
});

const knownTranslations: Record<string, Record<string, string>> = {
  es: {
    "hello": "Hola", "thank you": "Gracias", "help": "Ayuda",
    "restroom": "Baño", "water": "Agua", "exit": "Salida",
    "food": "Comida", "first aid": "Primeros auxilios",
    "emergency": "Emergencia", "police": "Policía", "where": "Dónde",
  },
  fr: {
    "hello": "Bonjour", "thank you": "Merci", "help": "Aide",
    "restroom": "Toilettes", "water": "Eau", "exit": "Sortie",
    "food": "Nourriture", "first aid": "Premiers secours",
    "emergency": "Urgence", "police": "Police", "where": "Où",
  },
};

export async function stadiumTranslate(input: unknown) {
  const data = TranslateInput.parse(input);
  const lang = data.targetLanguage;
  const text = data.text.trim();

  const dict = knownTranslations[lang];
  if (dict) {
    const lower = text.toLowerCase();
    for (const [en, translation] of Object.entries(dict)) {
      if (lower === en.toLowerCase() || lower.startsWith(en.toLowerCase())) {
        const rest = text.slice(en.length).trim();
        return { translation: `${translation}${rest ? " " + rest : ""}` };
      }
    }
  }

  const prefixes: Record<string, string> = {
    es: "🔊 Escucha: ", fr: "🔊 Écoutez: ",
    de: "🔊 Hören Sie: ", zh: "🔊 听: ",
    ar: "🔊 استمع: ", hi: "🔊 सुनें: ",
    ja: "🔊 聞いてください: ", pt: "🔊 Ouça: ",
  };
  return { translation: `${prefixes[lang] ?? `[${lang}] `}${text}` };
}