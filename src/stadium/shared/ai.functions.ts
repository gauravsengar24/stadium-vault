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

function mockReply(lastMsg: string, seat: string | undefined): string {
  const q = lastMsg.toLowerCase().trim();
  const ctx = seatContext(seat);

  // Greetings
  if (q.match(/^(hi|hello|hey|yo|sup|good morning|good evening|good afternoon|howdy)/))
    return `Hello! I'm Guardian AI, your stadium concierge.${ctx}\n\nHow can I help you today? You can ask me about directions, food, first aid, restrooms, exits, or any safety concern.`;

  if (q.includes("how are you") || q.includes("how's it going"))
    return `I'm fully operational and ready to help!${ctx}\n\nWhat do you need assistance with?`;

  // Navigation / directions
  if (q.match(/^(where|how (do|can) I|directions|navigate|find|locate|guide|take me|lead me|show me)/) ||
      q.includes("way to") || q.includes("get to") || q.includes("walk to")) {
    if (q.includes("restroom") || q.includes("bathroom") || q.includes("toilet") || q.includes("washroom"))
      return `Restrooms are located at every gate and concourse level.${ctx}\n\nFrom your location, follow the blue wayfinding signs overhead — they'll guide you to the nearest restroom. All restrooms have accessible stalls and baby changing facilities.`;
    if (q.includes("first") && q.includes("aid"))
      return `First Aid stations are staffed at East Gate (Zone E1) and West Concourse (Zone W1).${ctx}\n\nBoth stations have paramedics on duty. If you can't make it to a station, flag any staff member and they'll radio for assistance immediately.`;
    if (q.includes("food") || q.includes("eat") || q.includes("concession") || q.includes("drink") || q.includes("restaurant"))
      return `There are concession stands throughout the venue.${ctx}\n\nSouth Field (Zone S1) has the Main Concourse with the widest selection — hot dogs, pizza, tacos, and vegan options. East Concourse (Zone E2) has Stand B2 with halal and gluten-free options. Check the Food & Drink page to browse menus and order to your seat.`;
    if (q.includes("exit") || q.includes("leave") || q.includes("out") || q.includes("gate"))
      return `Follow the illuminated EXIT signs overhead — they lead to the nearest gate.${ctx}\n\nOnce outside, proceed to your designated meeting point. In an evacuation, do NOT use elevators. If you're with children, hold hands and stay low if there's smoke.`;
    if (q.includes("parking") || q.includes("car") || q.includes("park") || q.includes("garage") || q.includes("lot"))
      return `Parking Structure B is accessed via West Gate (Zone W2).${ctx}\n\nHead toward the west side of the venue and follow the Parking signs. Cashless payment only — cards and mobile wallets accepted. Remember your parking level and row number.`;
    if (q.includes("seat") || q.includes("section") || q.includes("row") || q.includes("ticket"))
      return `Your seat info is on your ticket.${ctx}\n\nLook for the section number banners hanging from the ceiling. Ushers at every section entrance can guide you to your specific row and seat number.`;
    return `I can help you find anything in the stadium.${ctx}\n\nTell me what you're looking for — restrooms, food, first aid, an exit, parking, or your seat — and I'll guide you there.`;
  }

  // Food & drink
  if (q.includes("halal") || q.includes("kosher") || q.includes("vegan") || q.includes("vegetarian") || q.includes("gluten") || q.includes("allerg") || q.includes("dietary") || q.includes("diet"))
    return `We have options for most dietary needs.${ctx}\n\nHalal: Available at Stand B2 (East Concourse) and Main Concession (South Field). Vegetarian/Vegan: Most stands offer plant-based options — try the Beyond Burger at Stand A1 (West Concourse). Gluten-free: Buns and wraps available on request. Ask any vendor about ingredients.\n\nCheck the Food & Drink page for the full menu with dietary filters.`;
  if (q.includes("menu") || q.includes("order") || q.includes("buy") || q.includes("price") || q.includes("how much"))
    return `You can browse the full menu and order from your seat on the Food & Drink page.${ctx}\n\nPopular items: Classic Hot Dog $8, Pizza Slice $6, Nachos $7, Bottled Water $4. Prices include tax. Orders are typically ready in 8-12 minutes — you'll get a notification when it's ready for pickup.`;

  // Medical & emergencies
  if ((q.includes("medical") || q.includes("hurt") || q.includes("injury") || q.includes("bleeding") || q.includes("unconscious") || q.includes("heart") || q.includes("attack") || q.includes("paramedic")) && !q.includes("first aid"))
    return `I'm flagging medical staff to your location now.${ctx}\n\nA First Aid responder is being dispatched. If the situation is urgent, ask the nearest staff member to radio for immediate assistance. First Aid stations are at East Gate (Zone E1) and West Concourse (Zone W1).`;
  if ((q.includes("fire") || q.includes("smoke") || q.includes("alarm") || q.includes("evacuat") || q.includes("emergency")) && !q.includes("first aid"))
    return `If you hear the alarm: remain calm and follow the illuminated EXIT signs to the nearest gate.${ctx}\n\nDo NOT use elevators. If you see fire or smoke, alert the nearest staff member immediately. Help elderly or disabled fans around you if you can. Proceed to your assembly point outside.\n\nStaff have been alerted to your location. Follow their instructions.`;

  // Safety & security
  if (q.includes("lost") && (q.includes("child") || q.includes("kid") || q.includes("son") || q.includes("daughter") || q.includes("baby")))
    return `I'm so sorry — let's find them quickly.${ctx}\n\nContact any staff member or go to the nearest Lost & Found (South Field, Zone S1). Security has been alerted. Describe what they're wearing and where you last saw them. Check the Family Room at North Upper (Zone N2) — lost children are taken there.`;
  if (q.includes("lost") && (q.includes("phone") || q.includes("wallet") || q.includes("bag") || q.includes("keys")))
    return `Lost items are held at the Lost & Found in South Field (Zone S1).${ctx}\n\nYou can also check with the nearest concession stand or gate attendant. If you remember your seat location, check there first — items are often turned in by nearby guests.`;
  if (q.includes("suspicious") || q.includes("unattended") || q.includes("threat") || q.includes("danger") || q.includes("weapon"))
    return `I'm alerting security to your zone immediately.${ctx}\n\nDo not approach or confront. Move to a safe distance and wait for security personnel. If you see an unattended bag or package, notify the nearest staff member right away. Your safety is our priority.`;

  // Staff / help
  if (q.includes("help") || q.includes("assistance") || q.includes("wheelchair") || q.includes("disabled") || q.includes("accessibility") || q.includes("special") || q.includes("accommodation"))
    return `I've flagged a staff member to assist you.${ctx}\n\nWheelchair access is available at all gates. If you need mobility assistance, ask any staff member for a wheelchair escort. Accessible restrooms are at every concourse level. Service animals are welcome.`;
  if (q.includes("staff") || q.includes("manager") || q.includes("supervisor") || q.includes("complain") || q.includes("speak"))
    return `I'll connect you with a venue supervisor.${ctx}\n\nIn the meantime, you can also visit the Guest Services desk at any gate entrance or go to the Main Office at South Field (Zone S1).`;

  // Venue info
  if (q.includes("wifi") || q.includes("internet") || q.includes("network") || q.includes("signal"))
    return `Free Wi-Fi is available throughout the venue.${ctx}\n\nConnect to the "Stadium-Free" network — no password required. For the best signal, avoid the most congested areas near concession stands during peak times.`;
  if (q.includes("atm") || q.includes("cash") || q.includes("money") || q.includes("payment") || q.includes("card") || q.includes("wallet"))
    return `The venue is cashless — all payments by card or mobile wallet.${ctx}\n\nATMs are located at West Gate (Zone W2) and near South Field (Zone S1). You can also add funds to your digital wallet at any Guest Services desk.`;
  if (q.includes("first") && q.includes("half") || q.includes("second") || q.includes("half") || q.includes("schedule") || q.includes("time") || q.includes("when") || q.includes("start") || q.includes("kickoff") || q.includes("match"))
    return `You can check the event schedule on the scoreboard and on the stadium app.${ctx}\n\nFor live match updates, keep an eye on the main screen — it shows the clock, score, and key plays. I don't have live match data, so check the official app for real-time updates.`;

  // Help for specific situations
  if (q.includes("cold") || q.includes("blanket") || q.includes("jacket"))
    return `It can get cool in the concourse areas.${ctx}\n\nCheck with Guest Services at any gate — they may have emergency blankets available. You can also visit the Merchandise stands (East Concourse, Zone E2) for team jackets and hoodies.`;
  if (q.includes("water") || q.includes("drink") || q.includes("thirsty") && !q.includes("alcohol") && !q.includes("beer"))
    return `Free water refill stations are located at every concourse restroom area and at North Upper (Zone N2) and South Upper (Zone S2).${ctx}\n\nBottled water is also available at all concession stands for $4. Stay hydrated!`;
  if (q.includes("baby") || q.includes("diaper") || q.includes("nurs") || q.includes("breastfeed"))
    return `The Family Room at North Upper (Zone N2) is available for parents with infants.${ctx}\n\nIt has changing tables, private nursing areas, and a quiet space. Accessible restrooms also have changing stations.`;

  // Thanks / closure
  if (q.match(/^(thanks|thank you|thx|ty|appreciate)/))
    return `You're welcome!${ctx}\n\nI'm always here if you need help. Stay safe and enjoy the event! 🏟️`;
  if (q.match(/^(bye|goodbye|see you|cya|farewell)/))
    return `Take care!${ctx}\n\nIf you need anything else, just ask. Have a great time at the stadium!`;

  return `I'm Guardian AI, your stadium concierge. I can help with directions, food, first aid, safety, and anything else during your visit.${ctx}\n\nTry asking me: "Where's the nearest restroom?", "Show me halal food options", "How do I get to first aid?", or "What do I do in an emergency?"`;
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

export async function stadiumTranslate(input: unknown) {
  const data = TranslateInput.parse(input);
  const lang = data.targetLanguage;
  const prefix = lang === "es" ? "[Traducción]" :
    lang === "fr" ? "[Traduction]" :
    lang === "de" ? "[Übersetzung]" :
    `[${lang}]`;
  return { translation: `${prefix} ${data.text}` };
}