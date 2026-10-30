// Human-readable codes. Sequences are assigned by the caller (next number for that series).

const STATE_CODES: Record<string, string> = {
  Kogi: "KOG",
  Kwara: "KWA",
  Oyo: "OYO",
  Ogun: "OGU",
  Osun: "OSU",
  Ondo: "OND",
  Ekiti: "EKI",
  Enugu: "ENU",
  Ebonyi: "EBO",
  Anambra: "ANA",
  Benue: "BEN",
  Nasarawa: "NAS",
  Niger: "NIG",
  Kaduna: "KAD",
  Taraba: "TAR",
  FCT: "FCT",
};

export function stateCode(state: string): string {
  return STATE_CODES[state] ?? state.slice(0, 3).toUpperCase();
}

const pad6 = (n: number) => String(n).padStart(6, "0");

/** 123 → "CTF-000123" */
export function formatFarmerCode(sequence: number): string {
  return `CTF-${pad6(sequence)}`;
}

/** ("Kogi", 2026, 123) → "CT-KOG-2026-000123" */
export function formatLotCode(state: string, season: number, sequence: number): string {
  return `CT-${stateCode(state)}-${season}-${pad6(sequence)}`;
}

/** "Amina Bello" → "A.B." — the only form of a farmer's name allowed on public pages. */
export function initials(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => `${part[0].toUpperCase()}.`)
    .join("");
}
