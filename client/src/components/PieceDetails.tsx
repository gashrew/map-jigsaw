/**
 * Educational extras for a map piece: links, economy comparison and the
 * larger "More details" panel.
 */
import { useEffect } from "react";
import type { MapConfig, MapDetails, MapPiece, PieceDetails } from "@/lib/mapTypes";

const GOLD = "#e0c97f", MUTED = "#4a6080", TEXT = "#c8d8e8";

export function fmtPop(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2).replace(/\.?0+$/, "") + "m";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "k";
  return n.toLocaleString();
}
// GDP is held in millions
export function fmtGdp(millions: number, cur: string) {
  if (millions >= 1_000_000) return `${cur}${(millions / 1_000_000).toFixed(2)} trillion`;
  if (millions >= 1_000) return `${cur}${(millions / 1_000).toFixed(1)}bn`;
  return `${cur}${millions.toLocaleString()}m`;
}
export function vsNational(perCap: number, d: MapDetails) {
  const pct = Math.round((perCap / d.national.gdpPerCap - 1) * 100);
  return { pct, text: pct === 0 ? `same as ${d.national.label}` : `${Math.abs(pct)}% ${pct > 0 ? "above" : "below"} ${d.national.label}` };
}

const BBC = { label: "BBC News", url: (q: string) => `https://www.bbc.co.uk/search?q=${encodeURIComponent(q)}` };

// A piece's economic figures: its own, or its region's when the map only has regional figures
export function econOf(p: MapPiece, x: PieceDetails | undefined, d: MapDetails) {
  if (d.regional) {
    const r = d.regional[p.region];
    return r ? { gdp: r.gdp, gdpPerCap: r.gdpPerCap, scope: `${p.region} region` } : null;
  }
  return x && (x.gdp != null || x.gdpPerCap != null) ? { gdp: x.gdp, gdpPerCap: x.gdpPerCap, scope: "" } : null;
}

export function flagUrl(file: string, width = 160) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${width}`;
}

export function pieceLinks(p: MapPiece, x: PieceDetails, d: MapDetails) {
  const q = x.search ?? p.name;
  const yt = (words: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent([q, d.searchSuffix, words].filter(Boolean).join(" "))}`;
  return [
    { label: "Wikipedia", icon: "W", url: `https://en.wikipedia.org/wiki/${x.wiki}`, note: "Encyclopedia article" },
    ...(x.official ? [{ label: "Official site", icon: "🏛", url: x.official, note: "Government website" }] : []),
    { label: "YouTube: travel", icon: "▶", url: yt("travel guide"), note: "Travel guides and tours" },
    { label: "YouTube: history", icon: "▶", url: yt("history"), note: "History documentaries" },
    { label: (d.news ?? BBC).label, icon: "📰", url: (d.news ?? BBC).url(q), note: "Latest news" },
  ];
}

export function Flag({ file, height = 22 }: { file?: string; height?: number }) {
  if (!file) return null;
  return <img src={flagUrl(file, Math.round(height * 4))} alt="Flag" height={height}
    style={{ height, width: "auto", borderRadius: 2, boxShadow: "0 0 0 1px rgba(255,255,255,0.15)", flexShrink: 0 }}
    onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />;
}

export function LinkChips({ links }: { links: ReturnType<typeof pieceLinks> }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
      {links.map(l => (
        <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer" title={l.note}
          style={{
            fontSize: "0.68rem", color: TEXT, textDecoration: "none", padding: "2px 8px",
            border: "1px solid rgba(224,201,127,0.3)", borderRadius: 10, whiteSpace: "nowrap",
            background: l.icon === "▶" ? "rgba(200,40,40,0.18)" : "rgba(224,201,127,0.06)",
          }}>{l.icon === "▶" ? "▶ " : ""}{l.label}</a>
      ))}
    </div>
  );
}

// ─── Larger panel ─────────────────────────────────────────────────────────────
export function DetailsModal({ piece, cfg, onClose }: { piece: MapPiece; cfg: MapConfig; onClose: () => void }) {
  const d = cfg.details!;
  const x = d.pieces[piece.id];
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  if (!x) return null;
  const links = pieceLinks(piece, x, d);
  const density = piece.pop / piece.area_km2;
  const econ = econOf(piece, x, d);
  // GDP per head of every piece (or every region), for the comparison chart
  const ranked = (d.regional
    ? Object.entries(d.regional).map(([k, v]) => ({ id: k, label: k, v: v.gdpPerCap }))
    : cfg.pieces.map(p => ({ id: p.id, label: p.abbr, v: d.pieces[p.id]?.gdpPerCap as number })).filter(r => r.v)
  ).sort((a, b) => b.v - a.v);
  const meId = d.regional ? piece.region : piece.id;
  const max = Math.max(...ranked.map(r => r.v), d.national.gdpPerCap);
  const rank = ranked.findIndex(r => r.id === meId) + 1;
  const labelW = d.regional ? 150 : 22;

  return (
    <div onPointerDown={e => { if (e.target === e.currentTarget) onClose(); }} style={{
      position: "fixed", inset: 0, zIndex: 2000, background: "rgba(8,14,28,0.78)", backdropFilter: "blur(3px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 12,
      animation: "panelIn 0.2s cubic-bezier(0.23,1,0.32,1)",
    }}>
      <div role="dialog" aria-label={`${piece.name} details`} style={{
        width: "min(820px, 100%)", maxHeight: "100%", overflowY: "auto",
        background: "#101b32", border: "1px solid rgba(224,201,127,0.35)", borderRadius: 10,
        boxShadow: "0 16px 48px rgba(0,0,0,0.8)", fontFamily: "Inter, sans-serif", color: TEXT,
      }}>
        <div style={{ height: 5, background: piece.colour, borderRadius: "10px 10px 0 0" }} />
        {/* Title */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)", position: "sticky", top: 0, background: "#101b32", zIndex: 1 }}>
          <Flag file={x.flag} height={40} />
          <div style={{ flex: 1 }}>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.5rem", color: GOLD, margin: 0, lineHeight: 1.2 }}>{piece.name}</h2>
            <div style={{ fontSize: "0.7rem", color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>{[x.type ?? cfg.typeLabel, piece.abbr !== piece.name ? piece.abbr : null, piece.region].filter(Boolean).join(" · ")}</div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, color: TEXT, cursor: "pointer", fontSize: "1rem", width: 34, height: 34 }}>✕</button>
        </div>

        <div style={{ padding: "14px 20px 18px" }}>
          <p style={{ fontSize: "0.92rem", lineHeight: 1.6, margin: "0 0 18px", color: "#dde6f0" }}>{x.about}</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 18 }}>
            {/* At a glance */}
            <Section title="At a glance">
              <Fact label={cfg.capitalLabel} value={piece.capital} />
              {x.largestCity && !x.largestCity.startsWith(piece.capital) && <Fact label="Largest city" value={x.largestCity} />}
              <Fact label={cfg.popLabel} value={piece.pop.toLocaleString()} />
              <Fact label={cfg.areaLabel} value={piece.area_km2.toLocaleString() + " km²"} />
              <Fact label="People per km²" value={density < 1 ? density.toFixed(2) : density < 10 ? density.toFixed(1) : Math.round(density).toLocaleString()} />
              {x.identity?.map(f => <Fact key={f.label} label={f.label} value={f.value} />)}
            </Section>

            {/* Economy */}
            <Section title={`Economy (${d.gdpYear})`}>
              {econ?.scope && <div style={{ fontSize: "0.75rem", color: "#8899aa", marginBottom: 8 }}>Figures are for the whole {econ.scope}; they are not published for each area here.</div>}
              {econ?.gdp != null && <Fact label={econ.scope ? `GDP of the ${econ.scope}` : "GDP"} value={`${fmtGdp(econ.gdp, d.currency)} — ${((econ.gdp / d.national.gdp) * 100).toFixed(1)}% of ${d.national.totalLabel ?? d.national.label}`} />}
              {econ?.gdpPerCap != null && (
                <Fact label={econ.scope ? `GDP per person in the ${econ.scope}` : "GDP per person"} value={`${d.currency}${econ.gdpPerCap.toLocaleString()} — ${vsNational(econ.gdpPerCap, d).text} (${d.currency}${d.national.gdpPerCap.toLocaleString()})${rank ? `, ${ordinal(rank)} of ${ranked.length}` : ""}`} />
              )}
              {!econ && <div style={{ fontSize: "0.8rem", color: "#8899aa", marginBottom: 8 }}>No separate economic figures are published for {piece.name}.</div>}
              {d.econNote && <div style={{ fontSize: "0.7rem", color: "#8899aa", marginBottom: 8, fontStyle: "italic" }}>{d.econNote}</div>}
              {ranked.length > 1 && (
                <div style={{ margin: "4px 0 10px" }} aria-label="GDP per person compared">
                  {ranked.map(r => {
                    const me = r.id === meId;
                    return (
                      <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 6, height: 14, fontSize: "0.62rem" }}>
                        <span style={{ width: labelW, flexShrink: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: me ? GOLD : MUTED, fontWeight: me ? 700 : 400 }}>{r.label}</span>
                        <div style={{ flex: 1, position: "relative", height: 8 }}>
                          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${(r.v / max) * 100}%`, background: me ? GOLD : "rgba(106,138,170,0.45)", borderRadius: 2 }} />
                          <div style={{ position: "absolute", left: `${(d.national.gdpPerCap / max) * 100}%`, top: -3, bottom: -3, borderLeft: "1px dashed rgba(255,255,255,0.45)" }} />
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ fontSize: "0.62rem", color: MUTED, marginTop: 4 }}>Dashed line: {d.national.label} average</div>
                </div>
              )}
              {x.industries && (
                <>
                  <div style={labelStyle}>Main industries</div>
                  <ul style={{ margin: "2px 0 0", paddingLeft: 18, listStyle: "disc", fontSize: "0.82rem", lineHeight: 1.55 }}>
                    {x.industries.map(i => <li key={i}>{i}</li>)}
                  </ul>
                </>
              )}
            </Section>
          </div>

          {x.places && (
            <Section title="Places to know">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {x.places.map(pl => (
                  <a key={pl} href={`https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(pl + ", " + piece.name)}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: "0.78rem", color: TEXT, textDecoration: "none", padding: "3px 10px", borderRadius: 12, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>{pl}</a>
                ))}
              </div>
            </Section>
          )}

          <Section title="Watch and read">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>
              {links.map(l => (
                <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer" style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 6, textDecoration: "none",
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(224,201,127,0.22)", color: TEXT,
                }}>
                  <span style={{ width: 26, height: 26, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    background: l.icon === "▶" ? "#c4302b" : "rgba(224,201,127,0.15)", color: l.icon === "▶" ? "white" : GOLD, fontSize: "0.8rem", fontWeight: 700, fontFamily: l.icon === "W" ? "Georgia, serif" : undefined }}>{l.icon}</span>
                  <span>
                    <span style={{ display: "block", fontSize: "0.8rem" }}>{l.label}</span>
                    <span style={{ display: "block", fontSize: "0.65rem", color: MUTED }}>{l.note}</span>
                  </span>
                </a>
              ))}
            </div>
          </Section>

          <div style={{ fontSize: "0.62rem", color: MUTED, marginTop: 14, lineHeight: 1.5 }}>
            Economic figures: {d.gdpSource}. Population: {cfg.popLabel.replace(/^Population ?/, "").replace(/[()]/g, "") || "latest estimate"}.
          </div>
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { fontSize: "0.62rem", color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 1 };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 6 }}>
      <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "0.95rem", color: GOLD, margin: "0 0 8px", paddingBottom: 4, borderBottom: "1px solid rgba(224,201,127,0.15)" }}>{title}</h3>
      {children}
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={labelStyle}>{label}</div>
      <div style={{ fontSize: "0.85rem", lineHeight: 1.4 }}>{value}</div>
    </div>
  );
}

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
