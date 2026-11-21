/**
 * NavBar — Dark Atlas design
 * Shared top navigation: the brand (back to the front page) and a "Maps" menu,
 * grouped by part of the world, so it stays tidy however many maps there are.
 */

import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";

interface MapEntry { path: string; label: string; flag: string; subtitle: string; }

export const MAP_GROUPS: { title: string; maps: MapEntry[] }[] = [
  { title: "Britain", maps: [
    { path: "/england", label: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", subtitle: "90 areas" },
  ] },
  { title: "Americas", maps: [
    { path: "/usa", label: "USA", flag: "🇺🇸", subtitle: "51 states" },
    { path: "/canada", label: "Canada", flag: "🇨🇦", subtitle: "13 provinces and territories" },
    { path: "/central-america", label: "Mexico & Central America", flag: "🌎", subtitle: "8 countries" },
    { path: "/caribbean", label: "Caribbean", flag: "🌎", subtitle: "14 pieces" },
    { path: "/south-america", label: "South America", flag: "🌎", subtitle: "14 pieces" },
  ] },
  { title: "Europe and the Middle East", maps: [
    { path: "/europe", label: "Europe", flag: "🌍", subtitle: "47 countries" },
    { path: "/middle-east", label: "Middle East", flag: "🌍", subtitle: "17 countries" },
  ] },
  { title: "Asia", maps: [
    { path: "/east-asia", label: "East Asia", flag: "🌏", subtitle: "6 pieces" },
    { path: "/south-central-asia", label: "South & Central Asia", flag: "🌏", subtitle: "13 countries" },
    { path: "/southeast-asia", label: "Southeast Asia", flag: "🌏", subtitle: "11 countries" },
    { path: "/india", label: "India", flag: "🇮🇳", subtitle: "36 states and territories" },
  ] },
  { title: "Africa", maps: [
    { path: "/north-africa", label: "North Africa", flag: "🌍", subtitle: "7 pieces" },
    { path: "/west-africa", label: "West Africa", flag: "🌍", subtitle: "16 countries" },
    { path: "/central-east-africa", label: "Central & East Africa", flag: "🌍", subtitle: "19 countries" },
    { path: "/southern-africa", label: "Southern Africa", flag: "🌍", subtitle: "13 countries" },
  ] },
  { title: "Australasia", maps: [
    { path: "/australia", label: "Australia", flag: "🇦🇺", subtitle: "8 states and territories" },
    { path: "/new-zealand", label: "New Zealand", flag: "🇳🇿", subtitle: "16 regions" },
  ] },
];

const GOLD = "#e0c97f";

export function NavBar() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const all = MAP_GROUPS.flatMap(g => g.maps);
  const current = all.find(m => location === m.path || location.startsWith(m.path + "/"));

  useEffect(() => { setOpen(false); }, [location]);
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", esc);
    return () => { window.removeEventListener("pointerdown", close); window.removeEventListener("keydown", esc); };
  }, [open]);

  return (
    <nav style={{
      background: "#0d1829", borderBottom: "1px solid rgba(224,201,127,0.12)", padding: "0 14px",
      display: "flex", alignItems: "center", gap: 12, flexShrink: 0, height: 36, zIndex: 1000, position: "relative",
    }}>
      <Link href="/">
        <span title="All maps" style={{
          fontFamily: "'Playfair Display', Georgia, serif", fontSize: "0.72rem", color: "rgba(224,201,127,0.6)",
          letterSpacing: "0.12em", textTransform: "uppercase", whiteSpace: "nowrap", cursor: "pointer",
        }}>Map Jigsaw</span>
      </Link>
      <div style={{ width: 1, height: 16, background: "rgba(58,80,112,0.6)" }} />

      <div ref={ref} style={{ position: "relative" }}>
        <button onClick={() => setOpen(o => !o)} aria-expanded={open} aria-haspopup="menu" style={{
          display: "flex", alignItems: "center", gap: 7, height: 28, padding: "0 10px", borderRadius: 5, cursor: "pointer",
          background: open ? "rgba(224,201,127,0.12)" : "transparent", border: "1px solid rgba(224,201,127,0.3)",
          color: GOLD, fontFamily: "Inter, sans-serif", fontSize: "0.78rem", fontWeight: 600,
        }}>
          {current ? <><span style={{ fontSize: "0.95rem" }}>{current.flag}</span>{current.label}</> : "Choose a map"}
          <span style={{ fontSize: "0.6rem", opacity: 0.8, marginLeft: 2 }}>{open ? "▲" : "▼"}</span>
        </button>

        {open && (
          <div role="menu" style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0, width: "min(560px, calc(100vw - 28px))",
            background: "rgba(16,27,50,0.99)", border: "1px solid rgba(224,201,127,0.3)", borderRadius: 8,
            boxShadow: "0 12px 40px rgba(0,0,0,0.75)", padding: "10px 12px",
            display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "6px 16px",
            maxHeight: "calc(100vh - 60px)", overflowY: "auto",
          }}>
            {MAP_GROUPS.map(g => (
              <div key={g.title}>
                <div style={{ fontSize: "0.6rem", color: "#6a80a0", textTransform: "uppercase", letterSpacing: "0.1em", margin: "4px 4px 4px", fontFamily: "Inter, sans-serif" }}>{g.title}</div>
                {g.maps.map(m => {
                  const active = current?.path === m.path;
                  return (
                    <Link key={m.path} href={m.path}>
                      <div role="menuitem" style={{
                        display: "flex", alignItems: "center", gap: 9, padding: "6px 8px", borderRadius: 5, cursor: "pointer",
                        background: active ? "rgba(224,201,127,0.12)" : "transparent", fontFamily: "Inter, sans-serif",
                      }}
                        onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                        onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}>
                        <span style={{ fontSize: "1.05rem", lineHeight: 1 }}>{m.flag}</span>
                        <span>
                          <span style={{ display: "block", fontSize: "0.8rem", color: active ? GOLD : "#c8d8e8", fontWeight: active ? 600 : 400 }}>{m.label}</span>
                          <span style={{ display: "block", fontSize: "0.62rem", color: "#4a6080" }}>{m.subtitle}</span>
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ flex: 1 }} />
    </nav>
  );
}
