// Money and weight helpers. Money is stored as Decimal(14,2) naira; maths is done in whole kobo
// so rounding is exact, then converted back to naira.

const nairaFormat = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 });
const kgFormat = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 1 });

/** Prisma Decimal (or plain number) → number. */
export function toNumber(value: { toNumber(): number } | number | string): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return value.toNumber();
}

const toKobo = (naira: number) => Math.round(naira * 100);
const toNaira = (kobo: number) => kobo / 100;

export type SaleInput = { weightKg: number; bags: number; pricePerTonneNgn: number };
export type FeeSettings = { commissionRate: number; dryingTestFeePerBagNgn: number };
export type SaleBreakdown = {
  totalValueNgn: number;
  commissionNgn: number;
  farmerFeesNgn: number;
  farmerPayoutNgn: number;
};

export function calculateSale(
  { weightKg, bags, pricePerTonneNgn }: SaleInput,
  { commissionRate, dryingTestFeePerBagNgn }: FeeSettings,
): SaleBreakdown {
  const totalKobo = Math.round((weightKg / 1000) * toKobo(pricePerTonneNgn));
  const commissionKobo = Math.round(totalKobo * commissionRate); // paid by the buyer
  const feesKobo = bags * toKobo(dryingTestFeePerBagNgn);
  return {
    totalValueNgn: toNaira(totalKobo),
    commissionNgn: toNaira(commissionKobo),
    farmerFeesNgn: toNaira(feesKobo),
    farmerPayoutNgn: toNaira(totalKobo - feesKobo),
  };
}

/** 1234567 → "₦1,234,567" */
export function formatNaira(amount: number): string {
  return `₦${nairaFormat.format(Math.round(amount))}`;
}

/** 1234.5 → "1,234.5 kg" */
export function formatKg(kg: number): string {
  return `${kgFormat.format(kg)} kg`;
}

/** 12500 → "12.5 t" — for summaries; pass 2 digits for small lots ("0.16 t"). */
export function formatTonnes(kg: number, digits = 1): string {
  const f = new Intl.NumberFormat("en-NG", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return `${f.format(kg / 1000)} t`;
}

/** 3214567 → "₦3.2m", 912000 → "₦912k" — for stat tiles; show the full figure alongside. */
export function formatNairaCompact(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1)}m`;
  if (Math.abs(amount) >= 10_000) return `₦${Math.round(amount / 1000)}k`;
  return formatNaira(amount);
}
