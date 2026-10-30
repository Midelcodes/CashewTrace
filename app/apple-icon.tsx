import { ImageResponse } from "next/og";

// Home-screen icon for iOS (and PNG fallback for the manifest): the cashew + tick mark.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#1F5130" }}>
        <svg viewBox="0 0 64 64" width="150" height="150">
          <path d="M22 18c-6 2-9 9-6 16 3 8 12 13 21 11 6-1 10-6 9-11-1-4-5-6-9-5-4 1-6-2-5-5 1-4-3-8-10-6z" fill="#E8742C" />
          <path d="m25 33 5 5 10-11" fill="none" stroke="#FAF7F2" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    ),
    size,
  );
}
