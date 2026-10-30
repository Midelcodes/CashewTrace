import { PageHeader } from "@/components/hub/PageHeader";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { SettingsForm } from "./SettingsForm";

export default async function SettingsPage() {
  await requireAdmin();
  const [settings, lastChange] = await Promise.all([
    getSettings(),
    db.auditLog.findFirst({
      where: { entity: "Settings" },
      orderBy: { createdAt: "desc" },
      include: { agent: { select: { name: true } } },
    }),
  ]);

  // The form works in display units: percentages as 0–100.
  const defaults = {
    farmGatePricePerTonneNgn: settings.farmGatePricePerTonneNgn,
    commissionPct: Math.round(settings.commissionRate * 10_000) / 100,
    dryingTestFeePerBagNgn: settings.dryingTestFeePerBagNgn,
    storageFeePerBagPerMonthNgn: settings.storageFeePerBagPerMonthNgn,
    moistureMaxPct: settings.moistureMaxPct,
    gradeA_minKor: settings.gradeA_minKor,
    gradeB_minKor: settings.gradeB_minKor,
    gradeC_minKor: settings.gradeC_minKor,
    spoilageAvoidedPct: Math.round(settings.spoilageAvoidedFactor * 10_000) / 100,
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Settings"
        description={`Last updated ${formatDateTime(settings.updatedAt)}${lastChange ? ` by ${lastChange.agent.name}` : ""}`}
      />
      {lastChange?.detail && (
        <p className="-mt-3 mb-5 text-xs text-ink/70">
          Last change: {lastChange.detail}
        </p>
      )}
      <SettingsForm defaults={defaults} />
    </div>
  );
}
