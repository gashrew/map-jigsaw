/**
 * Landing page — Map Jigsaw
 * Dark Atlas design: deep navy, gold accents, Playfair Display titles.
 * Shows a card for each available jigsaw map with a mini SVG preview.
 */

import { US_STATES, SVG_WIDTH as USA_W, SVG_HEIGHT as USA_H } from "@/lib/usStatesData";
import { COUNTIES, SVG_WIDTH as ENG_W, SVG_HEIGHT as ENG_H } from "@/lib/countiesData";
import { EUROPE, EUROPE_CONTEXT, SVG_WIDTH as EU_W, SVG_HEIGHT as EU_H } from "@/lib/europeData";
import { Link } from "wouter";

// ─── Mini map previews ────────────────────────────────────────────────────────
function EnglandMini() {
  const W = 160, H = 200;
  const scaleX = W / ENG_W;
  const scaleY = H / ENG_H;
  const sc = Math.min(scaleX, scaleY) * 0.9;
  const ox = (W - ENG_W * sc) / 2;
  const oy = (H - ENG_H * sc) / 2;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ display: "block" }}>
      <g transform={`translate(${ox},${oy}) scale(${sc})`}>
        {COUNTIES.map((c: { id: string; path: string; colour: string }) => (
          <path key={c.id} d={c.path} fill={c.colour} stroke="#0f1b2d" strokeWidth="1.2" fillRule="evenodd" />
        ))}
      </g>
    </svg>
  );
}

function USAMini() {
  const W = 240, H = 160;
  const scaleX = W / USA_W;
  const scaleY = H / USA_H;
  const sc = Math.min(scaleX, scaleY) * 0.9;
  const ox = (W - USA_W * sc) / 2;
  const oy = (H - USA_H * sc) / 2;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ display: "block" }}>
      <g transform={`translate(${ox},${oy}) scale(${sc})`}>
        {US_STATES.map(s => (
          <path key={s.id} d={s.path} fill={s.colour} stroke="#0f1b2d" strokeWidth="1.2" fillRule="evenodd" />
        ))}
      </g>
    </svg>
  );
}

function EuropeMini() {
  const W = 200, H = 172;
  const sc = Math.min(W / EU_W, H / EU_H) * 0.95;
  const ox = (W - EU_W * sc) / 2;
  const oy = (H - EU_H * sc) / 2;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ display: "block" }}>
      <g transform={`translate(${ox},${oy}) scale(${sc})`}>
        {EUROPE_CONTEXT.map((d, i) => <path key={i} d={d} fill="#16243a" />)}
        {EUROPE.map(c => (
          <path key={c.id} d={c.path} fill={c.colour} stroke="#0f1b2d" strokeWidth="1.2" fillRule="evenodd" />
        ))}
      </g>
    </svg>
  );
}

// ─── Map card ─────────────────────────────────────────────────────────────────
interface MapCardProps {
  href: string;
  flag: string;
  title: string;
  subtitle: string;
  count: number;
  unit: string;
  features: string[];
  preview: React.ReactNode;
  available: boolean;
}

function MapCard({ href, flag, title, subtitle, count, unit, features, preview, available }: MapCardProps) {
  return (
    <Link href={available ? href : "#"}>
      <div style={{
        background: "rgba(22,33,62,0.7)",
        border: "1px solid rgba(224,201,127,0.18)",
        borderRadius: 10,
        overflow: "hidden",
        cursor: available ? "pointer" : "default",
        transition: "border-color 0.2s, transform 0.2s, box-shadow 0.2s",
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
        display: "flex",
        flexDirection: "column",
        width: 300,
      }}
        onMouseEnter={e => {
          if (!available) return;
          const el = e.currentTarget as HTMLDivElement;
          el.style.borderColor = "rgba(224,201,127,0.5)";
          el.style.transform = "translateY(-4px)";
          el.style.boxShadow = "0 12px 40px rgba(0,0,0,0.6)";
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.borderColor = "rgba(224,201,127,0.18)";
          el.style.transform = "translateY(0)";
          el.style.boxShadow = "0 4px 24px rgba(0,0,0,0.4)";
        }}
      >
        {/* Preview area */}
        <div style={{
          background: "#0f1b2d",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "20px 16px 16px",
          borderBottom: "1px solid rgba(224,201,127,0.08)",
          minHeight: 180,
          position: "relative",
        }}>
          {preview}
          {!available && (
            <div style={{
              position: "absolute", inset: 0,
              background: "rgba(10,16,30,0.65)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{
                padding: "6px 18px", borderRadius: 20,
                background: "rgba(224,201,127,0.12)",
                border: "1px solid rgba(224,201,127,0.3)",
                color: "#e0c97f", fontSize: "0.75rem",
                letterSpacing: "0.1em", textTransform: "uppercase",
                fontFamily: "Inter, sans-serif",
              }}>Coming soon</span>
            </div>
          )}
        </div>

        {/* Info area */}
        <div style={{ padding: "16px 18px 18px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
            <div>
              <h2 style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "1.1rem", fontWeight: 700, color: "#e0c97f",
                margin: 0, lineHeight: 1.2,
              }}>
                <span style={{ marginRight: 7 }}>{flag}</span>{title}
              </h2>
              <p style={{ fontSize: "0.7rem", color: "#4a6080", margin: "3px 0 0", fontFamily: "Inter, sans-serif" }}>{subtitle}</p>
            </div>
            <div style={{
              textAlign: "right", flexShrink: 0, paddingLeft: 10,
            }}>
              <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#c8d8e8", fontFamily: "'Playfair Display', Georgia, serif", lineHeight: 1 }}>{count}</div>
              <div style={{ fontSize: "0.6rem", color: "#3a5070", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "Inter, sans-serif" }}>{unit}</div>
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 10 }}>
            {features.map(f => (
              <span key={f} style={{
                padding: "2px 9px", borderRadius: 10,
                background: "rgba(58,80,112,0.3)",
                border: "1px solid rgba(58,80,112,0.4)",
                fontSize: "0.62rem", color: "#6a8aaa",
                fontFamily: "Inter, sans-serif", whiteSpace: "nowrap",
              }}>{f}</span>
            ))}
          </div>

          {available && (
            <div style={{
              marginTop: 14,
              padding: "7px 0",
              borderTop: "1px solid rgba(224,201,127,0.1)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{ fontSize: "0.72rem", color: "#e0c97f", fontFamily: "Inter, sans-serif", fontWeight: 500 }}>
                Open jigsaw →
              </span>
              <span style={{ fontSize: "0.62rem", color: "#3a5070", fontFamily: "Inter, sans-serif" }}>
                Drag • Zoom • Quiz
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Landing page ─────────────────────────────────────────────────────────────
export default function Landing() {
  return (
    <div style={{
      flex: 1, background: "#0f1b2d",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "32px 20px", overflowY: "auto",
    }}>
      {/* Hero */}
      <div style={{ textAlign: "center", marginBottom: 40, maxWidth: 560 }}>
        <div style={{ fontSize: "2.8rem", marginBottom: 10, lineHeight: 1 }}>🗺️</div>
        <h1 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: "2.2rem", fontWeight: 700, color: "#e0c97f",
          margin: "0 0 10px", letterSpacing: "0.02em", lineHeight: 1.2,
        }}>Map Jigsaw</h1>
        <p style={{
          fontSize: "0.9rem", color: "#6a8aaa",
          fontFamily: "Inter, sans-serif", lineHeight: 1.6,
          margin: 0,
        }}>
          Interactive geographic jigsaws — drag boundary areas into position,
          explore statistics, and test your knowledge with quiz mode.
        </p>
      </div>

      {/* Cards */}
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center" }}>
        <MapCard
          href="/england"
          flag="🏴󠁧󠁢󠁥󠁮󠁧󠁿"
          title="England"
          subtitle="ONS 2023 boundary data"
          count={90}
          unit="areas"
          features={["Counties", "Unitary authorities", "Metropolitan areas", "Greater London", "Region colours", "Principal towns", "Quiz mode"]}
          preview={<EnglandMini />}
          available={true}
        />
        <MapCard
          href="/usa"
          flag="🇺🇸"
          title="United States"
          subtitle="US Census 2020 boundary data"
          count={51}
          unit="areas"
          features={["50 states + DC", "Region colours", "State capitals", "Population data", "Quiz mode"]}
          preview={<USAMini />}
          available={true}
        />
        <MapCard
          href="/europe"
          flag="🌍"
          title="Europe"
          subtitle="Natural Earth boundary data"
          count={EUROPE.length}
          unit="countries"
          features={["Every European country", "Region colours", "Capitals", "Population data", "Quiz mode"]}
          preview={<EuropeMini />}
          available={true}
        />
        <MapCard
          href="/coming-soon"
          flag="🏴󠁧󠁢󠁳󠁣󠁴󠁿"
          title="Scotland"
          subtitle="Council areas"
          count={32}
          unit="areas"
          features={["Council areas", "Region colours", "Quiz mode"]}
          preview={
            <div style={{ width: 160, height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "4rem", opacity: 0.3 }}>🏴󠁧󠁢󠁳󠁣󠁴󠁿</span>
            </div>
          }
          available={false}
        />
      </div>

      {/* Footer note */}
      <p style={{
        marginTop: 40, fontSize: "0.65rem", color: "#2a3a50",
        fontFamily: "Inter, sans-serif", textAlign: "center",
      }}>
        Boundary data: ONS Open Geography Portal · US Census Bureau TIGER 2020 · Natural Earth
      </p>
    </div>
  );
}
