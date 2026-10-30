import { requireAdmin } from "@/lib/auth";
import { toCsv } from "@/lib/csv";
import { db } from "@/lib/db";
import { toNumber } from "@/lib/money";

// Admin CSV exports for reporting. Pseudonymised by default (farmer codes, no names/phones);
// ?personal=1 adds names and phone numbers for internal use only.

const KINDS = ["farmers", "lots", "sales"] as const;
type Kind = (typeof KINDS)[number];

const n = (d: { toNumber(): number } | null | undefined) => (d == null ? null : toNumber(d));

export async function GET(request: Request, { params }: { params: Promise<{ kind: string }> }) {
  const admin = await requireAdmin();
  const kind = (await params).kind.replace(/\.csv$/, "") as Kind;
  if (!KINDS.includes(kind)) return new Response("Unknown export", { status: 404 });

  const url = new URL(request.url);
  const season = Number(url.searchParams.get("season")) || undefined;
  const hubCode = url.searchParams.get("hub") || undefined;
  const personal = url.searchParams.get("personal") === "1";
  const hubWhere = hubCode ? { hub: { code: hubCode } } : {};

  let headers: string[];
  let rows: (string | number | boolean | Date | null | undefined)[][];

  if (kind === "farmers") {
    const farmers = await db.farmer.findMany({
      where: hubWhere,
      orderBy: { farmerCode: "asc" },
      include: { hub: { select: { code: true } }, lots: { where: season ? { season } : {}, select: { weightKg: true } } },
    });
    headers = [
      "farmer_code", ...(personal ? ["full_name", "phone"] : []), "gender", "age_group", "community", "lga", "state",
      "farm_size_ha", "number_of_trees", "cooperative", "consent_given", "hub_code", "registered_at", "lots_delivered", "kg_delivered",
    ];
    rows = farmers.map((f) => [
      f.farmerCode, ...(personal ? [f.fullName, f.phone] : []), f.gender, f.ageGroup, f.community, f.lga, f.state,
      n(f.farmSizeHa), f.numberOfTrees, f.cooperative, f.consentGiven, f.hub.code, f.createdAt, f.lots.length,
      Math.round(f.lots.reduce((s, l) => s + toNumber(l.weightKg), 0) * 100) / 100,
    ]);
  } else if (kind === "lots") {
    const lots = await db.lot.findMany({
      where: { ...hubWhere, ...(season && { season }) },
      orderBy: { lotCode: "asc" },
      include: {
        hub: { select: { code: true } },
        farmer: { select: { farmerCode: true, fullName: true, gender: true, ageGroup: true, community: true, lga: true, state: true } },
        qualityTest: { include: { testedBy: { select: { name: true } } } },
      },
    });
    headers = [
      "lot_code", "season", "harvest_month", "hub_code", "farmer_code", ...(personal ? ["farmer_name"] : []), "farmer_gender",
      "farmer_age_group", "community", "lga", "state", "bags", "weight_kg", "status", "received_at", "moisture_before_pct",
      "moisture_after_pct", "kor_lbs", "nut_count_per_kg", "defective_pct", "grade", "drying_days", "drying_method",
      "tested_at", "tested_by", "rejection_reason",
    ];
    rows = lots.map((l) => {
      const t = l.qualityTest;
      return [
        l.lotCode, l.season, l.harvestMonth, l.hub.code, l.farmer.farmerCode, ...(personal ? [l.farmer.fullName] : []),
        l.farmer.gender, l.farmer.ageGroup, l.farmer.community, l.farmer.lga, l.farmer.state, l.bags, n(l.weightKg), l.status,
        l.receivedAt, n(t?.moistureBefore ?? l.moistureBefore), n(t?.moistureAfter), n(t?.korLbs), t?.nutCountPerKg,
        n(t?.defectivePct), t?.grade, t?.dryingDays, t?.dryingMethod, t?.testedAt, t?.testedBy.name, l.rejectionReason,
      ];
    });
  } else {
    const sales = await db.sale.findMany({
      where: { lot: { ...hubWhere, ...(season && { season }) } },
      orderBy: { soldAt: "asc" },
      include: {
        lot: {
          select: {
            lotCode: true, season: true, bags: true, weightKg: true,
            hub: { select: { code: true } },
            farmer: { select: { farmerCode: true, fullName: true, phone: true } },
            qualityTest: { select: { grade: true } },
          },
        },
      },
    });
    headers = [
      "lot_code", "season", "hub_code", "farmer_code", ...(personal ? ["farmer_name", "farmer_phone"] : []), "sold_at",
      "buyer_name", "bags", "weight_kg", "grade", "price_per_tonne_ngn", "total_value_ngn", "commission_ngn",
      "farmer_fees_ngn", "farmer_payout_ngn",
    ];
    rows = sales.map((s) => [
      s.lot.lotCode, s.lot.season, s.lot.hub.code, s.lot.farmer.farmerCode,
      ...(personal ? [s.lot.farmer.fullName, s.lot.farmer.phone] : []), s.soldAt, s.buyerName, s.lot.bags, n(s.lot.weightKg),
      s.lot.qualityTest?.grade, n(s.pricePerTonneNgn), n(s.totalValueNgn), n(s.commissionNgn), n(s.farmerFeesNgn), n(s.farmerPayoutNgn),
    ]);
  }

  await db.auditLog.create({
    data: {
      agentId: admin.id,
      action: "EXPORT",
      entity: "Export",
      entityId: kind,
      detail: `${rows.length} rows${season ? ` · ${season}` : ""}${hubCode ? ` · ${hubCode}` : ""}${personal ? " · with personal data" : ""}`,
    },
  });

  const stamp = new Date().toISOString().slice(0, 10);
  const name = ["cashewtrace", kind, hubCode, season, personal ? "personal" : null, stamp].filter(Boolean).join("-");
  return new Response(toCsv(headers, rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
