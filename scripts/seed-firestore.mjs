import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const KEY_PATH = resolve(__dirname, "..", "stadiumvault-007-service-account.json");
const serviceAccount = JSON.parse(readFileSync(KEY_PATH, "utf-8"));

const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);

const FOOD_ITEMS = [
  { name: "Classic Hot Dog", category: "Snacks", price: 7.50, vendor: "Titan Grill", zone: "N1", wait_minutes: 4, dietary: ["halal"], emoji: "🌭" },
  { name: "Loaded Nachos", category: "Snacks", price: 9.00, vendor: "Nacho Republic", zone: "E2", wait_minutes: 6, dietary: ["vegetarian", "gluten-free"], emoji: "🧀" },
  { name: "Veggie Burger", category: "Mains", price: 11.00, vendor: "Green Field", zone: "S1", wait_minutes: 8, dietary: ["vegetarian", "vegan"], emoji: "🍔" },
  { name: "Chicken Wings", category: "Mains", price: 12.50, vendor: "Wing Zone", zone: "W1", wait_minutes: 10, dietary: ["halal", "gluten-free"], emoji: "🍗" },
  { name: "Buttered Popcorn", category: "Snacks", price: 5.50, vendor: "Kernel Co.", zone: "N2", wait_minutes: 2, dietary: ["vegetarian", "gluten-free"], emoji: "🍿" },
  { name: "Kosher Deli Sandwich", category: "Mains", price: 13.00, vendor: "Deli Kart", zone: "S2", wait_minutes: 7, dietary: ["kosher"], emoji: "🥪" },
  { name: "Fresh Fruit Cup", category: "Healthy", price: 6.00, vendor: "Fresh Stand", zone: "E1", wait_minutes: 3, dietary: ["vegan", "gluten-free", "halal", "kosher"], emoji: "🍓" },
  { name: "Craft Lemonade", category: "Drinks", price: 4.50, vendor: "Citrus Bar", zone: "W2", wait_minutes: 3, dietary: ["vegan", "gluten-free"], emoji: "🍋" },
  { name: "Draft Beer", category: "Drinks", price: 9.00, vendor: "Stadium Taps", zone: "N1", wait_minutes: 4, dietary: ["vegan"], emoji: "🍺" },
  { name: "Gluten-Free Pretzel", category: "Snacks", price: 6.50, vendor: "Twist & Salt", zone: "E2", wait_minutes: 5, dietary: ["vegetarian", "gluten-free"], emoji: "🥨" },
];

const CROWD_ZONES = [
  { zone: "N1", name: "North Concourse", capacity: 3000, current_count: 1820, density: 0.61 },
  { zone: "N2", name: "North Upper", capacity: 2500, current_count: 1120, density: 0.45 },
  { zone: "E1", name: "East Gate", capacity: 2200, current_count: 1980, density: 0.90 },
  { zone: "E2", name: "East Concourse", capacity: 2800, current_count: 1400, density: 0.50 },
  { zone: "S1", name: "South Field", capacity: 3500, current_count: 2100, density: 0.60 },
  { zone: "S2", name: "South Upper", capacity: 2700, current_count: 890, density: 0.33 },
  { zone: "W1", name: "West Concourse", capacity: 2600, current_count: 1560, density: 0.60 },
  { zone: "W2", name: "West Gate", capacity: 2000, current_count: 1650, density: 0.82 },
];

const STAFF = [
  { staff_id: "SEC-001", name: "Alex Rivera", role: "security", zone: "N1" },
  { staff_id: "SEC-002", name: "Jamie Chen", role: "security", zone: "E1" },
  { staff_id: "MED-001", name: "Dr. Priya Patel", role: "medical", zone: "S1" },
  { staff_id: "MED-002", name: "Marcus Doe", role: "medical", zone: "W1" },
  { staff_id: "FIRE-001", name: "Sam Torres", role: "fire", zone: "E2" },
  { staff_id: "VOL-001", name: "Kai Nguyen", role: "volunteer", zone: "N2" },
  { staff_id: "VOL-002", name: "Jordan Lee", role: "volunteer", zone: "S2" },
];

async function seed() {
  console.log("Seeding food_items...");
  const batch = db.batch();
  for (const item of FOOD_ITEMS) {
    const ref = db.collection("food_items").doc();
    batch.set(ref, { ...item, created_at: new Date().toISOString() });
  }
  await batch.commit();
  console.log(`  ${FOOD_ITEMS.length} food items created`);

  console.log("Seeding crowd_zones...");
  const batch2 = db.batch();
  for (const z of CROWD_ZONES) {
    const ref = db.collection("crowd_zones").doc(z.zone);
    batch2.set(ref, z);
  }
  await batch2.commit();
  console.log(`  ${CROWD_ZONES.length} crowd zones created`);

  console.log("Seeding staff_directory...");
  const batch3 = db.batch();
  for (const s of STAFF) {
    const ref = db.collection("staff_directory").doc(s.staff_id);
    batch3.set(ref, { ...s, created_at: new Date().toISOString() });
  }
  await batch3.commit();
  console.log(`  ${STAFF.length} staff entries created`);

  console.log("Seeding sample alerts...");
  const batch4 = db.batch();
  const alerts = [
    { alert_type: "weather", severity: "medium", message: "Thunderstorm warning for the area until 9 PM. Seek shelter in concourse.", zones: [], active: true, created_at: new Date().toISOString() },
    { alert_type: "crowding", severity: "low", message: "East Gate concourse is at 90% capacity. Consider alternate routes.", zones: ["E1", "E2"], active: true, created_at: new Date().toISOString() },
  ];
  for (const a of alerts) {
    const ref = db.collection("alerts").doc();
    batch4.set(ref, a);
  }
  await batch4.commit();
  console.log(`  ${alerts.length} sample alerts created`);

  console.log("\nSeed complete!");
}

seed().catch(console.error);
