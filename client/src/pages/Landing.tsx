/**
 * Landing page — Map Jigsaw
 * Dark Atlas design: deep navy, gold accents, Playfair Display titles.
 * Shows a card for each available jigsaw map with a mini SVG preview.
 */

import { US_STATES, SVG_WIDTH as USA_W, SVG_HEIGHT as USA_H } from "@/lib/usStatesData";
import { COUNTIES, SVG_WIDTH as ENG_W, SVG_HEIGHT as ENG_H } from "@/lib/countiesData";
import { EUROPE, EUROPE_CONTEXT, SVG_WIDTH as EU_W, SVG_HEIGHT as EU_H } from "@/lib/europeData";
import { SOUTH_AMERICA, SOUTH_AMERICA_CONTEXT, SVG_WIDTH as SA_W, SVG_HEIGHT as SA_H } from "@/lib/southAmericaData";
import { CANADA, CANADA_CONTEXT, SVG_WIDTH as CA_W, SVG_HEIGHT as CA_H } from "@/lib/canadaData";
import { MIDDLE_EAST, MIDDLE_EAST_CONTEXT, SVG_WIDTH as ME_W, SVG_HEIGHT as ME_H } from "@/lib/middleEastData";
import { EAST_ASIA, EAST_ASIA_CONTEXT, SVG_WIDTH as EAST_ASIA_W, SVG_HEIGHT as EAST_ASIA_H } from "@/lib/eastAsiaData";
import { SOUTH_CENTRAL_ASIA, SOUTH_CENTRAL_ASIA_CONTEXT, SVG_WIDTH as SOUTH_CENTRAL_ASIA_W, SVG_HEIGHT as SOUTH_CENTRAL_ASIA_H } from "@/lib/southCentralAsiaData";
import { SOUTHEAST_ASIA, SOUTHEAST_ASIA_CONTEXT, SVG_WIDTH as SOUTHEAST_ASIA_W, SVG_HEIGHT as SOUTHEAST_ASIA_H } from "@/lib/southeastAsiaData";
import { INDIA, INDIA_CONTEXT, SVG_WIDTH as IN_W, SVG_HEIGHT as IN_H } from "@/lib/indiaData";
import { AUSTRALIA, AUSTRALIA_CONTEXT, SVG_WIDTH as AUSTRALIA_W, SVG_HEIGHT as AUSTRALIA_H } from "@/lib/australiaData";
import { NEW_ZEALAND, NEW_ZEALAND_CONTEXT, SVG_WIDTH as NEW_ZEALAND_W, SVG_HEIGHT as NEW_ZEALAND_H } from "@/lib/newZealandData";
import { NORTH_AFRICA, NORTH_AFRICA_CONTEXT, SVG_WIDTH as NORTH_AFRICA_W, SVG_HEIGHT as NORTH_AFRICA_H } from "@/lib/northAfricaData";
import { WEST_AFRICA, WEST_AFRICA_CONTEXT, SVG_WIDTH as WEST_AFRICA_W, SVG_HEIGHT as WEST_AFRICA_H } from "@/lib/westAfricaData";
import { CENTRAL_EAST_AFRICA, CENTRAL_EAST_AFRICA_CONTEXT, SVG_WIDTH as CENTRAL_EAST_AFRICA_W, SVG_HEIGHT as CENTRAL_EAST_AFRICA_H } from "@/lib/centralEastAfricaData";
import { SOUTHERN_AFRICA, SOUTHERN_AFRICA_CONTEXT, SVG_WIDTH as SOUTHERN_AFRICA_W, SVG_HEIGHT as SOUTHERN_AFRICA_H } from "@/lib/southernAfricaData";
import { CENTRAL_AMERICA, CENTRAL_AMERICA_CONTEXT, SVG_WIDTH as CENTRAL_AMERICA_W, SVG_HEIGHT as CENTRAL_AMERICA_H } from "@/lib/centralAmericaData";
import { CARIBBEAN, CARIBBEAN_CONTEXT, SVG_WIDTH as CARIBBEAN_W, SVG_HEIGHT as CARIBBEAN_H } from "@/lib/caribbeanData";
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

function SouthAmericaMini() {
  const W = 160, H = 200;
  const sc = Math.min(W / SA_W, H / SA_H) * 0.92;
  const ox = (W - SA_W * sc) / 2;
  const oy = (H - SA_H * sc) / 2;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ display: "block" }}>
      <g transform={`translate(${ox},${oy}) scale(${sc})`}>
        {SOUTH_AMERICA_CONTEXT.map((d, i) => <path key={i} d={d} fill="#16243a" />)}
        {SOUTH_AMERICA.map(c => (
          <path key={c.id} d={c.path} fill={c.colour} stroke="#0f1b2d" strokeWidth="2" fillRule="evenodd" />
        ))}
      </g>
    </svg>
  );
}

function CanadaMini() {
  const W = 230, H = 200;
  const sc = Math.min(W / CA_W, H / CA_H) * 0.95;
  const ox = (W - CA_W * sc) / 2;
  const oy = (H - CA_H * sc) / 2;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ display: "block" }}>
      <g transform={`translate(${ox},${oy}) scale(${sc})`}>
        {CANADA_CONTEXT.map((d, i) => <path key={i} d={d} fill="#16243a" />)}
        {CANADA.map(c => (
          <path key={c.id} d={c.path} fill={c.colour} stroke="#0f1b2d" strokeWidth="1.5" fillRule="evenodd" />
        ))}
      </g>
    </svg>
  );
}

function MiddleEastMini() {
  const W = 210, H = 190;
  const sc = Math.min(W / ME_W, H / ME_H) * 0.95;
  const ox = (W - ME_W * sc) / 2;
  const oy = (H - ME_H * sc) / 2;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ display: "block" }}>
      <g transform={`translate(${ox},${oy}) scale(${sc})`}>
        {MIDDLE_EAST_CONTEXT.map((d, i) => <path key={i} d={d} fill="#16243a" />)}
        {MIDDLE_EAST.map(c => (
          <path key={c.id} d={c.path} fill={c.colour} stroke="#0f1b2d" strokeWidth="1.5" fillRule="evenodd" />
        ))}
      </g>
    </svg>
  );
}

function EastAsiaMini() {
  const W = 210, H = 190;
  const sc = Math.min(W / EAST_ASIA_W, H / EAST_ASIA_H) * 0.95;
  const ox = (W - EAST_ASIA_W * sc) / 2;
  const oy = (H - EAST_ASIA_H * sc) / 2;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ display: "block" }}>
      <g transform={`translate(${ox},${oy}) scale(${sc})`}>
        {EAST_ASIA_CONTEXT.map((d, i) => <path key={i} d={d} fill="#16243a" />)}
        {EAST_ASIA.map(c => (
          <path key={c.id} d={c.path} fill={c.colour} stroke="#0f1b2d" strokeWidth="1.5" fillRule="evenodd" />
        ))}
      </g>
    </svg>
  );
}

function SouthCentralAsiaMini() {
  const W = 210, H = 190;
  const sc = Math.min(W / SOUTH_CENTRAL_ASIA_W, H / SOUTH_CENTRAL_ASIA_H) * 0.95;
  const ox = (W - SOUTH_CENTRAL_ASIA_W * sc) / 2;
  const oy = (H - SOUTH_CENTRAL_ASIA_H * sc) / 2;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ display: "block" }}>
      <g transform={`translate(${ox},${oy}) scale(${sc})`}>
        {SOUTH_CENTRAL_ASIA_CONTEXT.map((d, i) => <path key={i} d={d} fill="#16243a" />)}
        {SOUTH_CENTRAL_ASIA.map(c => (
          <path key={c.id} d={c.path} fill={c.colour} stroke="#0f1b2d" strokeWidth="1.5" fillRule="evenodd" />
        ))}
      </g>
    </svg>
  );
}

function SoutheastAsiaMini() {
  const W = 210, H = 190;
  const sc = Math.min(W / SOUTHEAST_ASIA_W, H / SOUTHEAST_ASIA_H) * 0.95;
  const ox = (W - SOUTHEAST_ASIA_W * sc) / 2;
  const oy = (H - SOUTHEAST_ASIA_H * sc) / 2;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ display: "block" }}>
      <g transform={`translate(${ox},${oy}) scale(${sc})`}>
        {SOUTHEAST_ASIA_CONTEXT.map((d, i) => <path key={i} d={d} fill="#16243a" />)}
        {SOUTHEAST_ASIA.map(c => (
          <path key={c.id} d={c.path} fill={c.colour} stroke="#0f1b2d" strokeWidth="1.5" fillRule="evenodd" />
        ))}
      </g>
    </svg>
  );
}

function IndiaMini() {
  const W = 180, H = 200;
  const sc = Math.min(W / IN_W, H / IN_H) * 0.95;
  const ox = (W - IN_W * sc) / 2;
  const oy = (H - IN_H * sc) / 2;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ display: "block" }}>
      <g transform={`translate(${ox},${oy}) scale(${sc})`}>
        {INDIA_CONTEXT.map((d, i) => <path key={i} d={d} fill="#16243a" />)}
        {INDIA.map(c => (
          <path key={c.id} d={c.path} fill={c.colour} stroke="#0f1b2d" strokeWidth="1.5" fillRule="evenodd" />
        ))}
      </g>
    </svg>
  );
}

function AustraliaMini() {
  const W = 200, H = 190;
  const sc = Math.min(W / AUSTRALIA_W, H / AUSTRALIA_H) * 0.95;
  const ox = (W - AUSTRALIA_W * sc) / 2;
  const oy = (H - AUSTRALIA_H * sc) / 2;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ display: "block" }}>
      <g transform={`translate(${ox},${oy}) scale(${sc})`}>
        {AUSTRALIA_CONTEXT.map((d, i) => <path key={i} d={d} fill="#16243a" />)}
        {AUSTRALIA.map(c => (
          <path key={c.id} d={c.path} fill={c.colour} stroke="#0f1b2d" strokeWidth="2" fillRule="evenodd" />
        ))}
      </g>
    </svg>
  );
}

function NewZealandMini() {
  const W = 200, H = 190;
  const sc = Math.min(W / NEW_ZEALAND_W, H / NEW_ZEALAND_H) * 0.95;
  const ox = (W - NEW_ZEALAND_W * sc) / 2;
  const oy = (H - NEW_ZEALAND_H * sc) / 2;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ display: "block" }}>
      <g transform={`translate(${ox},${oy}) scale(${sc})`}>
        {NEW_ZEALAND_CONTEXT.map((d, i) => <path key={i} d={d} fill="#16243a" />)}
        {NEW_ZEALAND.map(c => (
          <path key={c.id} d={c.path} fill={c.colour} stroke="#0f1b2d" strokeWidth="2" fillRule="evenodd" />
        ))}
      </g>
    </svg>
  );
}

function NorthAfricaMini() {
  const W = 210, H = 190;
  const sc = Math.min(W / NORTH_AFRICA_W, H / NORTH_AFRICA_H) * 0.95;
  const ox = (W - NORTH_AFRICA_W * sc) / 2;
  const oy = (H - NORTH_AFRICA_H * sc) / 2;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ display: "block" }}>
      <g transform={`translate(${ox},${oy}) scale(${sc})`}>
        {NORTH_AFRICA_CONTEXT.map((d, i) => <path key={i} d={d} fill="#16243a" />)}
        {NORTH_AFRICA.map(c => (
          <path key={c.id} d={c.path} fill={c.colour} stroke="#0f1b2d" strokeWidth="1.5" fillRule="evenodd" />
        ))}
      </g>
    </svg>
  );
}

function WestAfricaMini() {
  const W = 210, H = 190;
  const sc = Math.min(W / WEST_AFRICA_W, H / WEST_AFRICA_H) * 0.95;
  const ox = (W - WEST_AFRICA_W * sc) / 2;
  const oy = (H - WEST_AFRICA_H * sc) / 2;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ display: "block" }}>
      <g transform={`translate(${ox},${oy}) scale(${sc})`}>
        {WEST_AFRICA_CONTEXT.map((d, i) => <path key={i} d={d} fill="#16243a" />)}
        {WEST_AFRICA.map(c => (
          <path key={c.id} d={c.path} fill={c.colour} stroke="#0f1b2d" strokeWidth="1.5" fillRule="evenodd" />
        ))}
      </g>
    </svg>
  );
}

function CentralEastAfricaMini() {
  const W = 210, H = 190;
  const sc = Math.min(W / CENTRAL_EAST_AFRICA_W, H / CENTRAL_EAST_AFRICA_H) * 0.95;
  const ox = (W - CENTRAL_EAST_AFRICA_W * sc) / 2;
  const oy = (H - CENTRAL_EAST_AFRICA_H * sc) / 2;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ display: "block" }}>
      <g transform={`translate(${ox},${oy}) scale(${sc})`}>
        {CENTRAL_EAST_AFRICA_CONTEXT.map((d, i) => <path key={i} d={d} fill="#16243a" />)}
        {CENTRAL_EAST_AFRICA.map(c => (
          <path key={c.id} d={c.path} fill={c.colour} stroke="#0f1b2d" strokeWidth="1.5" fillRule="evenodd" />
        ))}
      </g>
    </svg>
  );
}

function SouthernAfricaMini() {
  const W = 210, H = 190;
  const sc = Math.min(W / SOUTHERN_AFRICA_W, H / SOUTHERN_AFRICA_H) * 0.95;
  const ox = (W - SOUTHERN_AFRICA_W * sc) / 2;
  const oy = (H - SOUTHERN_AFRICA_H * sc) / 2;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ display: "block" }}>
      <g transform={`translate(${ox},${oy}) scale(${sc})`}>
        {SOUTHERN_AFRICA_CONTEXT.map((d, i) => <path key={i} d={d} fill="#16243a" />)}
        {SOUTHERN_AFRICA.map(c => (
          <path key={c.id} d={c.path} fill={c.colour} stroke="#0f1b2d" strokeWidth="1.5" fillRule="evenodd" />
        ))}
      </g>
    </svg>
  );
}

function CentralAmericaMini() {
  const W = 210, H = 190;
  const sc = Math.min(W / CENTRAL_AMERICA_W, H / CENTRAL_AMERICA_H) * 0.95;
  const ox = (W - CENTRAL_AMERICA_W * sc) / 2;
  const oy = (H - CENTRAL_AMERICA_H * sc) / 2;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ display: "block" }}>
      <g transform={`translate(${ox},${oy}) scale(${sc})`}>
        {CENTRAL_AMERICA_CONTEXT.map((d, i) => <path key={i} d={d} fill="#16243a" />)}
        {CENTRAL_AMERICA.map(c => (
          <path key={c.id} d={c.path} fill={c.colour} stroke="#0f1b2d" strokeWidth="1.5" fillRule="evenodd" />
        ))}
      </g>
    </svg>
  );
}

function CaribbeanMini() {
  const W = 210, H = 190;
  const sc = Math.min(W / CARIBBEAN_W, H / CARIBBEAN_H) * 0.95;
  const ox = (W - CARIBBEAN_W * sc) / 2;
  const oy = (H - CARIBBEAN_H * sc) / 2;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ display: "block" }}>
      <g transform={`translate(${ox},${oy}) scale(${sc})`}>
        {CARIBBEAN_CONTEXT.map((d, i) => <path key={i} d={d} fill="#16243a" />)}
        {CARIBBEAN.map(c => (
          <path key={c.id} d={c.path} fill={c.colour} stroke="#0f1b2d" strokeWidth="1.5" fillRule="evenodd" />
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
          href="/south-america"
          flag="🌎"
          title="South America"
          subtitle="Natural Earth boundary data"
          count={SOUTH_AMERICA.length}
          unit="pieces"
          features={["12 countries", "French Guiana & Falklands", "Region colours", "Capitals", "Quiz mode"]}
          preview={<SouthAmericaMini />}
          available={true}
        />
        <MapCard
          href="/canada"
          flag="🇨🇦"
          title="Canada"
          subtitle="Natural Earth boundary data"
          count={CANADA.length}
          unit="areas"
          features={["10 provinces + 3 territories", "Region colours", "Capitals", "2021 census population", "Quiz mode"]}
          preview={<CanadaMini />}
          available={true}
        />
        <MapCard
          href="/middle-east"
          flag="🌍"
          title="Middle East"
          subtitle="Natural Earth boundary data"
          count={MIDDLE_EAST.length}
          unit="countries"
          features={["From Egypt to Iran", "Region colours", "Capitals", "Facts and economy", "Quiz mode"]}
          preview={<MiddleEastMini />}
          available={true}
        />
        <MapCard
          href="/east-asia"
          flag="🌏"
          title="East Asia"
          subtitle="Natural Earth boundary data"
          count={EAST_ASIA.length}
          unit="pieces"
          features={["Region colours", "Capitals", "Facts and economy", "Quiz mode"]}
          preview={<EastAsiaMini />}
          available={true}
        />
        <MapCard
          href="/south-central-asia"
          flag="🌏"
          title="South & Central Asia"
          subtitle="Natural Earth boundary data"
          count={SOUTH_CENTRAL_ASIA.length}
          unit="countries"
          features={["Region colours", "Capitals", "Facts and economy", "Quiz mode"]}
          preview={<SouthCentralAsiaMini />}
          available={true}
        />
        <MapCard
          href="/southeast-asia"
          flag="🌏"
          title="Southeast Asia"
          subtitle="Natural Earth boundary data"
          count={SOUTHEAST_ASIA.length}
          unit="countries"
          features={["Region colours", "Capitals", "Facts and economy", "Quiz mode"]}
          preview={<SoutheastAsiaMini />}
          available={true}
        />
        <MapCard
          href="/india"
          flag="🇮🇳"
          title="India"
          subtitle="Natural Earth boundary data"
          count={INDIA.length}
          unit="states and territories"
          features={["28 states + 8 union territories", "Region colours", "Capitals", "State GDP (MoSPI)", "Quiz mode"]}
          preview={<IndiaMini />}
          available={true}
        />
        <MapCard
          href="/australia"
          flag="🇦🇺"
          title="Australia"
          subtitle="Natural Earth boundary data"
          count={AUSTRALIA.length}
          unit="states and territories"
          features={["6 states + 2 territories", "Capitals", "ABS state GDP", "Quiz mode"]}
          preview={<AustraliaMini />}
          available={true}
        />
        <MapCard
          href="/new-zealand"
          flag="🇳🇿"
          title="New Zealand"
          subtitle="Natural Earth boundary data"
          count={NEW_ZEALAND.length}
          unit="regions"
          features={["16 regions", "Māori names", "Stats NZ regional GDP", "Quiz mode"]}
          preview={<NewZealandMini />}
          available={true}
        />
        <MapCard
          href="/north-africa"
          flag="🌍"
          title="North Africa"
          subtitle="Natural Earth boundary data"
          count={NORTH_AFRICA.length}
          unit="pieces"
          features={["Morocco to Sudan", "Western Sahara", "Capitals", "Facts and economy"]}
          preview={<NorthAfricaMini />}
          available={true}
        />
        <MapCard
          href="/west-africa"
          flag="🌍"
          title="West Africa"
          subtitle="Natural Earth boundary data"
          count={WEST_AFRICA.length}
          unit="countries"
          features={["Mauritania to Nigeria", "Cabo Verde", "Capitals", "Facts and economy"]}
          preview={<WestAfricaMini />}
          available={true}
        />
        <MapCard
          href="/central-east-africa"
          flag="🌍"
          title="Central & East Africa"
          subtitle="Natural Earth boundary data"
          count={CENTRAL_EAST_AFRICA.length}
          unit="countries"
          features={["Chad to Tanzania", "Horn of Africa", "Capitals", "Facts and economy"]}
          preview={<CentralEastAfricaMini />}
          available={true}
        />
        <MapCard
          href="/southern-africa"
          flag="🌍"
          title="Southern Africa"
          subtitle="Natural Earth boundary data"
          count={SOUTHERN_AFRICA.length}
          unit="countries"
          features={["South Africa to Zambia", "Madagascar and islands", "Capitals", "Facts and economy"]}
          preview={<SouthernAfricaMini />}
          available={true}
        />
        <MapCard
          href="/central-america"
          flag="🌎"
          title="Mexico & Central America"
          subtitle="Natural Earth boundary data"
          count={CENTRAL_AMERICA.length}
          unit="countries"
          features={["Mexico to Panama", "Capitals", "Facts and economy", "Quiz mode"]}
          preview={<CentralAmericaMini />}
          available={true}
        />
        <MapCard
          href="/caribbean"
          flag="🌎"
          title="Caribbean"
          subtitle="Natural Earth boundary data"
          count={CARIBBEAN.length}
          unit="pieces"
          features={["Cuba to Trinidad", "Puerto Rico", "Capitals", "Facts and economy"]}
          preview={<CaribbeanMini />}
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
