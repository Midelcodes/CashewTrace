// Demo seed — ALL PEOPLE, COMPANIES, PHONE NUMBERS AND LOTS ARE FICTIONAL.
// Phones are stored as digits only (see lib/phone.ts).
// Deterministic (seeded PRNG), so re-running produces the same dataset. Wipes existing data first.

import bcrypt from "bcryptjs";
import type { AgeGroup, Gender, LotStatus } from "@prisma/client";
import { db } from "../lib/db";
import { gradeLot, type Grade } from "../lib/grading";
import { calculateSale, formatKg, formatNaira } from "../lib/money";
import { formatFarmerCode, formatLotCode } from "../lib/ids";
import { SETTING_DEFAULTS } from "../lib/settings";

const DEMO_AGENT_PIN = "1234"; // all non-admin demo agents share this PIN
const NOW = new Date();
const DAY = 24 * 60 * 60 * 1000;

// ---------- deterministic random helpers ----------
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260301);
const between = (min: number, max: number) => min + rand() * (max - min);
const int = (min: number, max: number) => Math.floor(between(min, max + 1));
const pick = <T>(items: readonly T[]): T => items[Math.floor(rand() * items.length)];
const round = (n: number, dp = 1) => Math.round(n * 10 ** dp) / 10 ** dp;
const chance = (p: number) => rand() < p;
const addDays = (d: Date, days: number) => new Date(d.getTime() + days * DAY);
const notFuture = (d: Date) => (d > NOW ? NOW : d);
function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- reference data ----------
const HUBS = [
  {
    name: "Dekina Quality Hub",
    code: "KOG-DEK",
    lga: "Dekina",
    state: "Kogi",
    communities: ["Anyigba", "Dekina", "Egume", "Iyale", "Odu", "Ojikpadala"],
  },
  {
    name: "Ankpa Quality Hub",
    code: "KOG-ANK",
    lga: "Ankpa",
    state: "Kogi",
    communities: ["Ankpa", "Enjema", "Ojoku", "Ikanekpo"],
  },
] as const;

const NAMES = {
  igala: {
    weight: 0.55,
    female: ["Ojochenemi", "Ufedojo", "Ene", "Ojoma", "Agbenu", "Ajuma", "Ladi", "Ojone", "Enemona", "Unekwu", "Eleojo", "Ojonoka"],
    male: ["Ojonugwa", "Onuche", "Inalegwu", "Omachi", "Enemaku", "Adaji", "Ocheni", "Ilemona", "Ojochegbe", "Agbo"],
    surnames: ["Abah", "Okpanachi", "Ameh", "Attah", "Idakwo", "Akoji", "Ocheja", "Ejeh", "Onoja", "Adejoh", "Achimugu", "Omale", "Egbunu", "Agada"],
  },
  yoruba: {
    weight: 0.15,
    female: ["Funmilayo", "Bisola", "Kemi", "Adunni", "Folake", "Yetunde"],
    male: ["Tunde", "Segun", "Adewale", "Kayode", "Femi"],
    surnames: ["Adebayo", "Ogunleye", "Olawale", "Ajayi", "Afolabi", "Adeyemi"],
  },
  hausa: {
    weight: 0.15,
    female: ["Aisha", "Hauwa", "Zainab", "Fatima", "Amina", "Hadiza"],
    male: ["Musa", "Ibrahim", "Sani", "Yusuf", "Abubakar"],
    surnames: ["Bello", "Abdullahi", "Usman", "Garba", "Sule", "Danjuma"],
  },
  igbo: {
    weight: 0.15,
    female: ["Chinyere", "Ngozi", "Ifeoma", "Adaeze", "Nkechi"],
    male: ["Emeka", "Chukwudi", "Obinna", "Ikenna", "Nnamdi"],
    surnames: ["Okafor", "Eze", "Nwosu", "Obi", "Okonkwo", "Nwachukwu"],
  },
};

const BUYERS = [
  "Demo Exports Ltd",
  "Sample Kernel Processors Nig. Ltd",
  "Example Agro Commodities Ltd",
  "Illustrative Cashew Traders Ltd",
  "Placeholder Foods Processing Co.",
];

const INTERESTED_COMPANIES = [
  ["Demo Exports Ltd", "Bola Adeyemi"],
  ["Sample Agro Processing Co.", "Chidi Okeke"],
  ["Example Kernel Foods Ltd", "Halima Sani"],
  ["Placeholder Commodities Nig. Ltd", "Tope Akinola"],
  ["Fictional Cashew Processors Ltd", "Grace Odeh"],
  ["Mock Trading Partners Ltd", "Yakubu Danladi"],
  ["Specimen Nut Exporters Ltd", "Ifeanyi Uche"],
  ["Trial Agro Allied Ltd", "Rukayat Bello"],
  ["Pilot Kernel Works Ltd", "Samuel Ojo"],
  ["Prototype Foods Ltd", "Esther Ali"],
] as const;

const INTEREST_MESSAGES = [
  "Interested in this lot. Please share availability for pickup next week.",
  "We would like to buy this lot and similar KOR lots from the same hub.",
  "Can you confirm the moisture reading and arrange a sample?",
  "Looking for 20+ tonnes this season at this grade. Is aggregation possible?",
  "Please send pricing and loading location.",
];

function farmerName(gender: Gender, used: Set<string>): string {
  const groups = Object.values(NAMES);
  for (;;) {
    let r = rand();
    let group = groups[0];
    for (const g of groups) {
      if (r < g.weight) {
        group = g;
        break;
      }
      r -= g.weight;
    }
    const first = pick(gender === "FEMALE" ? group.female : group.male);
    const name = `${first} ${pick(group.surnames)}`;
    if (!used.has(name)) {
      used.add(name);
      return name;
    }
  }
}

async function main() {
  const adminPin = process.env.ADMIN_PIN;
  if (!adminPin) throw new Error("ADMIN_PIN must be set (see .env.example)");

  // Safety for the live demo: never wipe a database that already has data unless asked explicitly
  // (npm run db:seed:reset). A plain `npm run db:seed` on a populated DB is a no-op.
  const existingLots = await db.lot.count();
  if (existingLots > 0 && !process.argv.includes("--reset")) {
    console.log(
      `Database already has data (${existingLots} lots) — nothing changed.\n` +
        "To WIPE everything and reload the demo data, run: npm run db:seed:reset",
    );
    return;
  }

  console.log("Clearing existing data…");
  await db.auditLog.deleteMany();
  await db.buyerInterest.deleteMany();
  await db.sale.deleteMany();
  await db.qualityTest.deleteMany();
  await db.lot.deleteMany();
  await db.farmer.deleteMany();
  await db.agent.deleteMany();
  await db.hub.deleteMany();

  await db.settings.upsert({
    where: { id: 1 },
    update: SETTING_DEFAULTS,
    create: { id: 1, ...SETTING_DEFAULTS },
  });

  // ---------- hubs ----------
  const hubs = [];
  for (const h of HUBS) {
    hubs.push(
      await db.hub.create({
        data: { name: h.name, code: h.code, lga: h.lga, state: h.state, createdAt: new Date("2025-01-15") },
      }),
    );
  }
  const [dekina, ankpa] = hubs;

  // ---------- agents ----------
  const [adminHash, agentHash] = await Promise.all([
    bcrypt.hash(adminPin, 10),
    bcrypt.hash(DEMO_AGENT_PIN, 10),
  ]);
  const agentSpecs = [
    { name: "Demo Admin", phone: "08000009000", role: "ADMIN", gender: "FEMALE", isYouth: false, hubId: dekina.id },
    { name: "Ojochenemi Abah", phone: "08000009001", role: "AGENT", gender: "FEMALE", isYouth: true, hubId: dekina.id },
    { name: "Musa Idakwo", phone: "08000009002", role: "AGENT", gender: "MALE", isYouth: true, hubId: dekina.id },
    { name: "Ene Okpanachi", phone: "08000009003", role: "AGENT", gender: "FEMALE", isYouth: false, hubId: ankpa.id },
    { name: "Ufedo Ameh", phone: "08000009004", role: "AGENT", gender: "FEMALE", isYouth: true, hubId: ankpa.id },
  ] as const;
  const agents = [];
  for (const a of agentSpecs) {
    agents.push(
      await db.agent.create({
        data: { ...a, pinHash: a.role === "ADMIN" ? adminHash : agentHash, createdAt: new Date("2025-01-20") },
      }),
    );
  }
  const admin = agents[0];
  const fieldAgents = agents.filter((a) => a.role === "AGENT");
  const agentsByHub = (hubId: string) => fieldAgents.filter((a) => a.hubId === hubId);

  // ---------- farmers ----------
  const usedNames = new Set<string>();
  const farmerData = Array.from({ length: 60 }, (_, i) => {
    const hubSpec = i % 5 < 3 ? HUBS[0] : HUBS[1];
    const hub = hubSpec === HUBS[0] ? dekina : ankpa;
    const gender: Gender = chance(0.5) ? "FEMALE" : "MALE";
    const ageGroup: AgeGroup = chance(0.32) ? "YOUTH_18_35" : "ADULT_36_PLUS";
    const community = pick(hubSpec.communities);
    const farmSizeHa = round(0.3 + 2.7 * rand() ** 1.6, 1);
    return {
      farmerCode: formatFarmerCode(i + 1),
      fullName: farmerName(gender, usedNames),
      phone: `0800000${1001 + i}`,
      gender,
      ageGroup,
      community,
      lga: hubSpec.lga,
      state: hubSpec.state,
      farmSizeHa,
      numberOfTrees: chance(0.8) ? Math.round(farmSizeHa * between(80, 120)) : null,
      cooperative: chance(0.5) ? `${community} Cashew Farmers Cooperative` : null,
      consentGiven: true,
      hubId: hub.id,
      createdAt: new Date(Date.UTC(2025, 0, 20 + i)),
    };
  });
  const farmers = await db.farmer.createManyAndReturn({ data: farmerData });

  // ---------- lots ----------
  type LotSpec = {
    farmerId: string;
    hubId: string;
    agentId: string;
    season: number;
    harvestMonth: number;
    bags: number;
    weightKg: number;
    receivedAt: Date;
    pending?: "RECEIVED" | "DRYING";
  };
  const lotSpecs: LotSpec[] = [];
  for (let i = 0; i < 120; i++) {
    // Every farmer gets at least one lot; the rest go to random farmers.
    const farmer = i < farmers.length ? farmers[i] : pick(farmers);
    const season = i % 12 < 5 ? 2025 : 2026; // ~50 lots in 2025, ~70 in 2026
    const harvestMonth = int(2, 5); // Feb–May main harvest
    const bags = 2 + Math.floor(18 * rand() ** 1.5);
    const receivedAt = notFuture(
      addDays(new Date(Date.UTC(season, harvestMonth - 1, int(1, 28), int(7, 15))), int(0, 20)),
    );
    lotSpecs.push({
      farmerId: farmer.id,
      hubId: farmer.hubId,
      agentId: pick(agentsByHub(farmer.hubId)).id,
      season,
      harvestMonth,
      bags,
      weightKg: round(bags * between(78, 81.5), 1),
      receivedAt,
    });
  }
  // The 12 most recent 2026 lots are still at the hub: received this week or drying now.
  const recent2026 = lotSpecs
    .filter((l) => l.season === 2026)
    .sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime())
    .slice(0, 12);
  recent2026.forEach((l, i) => {
    l.pending = i < 5 ? "RECEIVED" : "DRYING";
    l.receivedAt = new Date(NOW.getTime() - (i < 5 ? int(0, 2) : int(2, 6)) * DAY - int(1, 8) * 3600_000);
  });

  // Sequence numbers run chronologically per state + season.
  lotSpecs.sort((a, b) => a.receivedAt.getTime() - b.receivedAt.getTime());
  const sequence: Record<number, number> = {};

  // Decide test outcomes up front so the grade mix is controlled (~5% FAIL).
  const testedIdx = shuffle(lotSpecs.map((l, i) => (l.pending ? -1 : i)).filter((i) => i >= 0));
  const intendedGrade = new Map<number, Grade>();
  testedIdx.forEach((idx, n) => {
    intendedGrade.set(idx, n < 6 ? "FAIL" : n < 44 ? "A" : n < 78 ? "B" : "C");
  });

  type TestSpec = {
    lotIdx: number;
    moistureBefore: number;
    moistureAfter: number;
    korLbs: number;
    nutCountPerKg: number | null;
    defectivePct: number | null;
    grade: Grade;
    dryingDays: number;
    testedById: string;
    testedAt: Date;
  };
  const tests: TestSpec[] = [];
  for (const [lotIdx, intended] of intendedGrade) {
    const lot = lotSpecs[lotIdx];
    const moistureAfter = round(between(7, 9.8));
    let korLbs: number;
    if (intended === "A") korLbs = round(between(48, 52));
    else if (intended === "B") korLbs = round(between(45, 47.9));
    else if (intended === "C") korLbs = round(between(42, 44.9));
    // Saved FAILs are low outturn only: lots that are too wet stay in DRYING and are never saved as tested.
    else korLbs = round(between(40, 41.8));
    const dryingDays = int(2, 6);
    const grade = gradeLot({ moistureAfter, korLbs }, SETTING_DEFAULTS);
    tests.push({
      lotIdx,
      moistureBefore: round(between(12, 18)),
      moistureAfter,
      korLbs,
      nutCountPerKg: chance(0.85) ? int(165, 215) : null,
      defectivePct: chance(0.85) ? round(between(3, 12)) : null,
      grade,
      dryingDays,
      testedById: chance(0.8) ? lot.agentId : pick(agentsByHub(lot.hubId)).id,
      testedAt: notFuture(addDays(lot.receivedAt, dryingDays + rand())),
    });
  }

  // Statuses: FAIL → REJECTED; oldest 40 A/B lots → SOLD; unsold rest → TESTED / RESERVED / LISTED.
  const status = new Map<number, LotStatus>();
  lotSpecs.forEach((l, i) => l.pending && status.set(i, l.pending));
  const byTestedAt = [...tests].sort((a, b) => a.testedAt.getTime() - b.testedAt.getTime());
  for (const t of byTestedAt) if (t.grade === "FAIL") status.set(t.lotIdx, "REJECTED");
  const soldTests = byTestedAt.filter((t) => t.grade === "A" || t.grade === "B").slice(0, 40);
  for (const t of soldTests) status.set(t.lotIdx, "SOLD");
  const unsold = byTestedAt.filter((t) => !status.has(t.lotIdx)).reverse(); // newest first
  unsold.forEach((t, i) => status.set(t.lotIdx, i < 6 ? "TESTED" : i < 12 ? "RESERVED" : "LISTED"));

  const REJECT_REASON = "KOR below minimum — returned to farmer";
  const testByIdx = new Map(tests.map((t) => [t.lotIdx, t]));
  const lotData = lotSpecs.map((l, i) => {
    sequence[l.season] = (sequence[l.season] ?? 0) + 1;
    const st = status.get(i)!;
    const test = testByIdx.get(i);
    const drying = st !== "RECEIVED";
    return {
      lotCode: formatLotCode("Kogi", l.season, sequence[l.season]),
      farmerId: l.farmerId,
      hubId: l.hubId,
      agentId: l.agentId,
      season: l.season,
      harvestMonth: l.harvestMonth,
      bags: l.bags,
      weightKg: l.weightKg,
      status: st,
      receivedAt: l.receivedAt,
      createdAt: l.receivedAt,
      moistureBefore: drying ? (test?.moistureBefore ?? round(between(12, 18))) : null,
      dryingStartedAt: drying ? notFuture(new Date(l.receivedAt.getTime() + int(2, 6) * 3600_000)) : null,
      rejectionReason: st === "REJECTED" ? REJECT_REASON : null,
    };
  });
  const createdLots = await db.lot.createManyAndReturn({ data: lotData });
  const lotIdByCode = new Map(createdLots.map((l) => [l.lotCode, l.id]));
  const lotId = (idx: number) => lotIdByCode.get(lotData[idx].lotCode)!;

  await db.qualityTest.createMany({
    data: tests.map(({ lotIdx, ...t }) => ({ ...t, lotId: lotId(lotIdx), dryingMethod: "SOLAR_PLATFORM" as const })),
  });

  // ---------- sales ----------
  const saleData = soldTests.map((t) => {
    const lot = lotSpecs[t.lotIdx];
    // A lots sell 0 to +8% over the reference price, B lots −8% to 0.
    const swing = t.grade === "A" ? between(0, 0.08) : between(-0.08, 0);
    const pricePerTonneNgn = Math.round((SETTING_DEFAULTS.farmGatePricePerTonneNgn * (1 + swing)) / 1000) * 1000;
    return {
      lotId: lotId(t.lotIdx),
      buyerName: pick(BUYERS),
      pricePerTonneNgn,
      ...calculateSale({ weightKg: lot.weightKg, bags: lot.bags, pricePerTonneNgn }, SETTING_DEFAULTS),
      soldAt: notFuture(addDays(t.testedAt, int(3, 25))),
    };
  });
  await db.sale.createMany({ data: saleData });

  // ---------- buyer interest (public form submissions) ----------
  const interestLots = [
    ...unsold.filter((t) => status.get(t.lotIdx) === "RESERVED"),
    ...unsold.filter((t) => status.get(t.lotIdx) === "LISTED").slice(0, 4),
  ];
  const interestData = INTERESTED_COMPANIES.map(([companyName, contactName], i) => {
    const t = interestLots[i % interestLots.length];
    const slug = companyName.toLowerCase().replace(/[^a-z]+/g, "-").replace(/-+$/, "");
    const createdAt = notFuture(addDays(t.testedAt, int(1, 10)));
    return {
      lotId: lotId(t.lotIdx),
      companyName,
      contactName,
      email: `${contactName.split(" ")[0].toLowerCase()}@${slug}.example`,
      phone: `0800000${8001 + i}`,
      message: pick(INTEREST_MESSAGES),
      createdAt,
      contactedAt: i % 2 === 0 ? notFuture(addDays(createdAt, 1)) : null, // half already followed up
    };
  });
  await db.buyerInterest.createMany({ data: interestData });

  // ---------- audit log: one lifecycle event per state change, shown on the lot timeline ----------
  const saleByLotId = new Map(saleData.map((s) => [s.lotId, s]));
  const events: { agentId: string; action: string; entity: string; entityId: string; detail: string; createdAt: Date }[] = [];
  lotData.forEach((l, i) => {
    const id = lotId(i);
    const event = (action: string, at: Date, detail: string, agentId = l.agentId) =>
      events.push({ agentId, action, entity: "Lot", entityId: id, detail, createdAt: notFuture(at) });
    const test = testByIdx.get(i);
    const sale = saleByLotId.get(id);

    event("RECEIVED", l.receivedAt, `${l.bags} bags · ${formatKg(l.weightKg)}`);
    if (l.dryingStartedAt) event("DRYING_STARTED", l.dryingStartedAt, `Solar platform · moisture ${l.moistureBefore}%`);
    if (!test) return;
    const gradeLabel = test.grade === "FAIL" ? "Fail" : `Grade ${test.grade}`;
    event("TESTED", test.testedAt, `${gradeLabel} · KOR ${test.korLbs} lbs · moisture ${test.moistureAfter}%`, test.testedById);
    if (l.status === "REJECTED") {
      event("REJECTED", new Date(test.testedAt.getTime() + int(1, 6) * 3600_000), REJECT_REASON);
      return;
    }
    if (l.status === "TESTED") return;
    const listedAt = new Date(test.testedAt.getTime() + int(1, 20) * 3600_000);
    event("LISTED", listedAt, "Listed for sale to buyers");
    if (l.status === "RESERVED") event("RESERVED", addDays(listedAt, int(1, 5)), "Held for a buyer after an enquiry", admin.id);
    if (sale) {
      event("SOLD", sale.soldAt, `${sale.buyerName} · ${formatNaira(sale.pricePerTonneNgn)}/t · farmer payout ${formatNaira(sale.farmerPayoutNgn)}`);
    }
  });
  await db.auditLog.createMany({ data: events });

  // ---------- summary ----------
  const womenOrYouth = farmerData.filter((f) => f.gender === "FEMALE" || f.ageGroup === "YOUTH_18_35").length;
  const gradeCounts = tests.reduce<Record<string, number>>((acc, t) => ({ ...acc, [t.grade]: (acc[t.grade] ?? 0) + 1 }), {});
  const statusCounts = [...status.values()].reduce<Record<string, number>>((acc, s) => ({ ...acc, [s]: (acc[s] ?? 0) + 1 }), {});
  console.log({
    hubs: await db.hub.count(),
    agents: await db.agent.count(),
    farmers: await db.farmer.count(),
    farmersWomenOrYouthPct: Math.round((womenOrYouth / farmerData.length) * 100),
    lots: await db.lot.count(),
    lotsBySeason: { 2025: sequence[2025], 2026: sequence[2026] },
    lotStatuses: statusCounts,
    qualityTests: await db.qualityTest.count(),
    grades: gradeCounts,
    sales: await db.sale.count(),
    buyerInterests: await db.buyerInterest.count(),
    auditLogs: await db.auditLog.count(),
  });
  console.log(`Demo logins — admin: phone 0800 000 9000, PIN from ADMIN_PIN; agents: 0800 000 9001–9004, PIN ${DEMO_AGENT_PIN}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
