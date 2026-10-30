"use client";

// Last-resort error page when the root layout itself fails. Must render its own <html> and <body>.
export default function RootError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#FAF7F2", color: "#1E1E1E" }}>
        <div style={{ background: "#1E1E1E", color: "#FAF7F2", textAlign: "center", fontSize: 12, padding: 6 }}>
          Prototype · demo data
        </div>
        <main style={{ maxWidth: 560, margin: "0 auto", padding: "56px 16px" }}>
          <h1 style={{ color: "#1F5130", fontSize: 28 }}>CashewTrace is temporarily unavailable</h1>
          <p>Please try again in a moment.</p>
          <button
            onClick={reset}
            style={{ height: 48, padding: "0 20px", borderRadius: 12, border: 0, background: "#1F5130", color: "#FAF7F2", fontWeight: 600 }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
