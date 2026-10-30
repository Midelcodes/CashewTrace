import { ImageResponse } from "next/og";
import { GRADE_HEX } from "@/components/ui/badges";
import { getPublicLot } from "@/lib/public-lot";

// Link preview for WhatsApp and other chat apps (1200×630 PNG).
export const alt = "Verified CashewTrace cashew lot";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-dynamic";

const DARK_TEXT = new Set(["B", "C"]);

export default async function Image({ params }: { params: Promise<{ lotCode: string }> }) {
  const lot = await getPublicLot((await params).lotCode);
  const grade = lot?.test?.grade;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#FAF7F2", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#1F5130", color: "white", padding: "36px 56px" }}>
          <div style={{ display: "flex", fontSize: 44, fontWeight: 700 }}>
            Cashew<span style={{ color: "#E8742C" }}>Trace</span>
          </div>
          <div style={{ display: "flex", fontSize: 30 }}>{lot ? "Verified lot" : "Lot not found"}</div>
        </div>
        {lot ? (
          <div style={{ display: "flex", flex: 1, alignItems: "center", padding: "0 56px", gap: 48 }}>
            {grade && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 230,
                  height: 260,
                  borderRadius: 28,
                  background: GRADE_HEX[grade],
                  color: DARK_TEXT.has(grade) ? "#1E1E1E" : "white",
                }}
              >
                <div style={{ display: "flex", fontSize: 32, fontWeight: 600 }}>GRADE</div>
                <div style={{ display: "flex", fontSize: 150, fontWeight: 800, lineHeight: 1 }}>{grade === "FAIL" ? "X" : grade}</div>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", color: "#1E1E1E" }}>
              <div style={{ display: "flex", fontSize: 54, fontWeight: 700 }}>{lot.lotCode}</div>
              {lot.test && (
                <div style={{ display: "flex", fontSize: 38, marginTop: 18 }}>
                  KOR {lot.test.korLbs.toFixed(1)} lbs/80 kg · moisture {lot.test.moistureAfter}%
                </div>
              )}
              <div style={{ display: "flex", fontSize: 34, marginTop: 14, color: "#555" }}>
                {lot.origin.community}, {lot.origin.state} State, Nigeria · {lot.season} season
              </div>
              <div style={{ display: "flex", fontSize: 26, marginTop: 30, color: "#888" }}>Prototype · demo data</div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", fontSize: 48 }}>
            Check the lot code and try again
          </div>
        )}
      </div>
    ),
    size,
  );
}
