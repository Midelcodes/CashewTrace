import { PageHeader } from "@/components/hub/PageHeader";
import { inputClass } from "@/components/ui/form";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

const EXPORTS = [
  { kind: "farmers", title: "Farmers", text: "Register with gender, age group, location, farm size and volume delivered." },
  { kind: "lots", title: "Lots with quality tests", text: "Every lot with moisture, KOR, grade, drying and status." },
  { kind: "sales", title: "Sales", text: "Prices, commission, farmer fees and payouts per sale." },
];

// Plain GET forms: each downloads a CSV from /hub/exports/<kind>.
export default async function ExportsPage() {
  await requireAdmin();
  const [hubs, seasons] = await Promise.all([
    db.hub.findMany({ orderBy: { name: "asc" }, select: { code: true, name: true } }),
    db.lot.findMany({ distinct: ["season"], select: { season: true }, orderBy: { season: "desc" } }),
  ]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <PageHeader title="Exports" description="CSV files for reporting to GIZ and partners. Opens in Excel or Google Sheets." />

      {EXPORTS.map((e) => (
        <form key={e.kind} action={`/hub/exports/${e.kind}`} method="get" className="rounded-2xl bg-white p-5 ring-1 ring-black/5">
          <h2 className="text-lg font-bold">{e.title}</h2>
          <p className="mt-0.5 mb-4 text-sm text-ink/70">{e.text}</p>
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-ink/70">Season</span>
              <select name="season" defaultValue="" className={inputClass}>
                <option value="">All seasons</option>
                {seasons.map((s) => (
                  <option key={s.season} value={s.season}>
                    {s.season}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-ink/70">Hub</span>
              <select name="hub" defaultValue="" className={inputClass}>
                <option value="">All hubs</option>
                {hubs.map((h) => (
                  <option key={h.code} value={h.code}>
                    {h.name}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="h-12 rounded-xl bg-brand px-5 text-sm font-semibold text-cream hover:bg-brand-dark">
              Download CSV
            </button>
          </div>
          <label className="mt-3 flex items-start gap-2 text-sm text-ink/80">
              <input type="checkbox" name="personal" value="1" className="mt-0.5 size-5 accent-brand" />
              <span>
                Include farmer names{e.kind === "lots" ? "" : " and phone numbers"} — internal use only. Leave unticked for
                files you share: farmers are identified by code.
              </span>
          </label>
        </form>
      ))}

      <p className="text-xs text-ink/70">Every export is recorded in the audit log.</p>
    </div>
  );
}
