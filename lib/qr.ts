import "server-only";
import QRCode from "qrcode";

/** Public verification URL baked into a lot's QR code. */
export function verifyUrl(lotCode: string): string {
  const base = (process.env.PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
  return `${base}/v/${encodeURIComponent(lotCode)}`;
}

/** QR code as an inline SVG string (scales cleanly for print). */
export function qrSvg(text: string): Promise<string> {
  return QRCode.toString(text, {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: "#1E1E1E", light: "#FFFFFF" },
  });
}
