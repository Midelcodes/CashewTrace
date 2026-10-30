import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/public/SiteChrome";
import { INCLUSION_TARGET_PCT } from "@/lib/impact";
import { getLandingStats } from "@/lib/landing";
import { formatNaira, formatNairaCompact, formatTonnes } from "@/lib/money";

export const metadata: Metadata = {
  title: "CashewTrace | Quality you can trace. Value Nigeria keeps.",
  description:
    "Village quality hubs for Nigerian cashew: solar-dried, moisture- and KOR-tested, QR-traceable raw cashew nuts from smallholder farmers.",
  openGraph: {
    title: "CashewTrace | Quality you can trace. Value Nigeria keeps.",
    description: "Solar-dried, tested, QR-traceable cashew from Nigerian smallholders.",
    url: "/",
    siteName: "CashewTrace",
    type: "website",
  },
};

// Rendered per request (live numbers), but the numbers themselves are cached for 5 minutes.
// Plain <a> links instead of next/link: no client components to hydrate keeps mobile Lighthouse at 90+.
export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const s = await getLandingStats();
  const agentsPct = s.agents ? Math.round((s.agentsWomenOrYouth / s.agents) * 100) : null;

  return (
    <>
      <SiteHeader wide />
      <main className="flex-1">
        {/* ---------- Hero ---------- */}
        <section className="bg-brand text-cream">
          <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 md:grid-cols-[1.2fr_1fr] md:py-20">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-cream/70">Village quality hubs · Nigeria</p>
              <h1 className="mt-3 text-4xl leading-tight font-bold sm:text-5xl">
                Quality you can trace.{" "}
                <span className="text-accent">Value Nigeria keeps.</span>
              </h1>
              <p className="mt-4 max-w-xl text-lg text-cream/85">
                Solar-dried, moisture- and KOR-tested, QR-traceable raw cashew nuts from Nigerian smallholder farmers,
                verified at the village, before the first sale.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <a
                  href="/verify"
                  className="flex h-14 items-center justify-center rounded-xl bg-accent-dark px-7 text-base font-semibold text-white transition hover:bg-accent-darker"
                >
                  Verify a lot
                </a>
                <a
                  href="/impact"
                  className="flex h-14 items-center justify-center rounded-xl px-7 text-base font-semibold text-cream ring-2 ring-cream/40 transition hover:bg-white/10"
                >
                  See our impact
                </a>
              </div>
              <p className="mt-4 text-sm text-cream/70">
                Buying? <a href="/lots" className="font-semibold text-cream underline underline-offset-2">Browse available lots</a>
                {" · "}
                Hub agent? <a href="/login" className="font-semibold text-cream underline underline-offset-2">Sign in</a>
              </p>
            </div>
            <HeroIllustration />
          </div>
        </section>

        {/* ---------- Problem ---------- */}
        <Section eyebrow="The problem" title="Good nuts lose value before they leave the village">
          <div className="grid gap-4 md:grid-cols-3">
            <Card icon={<DropIcon />} title="Wet and mixed nuts">
              Nuts sold damp or mixed across qualities are rejected or heavily discounted by processors and exporters.
            </Card>
            <Card icon={<ScaleIcon />} title="Farmers paid by guesswork">
              Without a moisture meter or a KOR test, farmers can’t prove their quality, so they take the price they’re
              given.
            </Card>
            <Card icon={<BorderIcon />} title="Origin leaks away">
              Nigerian nuts are often traded across borders and sold under another country’s origin, so the premium
              never returns home.
            </Card>
          </div>
        </Section>

        {/* ---------- How it works ---------- */}
        <Section eyebrow="How it works" title="Five steps at a village hub" tone="white">
          <ol className="grid gap-4 md:grid-cols-5">
            {[
              { icon: <UserIcon />, title: "Register farmer", text: "Hub agent records the farmer with consent on a basic Android phone." },
              { icon: <SunIcon />, title: "Solar dry", text: "Nuts dry on raised solar platforms: no fuel, no ground contact." },
              { icon: <MeterIcon />, title: "Test moisture & KOR", text: "Each lot is measured and graded A, B or C against set thresholds." },
              { icon: <QrIcon />, title: "QR tag", text: "Every bag gets a label with a QR code linked to its record." },
              { icon: <HandshakeIcon />, title: "Sell to verified buyers", text: "Buyers scan, verify and request the lot. Farmers keep ownership." },
            ].map((step, i) => (
              <li key={step.title} className="flex gap-4 rounded-2xl bg-cream p-5 md:flex-col md:gap-3">
                <div className="flex shrink-0 items-center gap-3 md:justify-between">
                  <span className="flex size-12 items-center justify-center rounded-xl bg-brand text-cream">{step.icon}</span>
                  <span className="hidden text-3xl font-black text-brand/15 md:block">{i + 1}</span>
                </div>
                <div>
                  <h3 className="font-bold">
                    <span className="text-accent-dark md:hidden">{i + 1}. </span>
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm text-ink/70">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </Section>

        {/* ---------- Who benefits ---------- */}
        <Section eyebrow="Who benefits" title="Value shared along the chain">
          <div className="grid gap-4 md:grid-cols-3">
            <Benefit title="Farmers" items={[
              "Paid on proven quality, not guesswork",
              "Keep ownership of their nuts until sale",
              <>Small service fee (<Money value={formatNaira(s.feePerBagNgn)} /> per bag for drying &amp; testing)</>,
              "A printable sales record for microfinance",
            ]} />
            <Benefit title="Buyers" items={[
              "Dry, graded lots with moisture and KOR on record",
              "Scan a QR code to verify origin and chain of custody",
              "Request lots directly from the hub",
              `${s.commissionPct}% commission on completed purchases`,
            ]} />
            <Benefit title="Nigeria" items={[
              "Traceable Nigerian origin that earns its premium",
              "Fewer rejected and spoiled lots",
              "Rural jobs for women and youth as hub agents",
              "Data for policy and processing investment",
            ]} />
          </div>
        </Section>

        {/* ---------- Live numbers ---------- */}
        <Section eyebrow="Live numbers" title="From the CashewTrace database" tone="white">
          <p className="-mt-4 mb-5 inline-block rounded-full bg-ink px-3 py-1 text-xs font-semibold text-cream">
            Prototype · demo data
          </p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat value={String(s.farmers)} label="Farmers registered" />
            <Stat value={formatTonnes(s.kgDried)} label="Solar-dried & tested" />
            <Stat value={<Money value={formatNairaCompact(s.paidNgn)} />} label="Paid to farmers" />
            <Stat value={s.avgKor === null ? "n/a" : s.avgKor.toFixed(1)} label="Average KOR (lbs / 80 kg)" />
          </div>
          <a href="/impact" className="mt-5 inline-block font-semibold text-brand underline underline-offset-2">
            See the full impact dashboard →
          </a>
        </Section>

        {/* ---------- Climate-smart + Inclusion ---------- */}
        <Section eyebrow="Climate-smart & inclusive" title="Better for the land and for the people who farm it">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-white p-6 ring-1 ring-black/5">
              <h3 className="text-lg font-bold">Climate-smart</h3>
              <ul className="mt-4 flex flex-col gap-4">
                <Point icon={<SunIcon />} title="Solar drying, no fuel">
                  Every lot is dried on solar platforms, using 0 litres of diesel.
                </Point>
                <Point icon={<LeafIcon />} title="Less spoilage and waste">
                  Drying to safe moisture before storage cuts mould and rejected lots. Estimated{" "}
                  {formatTonnes(s.lossAvoidedKg)} saved so far (demo data).
                </Point>
                <Point icon={<SproutIcon />} title="Conservation Agriculture training">
                  Planned at every hub in the off-season: mulching, cover crops and minimal tillage for healthier trees.
                </Point>
              </ul>
            </div>
            <div className="flex flex-col rounded-2xl bg-brand p-6 text-cream">
              <h3 className="text-lg font-bold">Inclusion</h3>
              <p className="mt-4 text-5xl font-bold">{INCLUSION_TARGET_PCT}%</p>
              <p className="mt-1 text-lg">of hub agents women or youth: our hiring commitment.</p>
              <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-white/10 p-3">
                  <p className="text-2xl font-bold">{agentsPct === null ? "n/a" : `${agentsPct}%`}</p>
                  <p className="text-cream/80">
                    of demo hub agents today ({s.agentsWomenOrYouth} of {s.agents})
                  </p>
                </div>
                <div className="rounded-xl bg-white/10 p-3">
                  <p className="text-2xl font-bold">
                    {s.farmersWomenOrYouthPct === null ? "n/a" : `${Math.round(s.farmersWomenOrYouthPct)}%`}
                  </p>
                  <p className="text-cream/80">of registered farmers are women or youth</p>
                </div>
              </div>
              <p className="mt-4 text-xs text-cream/80">Prototype · demo data</p>
            </div>
          </div>
        </Section>

        {/* ---------- CTA ---------- */}
        <section className="bg-accent-dark text-white">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 py-10 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Holding a CashewTrace bag?</h2>
              <p className="text-white">Scan the QR code or enter the lot code to see its full record.</p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <a href="/verify" className="flex h-12 items-center justify-center rounded-xl bg-white px-6 font-semibold text-accent-dark">
                Verify a lot
              </a>
              <a href="/lots" className="flex h-12 items-center justify-center rounded-xl px-6 font-semibold text-white ring-2 ring-white/60">
                Browse available lots
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-ink text-cream/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm md:flex-row md:justify-between">
          <div>
            <p className="font-semibold text-cream">CashewTrace Nigeria · Prototype for GIZ e-MOVE submission</p>
            <p className="mt-1">
              Contact: <a href="mailto:hello@cashewtrace.example" className="underline underline-offset-2">hello@cashewtrace.example</a>{" "}
              <span className="text-cream/70">(placeholder)</span>
            </p>
            <p className="mt-1 text-cream/70">All farmers, lots and figures shown are fictional demo data.</p>
          </div>
          <nav className="flex flex-wrap gap-x-5 gap-y-2">
            <a href="/lots" className="hover:text-cream">Available lots</a>
            <a href="/impact" className="hover:text-cream">Impact</a>
            <a href="/verify" className="hover:text-cream">Verify a lot</a>
            <a href="/login" className="hover:text-cream">Hub sign-in</a>
          </nav>
        </div>
      </footer>
    </>
  );
}

// ---------- building blocks ----------

function Section({ eyebrow, title, tone, children }: { eyebrow: string; title: string; tone?: "white"; children: ReactNode }) {
  return (
    <section className={tone === "white" ? "bg-white" : undefined}>
      <div className="mx-auto max-w-6xl px-4 py-14">
        <p className="text-sm font-semibold uppercase tracking-wider text-accent-dark">{eyebrow}</p>
        <h2 className="mt-2 mb-8 max-w-2xl text-3xl font-bold text-brand">{title}</h2>
        {children}
      </div>
    </section>
  );
}

function Card({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-6 ring-1 ring-black/5">
      <span className="flex size-12 items-center justify-center rounded-xl bg-accent/15 text-accent-dark">{icon}</span>
      <h3 className="mt-4 text-lg font-bold">{title}</h3>
      <p className="mt-1 text-ink/70">{children}</p>
    </div>
  );
}

function Benefit({ title, items }: { title: string; items: ReactNode[] }) {
  return (
    <div className="rounded-2xl bg-white p-6 ring-1 ring-black/5">
      <h3 className="text-xl font-bold text-brand">{title}</h3>
      <ul className="mt-4 flex flex-col gap-2.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2.5 text-ink/80">
            <span aria-hidden="true" className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-light text-xs font-bold text-brand">
              ✓
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Stat({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="rounded-2xl bg-cream p-5">
      <p className="text-3xl font-bold text-brand">{value}</p>
      <p className="mt-1 text-sm text-ink/70">{label}</p>
    </div>
  );
}

function Point({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand [&>svg]:size-5">{icon}</span>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-ink/70">{children}</p>
      </div>
    </li>
  );
}

/** "₦2.3m" with the ₦ in the system font: Inter only ships ₦ in its latin-ext file (+84 KiB). */
function Money({ value }: { value: string }) {
  if (!value.startsWith("₦")) return <>{value}</>;
  return (
    <>
      <span style={{ fontFamily: "system-ui, sans-serif" }}>₦</span>
      {value.slice(1)}
    </>
  );
}

// ---------- inline icons (24px stroke) ----------

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}
const DropIcon = () => <Svg><path d="M12 2.7 6.3 9.5a7 7 0 1 0 11.4 0z" /><path d="M9 15a3 3 0 0 0 3 3" /></Svg>;
const ScaleIcon = () => <Svg><path d="M12 3v18M5 21h14M6 7h12M6 7l-3 7a3 3 0 0 0 6 0zM18 7l-3 7a3 3 0 0 0 6 0z" /></Svg>;
const BorderIcon = () => <Svg><path d="M4 4v16M14 12H8m10 0-4-4m4 4-4 4" /><path d="M20 4v16" strokeDasharray="2 3" /></Svg>;
const UserIcon = () => <Svg><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0 1 12 0v1M19 8v6M22 11h-6" /></Svg>;
const SunIcon = () => <Svg><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></Svg>;
const MeterIcon = () => <Svg><path d="M4 18a8 8 0 1 1 16 0" /><path d="m12 18 4-6" /><path d="M8 18h8" /></Svg>;
const QrIcon = () => <Svg><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3" /></Svg>;
const HandshakeIcon = () => <Svg><path d="m11 17 2 2a1.4 1.4 0 0 0 2-2" /><path d="m14 14 2.5 2.5a1.4 1.4 0 0 0 2-2l-3.9-3.9a2 2 0 0 0-2.8 0l-.9.9a1.4 1.4 0 0 1-2-2l2.8-2.8a4 4 0 0 1 4.3-.9l2.4 1M2 12l5.5 5.5a1.4 1.4 0 0 0 2-2M2 6h4l4 4M22 6h-3" /></Svg>;
const LeafIcon = () => <Svg><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10Z" /><path d="M2 21c0-3 1.9-5.4 5.2-6.1" /></Svg>;
const SproutIcon = () => <Svg><path d="M7 20h10M12 20v-8M12 12C12 8 9 6 5 6c0 4 3 6 7 6ZM12 12c0-3 2-5 6-5 0 3-2 5-6 5Z" /></Svg>;

/** Simple brand-colour illustration: sun, raised solar drying platform with nuts, and a QR-tagged bag. */
function HeroIllustration() {
  return (
    <svg viewBox="0 0 360 280" className="mx-auto w-full max-w-md" role="img" aria-label="Cashew nuts drying on a solar platform next to a QR-tagged bag">
      <circle cx="292" cy="58" r="30" fill="#E8742C" />
      <g stroke="#E8742C" strokeWidth="5" strokeLinecap="round">
        <path d="M292 12v-6M292 110v6M246 58h-6M338 58h6M259 25l-4-4M325 91l4 4M259 91l-4 4M325 25l4-4" />
      </g>
      {/* drying platform */}
      <rect x="20" y="168" width="220" height="12" rx="4" fill="#FAF7F2" />
      <path d="M40 180v62M220 180v62M130 180v62" stroke="#FAF7F2" strokeWidth="8" strokeLinecap="round" />
      {/* nuts on the platform */}
      {[34, 60, 86, 112, 138, 164, 190, 214].map((x, i) => (
        <path
          key={x}
          d={`M${x} ${160 - (i % 2) * 4}c0-9 9-14 15-9 4 3 1 8-3 8-3 0-4 4-1 6-6 3-11 0-11-5z`}
          fill={i % 3 === 0 ? "#E8742C" : "#F3D9B1"}
        />
      ))}
      {/* bag with QR tag */}
      <path d="M258 150h70l10 100H248z" fill="#F3D9B1" />
      <path d="M262 150c4-10 58-10 62 0" fill="none" stroke="#D9B98A" strokeWidth="6" />
      <rect x="270" y="176" width="46" height="56" rx="6" fill="#FAF7F2" />
      <g fill="#1E1E1E">
        <rect x="276" y="182" width="12" height="12" />
        <rect x="298" y="182" width="12" height="12" />
        <rect x="276" y="204" width="12" height="12" />
        <rect x="298" y="204" width="5" height="5" />
        <rect x="305" y="211" width="5" height="5" />
        <rect x="291" y="196" width="5" height="5" />
      </g>
      <text x="293" y="228" textAnchor="middle" fontSize="7" fontWeight="700" fill="#1F5130">SCAN</text>
      <circle cx="322" cy="174" r="12" fill="#E8742C" />
      <path d="m316 174 4 4 8-8" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M0 250h360" stroke="#FAF7F2" strokeOpacity=".3" strokeWidth="2" />
    </svg>
  );
}
