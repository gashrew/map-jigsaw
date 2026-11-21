/**
 * Home — Dark Atlas design
 * Full-viewport interactive jigsaw of English boundary areas.
 *
 * Features:
 * - Zoom (mouse wheel / pinch) + pan (drag empty canvas)
 * - Scatter constrained to canvas bounds
 * - Principal town/city markers (toggleable)
 * - Info panel on click
 * - Boundary area terminology throughout
 */

import { AREA_INFO } from "@/lib/areaInfo";
import { AREA_STATS } from "@/lib/areaStats";
import { COUNTIES as RAW_AREAS, SVG_HEIGHT, SVG_WIDTH } from "@/lib/countiesData";
import { SMALL_PIECE, bySizeDescending, fitView, pathBBox, pinchInfo, pinchView, type ViewState as TouchView } from "@/lib/touch";
import { pathArea } from "@/lib/touch";
import PieceDeck, { type DeckItem, TINY_PX, RING_PX } from "@/components/PieceDeck";
const isTouch = typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches;
import { TextSizeButton, useTextSizes } from "@/components/TextSizes";
import { useGhostClickGuard } from "@/components/useGhostClickGuard";
import { DetailsModal, LinkChips, econOf, fmtGdp, pieceLinks, vsNational } from "@/components/PieceDetails";
import { ENGLAND_DETAILS_BASE, ENGLAND_DETAILS_BY_NAME } from "@/lib/englandDetails";
import type { MapConfig, MapPiece } from "@/lib/mapTypes";

// England as a general map definition, so it can share the information panels with the other maps
const ENGLAND_PIECES: MapPiece[] = RAW_AREAS.map(a => ({
  id: a.id, name: a.name, abbr: a.name, path: "", cx: a.cx, cy: a.cy, colour: a.colour,
  capital: AREA_INFO[a.name]?.town ?? "", region: AREA_INFO[a.name]?.region ?? "",
  pop: AREA_STATS[a.name]?.pop ?? 0, area_km2: AREA_STATS[a.name]?.area_km2 ?? 1,
}));
const ENGLAND_CFG: MapConfig = {
  key: "england", flag: "", title: "England", subtitle: "", noun: "area", typeLabel: "Area",
  capitalLabel: "Principal town", popLabel: "Population (2021 census)", areaLabel: "Land area",
  pieces: ENGLAND_PIECES, width: SVG_WIDTH, height: SVG_HEIGHT, regionColours: {}, labelAreaRange: [1, 1],
  details: {
    ...ENGLAND_DETAILS_BASE,
    pieces: Object.fromEntries(RAW_AREAS.filter(a => ENGLAND_DETAILS_BY_NAME[a.name]).map(a => [a.id, {
      ...ENGLAND_DETAILS_BY_NAME[a.name], type: AREA_INFO[a.name]?.type,
    }])),
  },
};
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PieceState { tx: number; ty: number; }
interface ViewState  { x: number; y: number; scale: number; }

// Quiz state
interface QuizState {
  active: boolean;
  placed: Set<string>;   // ids correctly placed
  wrong:  Set<string>;   // ids placed in wrong position (flash)
  startTime: number;
  endTime: number | null;
}

// ─── Region colours ───────────────────────────────────────────────────────────
// Nine English regions, each with a distinct, carefully chosen hue that reads
// well against the dark navy canvas.
export const REGION_COLOURS: Record<string, string> = {
  "North East":                  "#5b9bd5",  // steel blue
  "North West":                  "#4db8a0",  // teal
  "Yorkshire and The Humber":    "#e07b54",  // terracotta
  "East Midlands":               "#c97db0",  // mauve
  "West Midlands":               "#d4a843",  // amber
  "East of England":             "#7ab86a",  // sage green
  "London":                      "#e05c6e",  // rose
  "South East":                  "#8a7ecf",  // lavender
  "South West":                  "#5fb8d4",  // sky
};

// ─── Region Legend ────────────────────────────────────────────────────────────

function RegionLegend() {
  return (
    <div style={{
      position: "absolute", bottom: 50, left: 12, zIndex: 400,
      background: "rgba(16,27,50,0.93)",
      border: "1px solid rgba(224,201,127,0.2)",
      borderRadius: 6, padding: "8px 12px",
      boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
      animation: "panelIn 0.18s cubic-bezier(0.23,1,0.32,1)",
    }}>
      <div style={{
        fontSize: "0.62rem", color: "#4a6080",
        textTransform: "uppercase", letterSpacing: "0.08em",
        marginBottom: 6, fontFamily: "Inter, sans-serif",
      }}>Region</div>
      {Object.entries(REGION_COLOURS).map(([region, colour]) => (
        <div key={region} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
          <div style={{ width: 12, height: 12, borderRadius: 2, background: colour, flexShrink: 0 }} />
          <span style={{ fontSize: "0.72rem", color: "#c8d8e8", fontFamily: "Inter, sans-serif", whiteSpace: "nowrap" }}>
            {region}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Compass Rose ─────────────────────────────────────────────────────────────

function CompassRose() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="11" cy="11" r="10" stroke="#e0c97f" strokeWidth="0.8" opacity="0.4"/>
      <polygon points="11,2 12.2,10 11,9 9.8,10" fill="#e0c97f"/>
      <polygon points="11,20 12.2,12 11,13 9.8,12" fill="#e0c97f" opacity="0.5"/>
      <polygon points="2,11 10,9.8 9,11 10,12.2" fill="#e0c97f" opacity="0.5"/>
      <polygon points="20,11 12,9.8 13,11 12,12.2" fill="#e0c97f" opacity="0.5"/>
      <circle cx="11" cy="11" r="1.5" fill="#e0c97f"/>
      <text x="11" y="5.5" textAnchor="middle" fontSize="3.5" fill="#e0c97f" fontFamily="Georgia,serif" fontWeight="bold">N</text>
    </svg>
  );
}

// ─── Info Panel ───────────────────────────────────────────────────────────────

function InfoPanel({ id, onClose, onMore }: { id: string; onClose: () => void; onMore: () => void }) {
  const guard = useGhostClickGuard(id);
  const area = RAW_AREAS.find(a => a.id === id);
  if (!area) return null;
  const info  = AREA_INFO[area.name];
  const stats = AREA_STATS[area.name];

  function fmtPop(n: number) {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(2).replace(/\.?0+$/, "") + "m";
    if (n >= 1_000)     return (n / 1_000).toFixed(0) + ",000";
    return n.toLocaleString();
  }

  return (
    <div data-panel onClickCapture={guard} onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()} style={{
      position: "absolute", top: 60, right: 12, width: 280, zIndex: 500,
      maxHeight: "calc(100% - 110px)", overflowY: "auto",
      background: "rgba(16,27,50,0.97)", border: "1px solid rgba(224,201,127,0.35)",
      borderRadius: 6, boxShadow: "0 8px 32px rgba(0,0,0,0.7)",
      fontFamily: "Inter, sans-serif",
      animation: "panelIn 0.18s cubic-bezier(0.23,1,0.32,1)",
    }}>
      {/* Colour bar */}
      <div style={{ height: 4, background: area.colour, borderRadius: "6px 6px 0 0" }} />
      {/* Header */}
      <div style={{ padding: "10px 12px 8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <h2 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "0.95rem", fontWeight: 700, color: "#e0c97f",
            margin: 0, lineHeight: 1.3, flex: 1, paddingRight: 8,
          }}>{area.name}</h2>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: "#4a6080",
            cursor: "pointer", fontSize: "1rem", lineHeight: 1, padding: 0, flexShrink: 0,
          }}>✕</button>
        </div>
        {info && (
          <span style={{
            display: "inline-block", marginTop: 4, padding: "1px 7px",
            borderRadius: 10, fontSize: "0.65rem", letterSpacing: "0.06em",
            background: "rgba(224,201,127,0.12)", color: "#a89050",
            textTransform: "uppercase",
          }}>{info.type}</span>
        )}
      </div>
      {/* Body */}
      {info && (
        <div style={{ padding: "10px 12px" }}>
          <Row label="Principal town" value={info.town} />
          <Row label="Region" value={info.region} />
          {stats && (
            <>
              <Row label="Population (2021)" value={fmtPop(stats.pop)} />
              <Row label="Land area" value={stats.area_km2.toLocaleString() + " km²"} />
            </>
          )}
          {(() => {
            const d = ENGLAND_CFG.details!, x = d.pieces[area.id], p = ENGLAND_PIECES.find(q => q.id === area.id)!;
            const e = econOf(p, x, d);
            return <>
              {e?.gdpPerCap != null && <Row label={`GDP per person, ${info.region} (${d.gdpYear})`} value={`£${e.gdpPerCap.toLocaleString()} — ${vsNational(e.gdpPerCap, d).text}`} />}
              {e?.gdp != null && <Row label={`Region's GDP (${d.gdpYear})`} value={fmtGdp(e.gdp, d.currency)} />}
              {x && (
                <div style={{ margin: "10px 0 8px" }}>
                  <LinkChips links={pieceLinks(p, x, d)} />
                  <button onClick={onMore} style={{
                    marginTop: 10, width: "100%", padding: "6px 0", borderRadius: 5, cursor: "pointer",
                    background: "#0f3460", color: "#e0c97f", border: "1px solid rgba(224,201,127,0.4)",
                    fontSize: "0.78rem", fontFamily: "Inter, sans-serif",
                  }}>More details…</button>
                </div>
              )}
            </>;
          })()}
          <Row label="ONS code" value={area.id} mono />
        </div>
      )}
    </div>
  );
}

// ─── Quiz Results Overlay ─────────────────────────────────────────────────────

function QuizResults({ placed, total, elapsed, onClose }: {
  placed: number; total: number; elapsed: number; onClose: () => void;
}) {
  const mins = Math.floor(elapsed / 60);
  const secs = Math.floor(elapsed % 60);
  const pct  = Math.round((placed / total) * 100);
  const grade = pct === 100 ? "Perfect!" : pct >= 80 ? "Excellent" : pct >= 60 ? "Good" : pct >= 40 ? "Fair" : "Keep practising";
  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 800,
      background: "rgba(10,18,35,0.88)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      animation: "panelIn 0.25s cubic-bezier(0.23,1,0.32,1)",
    }}>
      <div style={{
        background: "rgba(16,27,50,0.98)", border: "1px solid rgba(224,201,127,0.4)",
        borderRadius: 10, padding: "32px 40px", textAlign: "center",
        boxShadow: "0 16px 48px rgba(0,0,0,0.8)", minWidth: 300,
      }}>
        <div style={{ fontSize: "2.8rem", marginBottom: 4 }}>
          {pct === 100 ? "🏆" : pct >= 80 ? "🎉" : pct >= 60 ? "👍" : "📚"}
        </div>
        <h2 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: "1.5rem", color: "#e0c97f", margin: "0 0 4px",
        }}>{grade}</h2>
        <p style={{ color: "#4a6080", fontSize: "0.8rem", margin: "0 0 20px" }}>
          Quiz complete
        </p>
        <div style={{ display: "flex", gap: 24, justifyContent: "center", marginBottom: 24 }}>
          <Stat label="Placed" value={`${placed} / ${total}`} />
          <Stat label="Score" value={`${pct}%`} />
          <Stat label="Time" value={`${mins}:${secs.toString().padStart(2,"0")}`} />
        </div>
        <button onClick={onClose} style={{
          background: "#0f3460", color: "#e0c97f",
          border: "1px solid rgba(224,201,127,0.4)",
          padding: "8px 28px", borderRadius: 5, cursor: "pointer",
          fontSize: "0.85rem", fontFamily: "Inter, sans-serif",
        }}>Close</button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "#e0c97f", fontFamily: "'Playfair Display', Georgia, serif" }}>{value}</div>
      <div style={{ fontSize: "0.65rem", color: "#4a6080", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ marginBottom: 7 }}>
      <div style={{ fontSize: "0.62rem", color: "#4a6080", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 1 }}>{label}</div>
      <div style={{ fontSize: "0.82rem", color: "#c8d8e8", fontFamily: mono ? "monospace" : "inherit" }}>{value}</div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Home() {
  const areas   = RAW_AREAS;
  const svgW    = SVG_WIDTH;
  const svgH    = SVG_HEIGHT;

  // UI toggles
  const [showGhost,    setShowGhost]    = useState(true);
  const [showLabels,   setShowLabels]   = useState(true);
  const [showTowns,    setShowTowns]    = useState(false);
  const ts = useTextSizes("england");
  const [regionColour, setRegionColour] = useState(false);
  const [snapEnabled,  setSnapEnabled]  = useState(true);
  const [snapMsg,    setSnapMsg]    = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [tooltip,    setTooltip]    = useState<{ name: string; x: number; y: number } | null>(null);
  const [zOrder,     setZOrder]     = useState<string[]>(() => bySizeDescending(areas));
  const bboxes = useMemo(() => Object.fromEntries(areas.map(a => [a.id, pathBBox(a.path)])), [areas]);

  // "One at a time" quiz: pieces wait in a box beside the map and are dragged on
  const [deckOn, setDeckOn] = useState(false);
  const [deckPlaced, setDeckPlaced] = useState<Set<string>>(new Set());
  const [deckRun, setDeckRun] = useState(0);
  const [portrait, setPortrait] = useState(() => typeof window !== "undefined" && window.innerWidth < window.innerHeight);
  useEffect(() => {
    const f = () => setPortrait(window.innerWidth < window.innerHeight);
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);
  const deckItems = useMemo<DeckItem[]>(() => areas.map(a => ({
    id: a.id, name: a.name, path: a.path, colour: a.colour, bbox: bboxes[a.id],
    area: pathArea(a.path), region: AREA_INFO[a.name]?.region,
  })), [areas, bboxes]);
  const deckLabelsBefore = useRef(true);

  // Quiz
  const [quiz, setQuiz] = useState<QuizState>({
    active: false, placed: new Set(), wrong: new Set(), startTime: 0, endTime: null,
  });
  const [showResults, setShowResults] = useState(false);
  const quizTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [quizElapsed, setQuizElapsed] = useState(0);

  // Viewport (zoom + pan)
  const [view, setView] = useState<ViewState>({ x: 0, y: 0, scale: 1 });
  // With fixed-size text, text stays as big on screen as when the map is fitted, however far you zoom
  const [fitScale, setFitScale] = useState(1);
  const zf = ts.fixed ? fitScale / view.scale : 1;
  const nameK = ts.size("names") * zf, townK = ts.size("towns") * zf;
  const viewRef = useRef<ViewState>({ x: 0, y: 0, scale: 1 });

  // Refs
  const canvasRef    = useRef<HTMLDivElement>(null);
  const pieceStates  = useRef<Record<string, PieceState>>({});
  const pieceRefs    = useRef<Record<string, SVGGElement | null>>({});
  const dragging     = useRef<{ id: string; ox: number; oy: number } | null>(null);
  const panning      = useRef<{ ox: number; oy: number; vx: number; vy: number } | null>(null);
  const snapTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pinchRef     = useRef<{ dist: number; mx: number; my: number; view: TouchView } | null>(null);

  // Keep viewRef in sync
  useEffect(() => { viewRef.current = view; }, [view]);

  // ── Assembled offset (in world coords, not screen) ──────────────────────────
  const assembledOffset = useCallback((): PieceState => {
    const el = canvasRef.current;
    if (!el) return { tx: 0, ty: 0 };
    const { width: w, height: h } = el.getBoundingClientRect();
    const v = viewRef.current;
    // Centre of canvas in world coords
    const cx = (w / 2 - v.x) / v.scale;
    const cy = (h / 2 - v.y) / v.scale;
    return { tx: cx - svgW / 2, ty: cy - svgH / 2 };
  }, [svgW, svgH]);

  // ── Init ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const { width: w, height: h } = el.getBoundingClientRect();
    // Centre the map initially
    // The assembled map lives at world (0,0); the view fits it to the screen
    const initX = 0;
    const initY = 0;
    const initView = fitView(w, h, svgW, svgH);
    setFitScale(initView.scale);
    viewRef.current = initView;
    setView(initView);
    areas.forEach(a => { pieceStates.current[a.id] = { tx: initX, ty: initY }; });
    requestAnimationFrame(() => applyAllTransforms());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Ghost offset in screen coords ──────────────────────────────────────────
  const ghostScreenOffset = useCallback(() => {
    const el = canvasRef.current;
    if (!el) return { tx: 0, ty: 0 };
    const { width: w, height: h } = el.getBoundingClientRect();
    const v = viewRef.current;
    void w; void h;
    return { tx: v.x, ty: v.y };
  }, [svgW, svgH]);

  const [ghostOff, setGhostOff] = useState({ tx: 0, ty: 0 });
  useEffect(() => {
    setGhostOff(ghostScreenOffset());
    // Rotating an iPad or resizing the window refits the map; pieces keep their places
    let t: ReturnType<typeof setTimeout> | undefined;
    const update = () => { clearTimeout(t); t = setTimeout(() => resetView(), 150); };
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [ghostScreenOffset]);

  // ── Transform helpers ───────────────────────────────────────────────────────
  function applyAllTransforms() {
    const v = viewRef.current;
    Object.entries(pieceStates.current).forEach(([id, s]) => {
      const el = pieceRefs.current[id];
      if (el) {
        const sx = s.tx * v.scale + v.x;
        const sy = s.ty * v.scale + v.y;
        el.setAttribute("transform", `translate(${sx.toFixed(1)},${sy.toFixed(1)}) scale(${v.scale.toFixed(4)})`);
      }
    });
  }

  function applyTransform(id: string) {
    const el = pieceRefs.current[id];
    const s  = pieceStates.current[id];
    const v  = viewRef.current;
    if (el && s) {
      const sx = s.tx * v.scale + v.x;
      const sy = s.ty * v.scale + v.y;
      el.setAttribute("transform", `translate(${sx.toFixed(1)},${sy.toFixed(1)}) scale(${v.scale.toFixed(4)})`);
    }
  }

  function animatePiece(id: string, tx: number, ty: number, delay = 0) {
    pieceStates.current[id] = { tx, ty };
    setTimeout(() => {
      const e = pieceRefs.current[id];
      if (!e) return;
      const v = viewRef.current;
      const sx = tx * v.scale + v.x;
      const sy = ty * v.scale + v.y;
      e.style.transition = "transform 0.5s cubic-bezier(0.25,0.8,0.25,1)";
      e.setAttribute("transform", `translate(${sx.toFixed(1)},${sy.toFixed(1)}) scale(${v.scale.toFixed(4)})`);
      setTimeout(() => { e.style.transition = ""; }, 560);
    }, delay);
  }

  // ── Scatter (constrained to canvas bounds) ──────────────────────────────────
  function scatter() {
    const el = canvasRef.current;
    if (!el) return;
    const { width: w, height: h } = el.getBoundingClientRect();
    const v = viewRef.current;
    const margin = 40;
    // Convert canvas screen bounds to world coords
    const worldMinX = (margin - v.x) / v.scale;
    const worldMaxX = (w - margin - v.x) / v.scale;
    const worldMinY = (margin - v.y) / v.scale;
    const worldMaxY = (h - margin - v.y) / v.scale;
    // Place each piece so its own outline stays inside the visible canvas
    areas.forEach((a, i) => {
      const b = bboxes[a.id];
      const loX = worldMinX + b.w / 2, hiX = worldMaxX - b.w / 2;
      const loY = worldMinY + b.h / 2, hiY = worldMaxY - b.h / 2;
      const cx = hiX > loX ? loX + Math.random() * (hiX - loX) : (worldMinX + worldMaxX) / 2;
      const cy = hiY > loY ? loY + Math.random() * (hiY - loY) : (worldMinY + worldMaxY) / 2;
      animatePiece(a.id, cx - b.cx, cy - b.cy, i * 8);
    });
  }

  // ── Assemble ────────────────────────────────────────────────────────────────
  function assemble() {
    const el = canvasRef.current;
    if (!el) return;
    areas.forEach((a, i) => animatePiece(a.id, 0, 0, i * 12));
  }

  // ── Quiz ────────────────────────────────────────────────────────────────────
  function startQuiz() {
    // Scatter all pieces, hide labels, enable snap, start timer
    setShowLabels(false);
    setShowTowns(false);
    setSnapEnabled(true);
    setSelectedId(null);
    setShowResults(false);
    const now = Date.now();
    setQuiz({ active: true, placed: new Set(), wrong: new Set(), startTime: now, endTime: null });
    setQuizElapsed(0);
    if (quizTimerRef.current) clearInterval(quizTimerRef.current);
    quizTimerRef.current = setInterval(() => {
      setQuizElapsed(e => e + 1);
    }, 1000);
    // Scatter after a brief delay
    setTimeout(() => scatter(), 100);
  }

  function endQuiz() {
    if (quizTimerRef.current) { clearInterval(quizTimerRef.current); quizTimerRef.current = null; }
    setQuiz(q => ({ ...q, active: false, endTime: Date.now() }));
    setShowLabels(true);
    setShowResults(true);
  }

  function startDeck() {
    deckLabelsBefore.current = showLabels;
    setShowLabels(false);
    setShowGhost(true);
    setSelectedId(null);
    setDeckPlaced(new Set());
    setDeckRun(r => r + 1);
    setDeckOn(true);
  }
  function restartDeck() {
    areas.forEach(p => { pieceStates.current[p.id] = { tx: 0, ty: 0 }; });
    setDeckPlaced(new Set());
    setDeckRun(r => r + 1);
  }
  function exitDeck() {
    setDeckOn(false);
    setShowLabels(deckLabelsBefore.current);
    assemble();
  }
  // A piece dropped from the box: its box's top-left is at (left, top) on screen
  function deckDrop(id: string, left: number, top: number): boolean {
    const el = canvasRef.current;
    if (!el) return false;
    const r = el.getBoundingClientRect(), v = viewRef.current, b = bboxes[id];
    const tx = (left - r.left - v.x) / v.scale - b.minX;
    const ty = (top - r.top - v.y) / v.scale - b.minY;
    // Close enough: within a fixed distance on screen, a little more for bigger pieces
    const tol = Math.max(22 / v.scale, Math.min(30, Math.max(b.w, b.h) * 0.15));
    if (Math.hypot(tx, ty) > tol) return false;
    pieceStates.current[id] = { tx: 0, ty: 0 };
    applyTransform(id);
    setDeckPlaced(prev => new Set(prev).add(id));
    setZOrder(prev => [...prev.filter(x => x !== id), id]);
    return true;
  }
  // Opening or closing the box (or rotating) changes the map's space: refit it
  useEffect(() => {
    const t = setTimeout(() => { resetView(); applyAllTransforms(); }, 30);
    return () => clearTimeout(t);
  }, [deckOn, portrait]); // eslint-disable-line react-hooks/exhaustive-deps

  function exitQuiz() {
    if (quizTimerRef.current) { clearInterval(quizTimerRef.current); quizTimerRef.current = null; }
    setQuiz({ active: false, placed: new Set(), wrong: new Set(), startTime: 0, endTime: null });
    setShowResults(false);
    setShowLabels(true);
    setSnapEnabled(true);
    assemble();
  }

  // Cleanup timer on unmount
  useEffect(() => () => { if (quizTimerRef.current) clearInterval(quizTimerRef.current); }, []);

  // ── Reset view ──────────────────────────────────────────────────────────────
  function resetView() {
    const r = canvasRef.current?.getBoundingClientRect();
    const newView = r ? fitView(r.width, r.height, svgW, svgH) : { x: 0, y: 0, scale: 1 };
    setFitScale(newView.scale);
    viewRef.current = newView;
    setView(newView);
    requestAnimationFrame(() => applyAllTransforms());
    setGhostOff(ghostScreenOffset());
  }

  // ── Canvas coordinate helpers ───────────────────────────────────────────────
  function screenToWorld(sx: number, sy: number) {
    const v = viewRef.current;
    return { x: (sx - v.x) / v.scale, y: (sy - v.y) / v.scale };
  }

  function canvasXY(clientX: number, clientY: number) {
    const r = canvasRef.current?.getBoundingClientRect();
    if (!r) return { x: clientX, y: clientY };
    return { x: clientX - r.left, y: clientY - r.top };
  }

  // ── Drag pieces ─────────────────────────────────────────────────────────────
  function startDrag(e: React.MouseEvent | React.TouchEvent, id: string) {
    if (deckOn) return; // in the one-at-a-time quiz, placed pieces stay put and the map pans
    e.preventDefault();
    e.stopPropagation();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const pt = canvasXY(clientX, clientY);
    const world = screenToWorld(pt.x, pt.y);
    const s = pieceStates.current[id] ?? { tx: 0, ty: 0 };
    dragging.current = { id, ox: world.x - s.tx, oy: world.y - s.ty };
    const el = pieceRefs.current[id];
    if (el) { el.style.transition = ""; el.classList.add("dragging"); }
    setZOrder(prev => [...prev.filter(x => x !== id), id]);
    setSelectedId(id);
  }

  // ── Pan canvas ──────────────────────────────────────────────────────────────
  function startPan(e: React.MouseEvent) {
    if (dragging.current) return;
    const v = viewRef.current;
    panning.current = { ox: e.clientX, oy: e.clientY, vx: v.x, vy: v.y };
  }

  // One finger on the map background moves the map
  function startPanTouch(e: React.TouchEvent) {
    if (dragging.current || e.touches.length !== 1) return;
    const v = viewRef.current;
    panning.current = { ox: e.touches[0].clientX, oy: e.touches[0].clientY, vx: v.x, vy: v.y };
  }

  // ── Wheel zoom ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if ((e.target as Element).closest?.("[data-panel]")) return; // let the info panel scroll
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const mx = e.clientX - r.left;
      const my = e.clientY - r.top;
      const v = viewRef.current;
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      const newScale = Math.min(Math.max(v.scale * factor, 0.3), 5);
      const newX = mx - (mx - v.x) * (newScale / v.scale);
      const newY = my - (my - v.y) * (newScale / v.scale);
      const newView = { x: newX, y: newY, scale: newScale };
      viewRef.current = newView;
      setView(newView);
      requestAnimationFrame(() => {
        applyAllTransforms();
        setGhostOff(ghostScreenOffset());
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [ghostScreenOffset]);

  // ── Touch pinch zoom (around the fingers) ───────────────────────────────────
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        // A second finger turns any drag or pan into a pinch
        if (dragging.current) {
          pieceRefs.current[dragging.current.id]?.classList.remove("dragging");
          dragging.current = null;
        }
        panning.current = null;
        pinchRef.current = { ...pinchInfo(e.touches, el.getBoundingClientRect()), view: viewRef.current };
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchRef.current) {
        e.preventDefault();
        const newView = pinchView(pinchRef.current, pinchInfo(e.touches, el.getBoundingClientRect()));
        viewRef.current = newView;
        setView(newView);
        requestAnimationFrame(() => {
          applyAllTransforms();
          setGhostOff(ghostScreenOffset());
        });
      }
    };
    const onTouchEnd = (e: TouchEvent) => { if (e.touches.length < 2) pinchRef.current = null; };
    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ghostScreenOffset]);

  // ── Global mouse/touch move + up ────────────────────────────────────────────
  useEffect(() => {
    function onMove(e: MouseEvent | TouchEvent) {
      // Two fingers are a pinch, handled separately
      if ("touches" in e && e.touches.length !== 1) return;
      if ("touches" in e && (dragging.current || panning.current)) e.preventDefault();
      const clientX = "touches" in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = "touches" in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;

      // Drag piece
      if (dragging.current) {
        const pt = canvasXY(clientX, clientY);
        const world = screenToWorld(pt.x, pt.y);
        const { id, ox, oy } = dragging.current;
        pieceStates.current[id] = { tx: world.x - ox, ty: world.y - oy };
        applyTransform(id);
        return;
      }

      // Pan canvas
      if (panning.current) {
        const { ox, oy, vx, vy } = panning.current;
        const newView = { ...viewRef.current, x: vx + (clientX - ox), y: vy + (clientY - oy) };
        viewRef.current = newView;
        setView(newView);
        requestAnimationFrame(() => {
          applyAllTransforms();
          setGhostOff(ghostScreenOffset());
        });
      }
    }

    function onUp() {
      if (dragging.current) {
        const { id } = dragging.current;
        const el = pieceRefs.current[id];
        if (el) el.classList.remove("dragging");

        if (snapEnabled) {
          const el2 = canvasRef.current;
          if (el2) {
            const homeTx = 0;
            const homeTy = 0;
            const s = pieceStates.current[id];
            const dist = Math.hypot(s.tx - homeTx, s.ty - homeTy);
            if (dist < 45) {
              animatePiece(id, homeTx, homeTy);
              const fill = el?.querySelector(".area-fill") as SVGPathElement | null;
              if (fill) {
                const os = fill.getAttribute("stroke"), ow = fill.getAttribute("stroke-width");
                fill.setAttribute("stroke", "#e0c97f");
                fill.setAttribute("stroke-width", "2.5");
                setTimeout(() => {
                  fill.setAttribute("stroke", os ?? "#0f1b2d");
                  fill.setAttribute("stroke-width", ow ?? "0.8");
                }, 380);
              }
              setSnapMsg(true);
              if (snapTimer.current) clearTimeout(snapTimer.current);
              snapTimer.current = setTimeout(() => setSnapMsg(false), 2000);
              // Quiz: mark as placed
              setQuiz(q => {
                if (!q.active) return q;
                const newPlaced = new Set(q.placed);
                newPlaced.add(id);
                if (newPlaced.size === areas.length) {
                  // All placed — end quiz
                  setTimeout(() => endQuiz(), 600);
                }
                return { ...q, placed: newPlaced };
              });
            }
          }
        }
        dragging.current = null;
      }
      panning.current = null;
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchend", onUp);
    };
  }, [snapEnabled, svgW, svgH, ghostScreenOffset]);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{
      display: "flex", flexDirection: "column", flex: 1,
      background: "#0f1b2d", overflow: "hidden", userSelect: "none",
    }}>

      {/* ── Header ── */}
      <header style={{
        background: "#16213e",
        borderBottom: "2px solid rgba(224,201,127,0.2)",
        borderTop: "2px solid #e0c97f",
        padding: "7px 14px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0, gap: 10, flexWrap: "wrap", zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <CompassRose />
          <div>
            <h1 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "1.05rem", fontWeight: 700, color: "#e0c97f",
              letterSpacing: "0.03em", margin: 0, lineHeight: 1.2,
            }}>English Boundary Areas — Interactive Jigsaw</h1>
            <p style={{ fontSize: "0.68rem", color: "#4a6080", margin: 0, marginTop: 1 }}>
              {areas.length} areas &bull; full England coverage &bull; ONS 2023 boundary data
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
          {deckOn ? (
            <div style={{ fontSize: "0.85rem", color: "#e0c97f", fontFamily: "Inter, sans-serif", display: window.innerWidth < 600 ? "none" : undefined }}>One at a time — drag each piece from the box onto the map</div>
          ) : !quiz.active ? (
            <>
              <ToggleLabel label="Ghost map"    checked={showGhost}     onChange={setShowGhost} />
              <ToggleLabel label="Labels"       checked={showLabels}    onChange={setShowLabels} />
              <ToggleLabel label="Towns"        checked={showTowns}     onChange={setShowTowns} />
              <ToggleLabel label="By region"    checked={regionColour}  onChange={setRegionColour} />
              <TextSizeButton ts={ts} groups={[{ key: "names", label: "Names" }, { key: "towns", label: "Towns" }]} />
              <Divider />
              <CtaButton onClick={scatter}>Scatter</CtaButton>
              <CtaButton onClick={assemble}>Assemble</CtaButton>
              <CtaButton onClick={resetView} secondary>Reset view</CtaButton>
              <Divider />
              <ToggleLabel label="Snap" checked={snapEnabled} onChange={setSnapEnabled} />
              <Divider />
              <CtaButton onClick={startQuiz}>Quiz mode</CtaButton>
              <CtaButton onClick={startDeck}>One at a time</CtaButton>
            </>
          ) : (
            <>
              <div style={{ fontSize: "0.8rem", color: "#e0c97f", fontFamily: "Inter, sans-serif", whiteSpace: "nowrap" }}>
                Quiz: <strong>{quiz.placed.size}</strong> / {areas.length} placed
              </div>
              <div style={{
                fontSize: "0.8rem", color: "#4a6080", fontFamily: "monospace",
                minWidth: 42, textAlign: "right",
              }}>
                {Math.floor(quizElapsed / 60)}:{(quizElapsed % 60).toString().padStart(2, "0")}
              </div>
              <Divider />
              <CtaButton onClick={endQuiz}>Finish</CtaButton>
              <CtaButton onClick={exitQuiz} secondary>Exit quiz</CtaButton>
            </>
          )}
        </div>
      </header>

      <div style={{ flex: 1, display: "flex", flexDirection: deckOn && portrait ? "column" : "row", minHeight: 0 }}>
      {/* ── Canvas ── */}
      <div
        ref={canvasRef}
        style={{ flex: 1, minWidth: 0, minHeight: 0, position: "relative", overflow: "hidden", cursor: dragging.current ? "grabbing" : "default" }}
        onMouseDown={startPan}
        onTouchStart={startPanTouch}
      >
        {/* Ghost reference */}
        {showGhost && (
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
            <g transform={`translate(${view.x},${view.y}) scale(${view.scale})`}>
              {areas.map(a => (
                <path key={a.id} d={a.path} fill="none"
                  stroke="#3a5070" strokeWidth="0.7" strokeDasharray="3,3" fillRule="evenodd" />
              ))}
              {deckOn && areas.filter(a => !deckPlaced.has(a.id) && Math.max(bboxes[a.id].w, bboxes[a.id].h) * view.scale < TINY_PX).map(a => (
                <circle key={"ring-" + a.id} cx={bboxes[a.id].cx} cy={bboxes[a.id].cy} r={RING_PX / view.scale}
                  fill="none" stroke="rgba(224,201,127,0.55)" strokeWidth={1.2} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
              ))}
            </g>
          </svg>
        )}

        {/* Interactive pieces */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", touchAction: "none" }}>
          {zOrder.map(id => {
            const a = areas.find(x => x.id === id);
            if (!a) return null;
            const info = AREA_INFO[a.name];
            const isSelected = selectedId === id;
            return (
              <g
                key={a.id}
                ref={el => { pieceRefs.current[a.id] = el; }}
                data-piece={a.id}
                style={{ cursor: deckOn ? "default" : "grab", display: deckOn && !deckPlaced.has(a.id) ? "none" : undefined }}
                onMouseDown={e => startDrag(e, a.id)}
                onTouchStart={e => startDrag(e, a.id)}
                onDoubleClick={() => setZOrder(prev => [...prev.filter(x => x !== a.id), a.id])}
                onMouseEnter={e => setTooltip({ name: a.name, x: e.clientX, y: e.clientY })}
                onMouseMove={e => setTooltip(t => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
                onMouseLeave={() => setTooltip(null)}
              >
                {/* Small areas get a wider invisible grab area for fingers */}
                {bboxes[a.id].w < SMALL_PIECE && bboxes[a.id].h < SMALL_PIECE && (
                  <path d={a.path} fill="none" stroke="transparent" strokeWidth={28}
                    strokeLinejoin="round" vectorEffect="non-scaling-stroke" pointerEvents="stroke" />
                )}
                <path
                  className="area-fill"
                  vectorEffect="non-scaling-stroke"
                  d={a.path}
                  fill={regionColour
                    ? (info ? (REGION_COLOURS[info.region] ?? a.colour) : a.colour)
                    : a.colour}
                  stroke={isSelected ? "#e0c97f" : "#0f1b2d"}
                  strokeWidth={isSelected ? "1.5" : "0.8"}
                  strokeLinejoin="round"
                  fillRule="evenodd"
                />
                {showLabels && (
                  <text x={a.cx} y={a.cy}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={7.5 * nameK} fontFamily="Inter, system-ui, sans-serif" fontWeight="600"
                    fill="white" stroke="rgba(0,0,0,0.6)" strokeWidth={1.05 * nameK} strokeLinejoin="round" paintOrder="stroke"
                    style={{ pointerEvents: "none", userSelect: "none" }}>
                    {a.name}
                  </text>
                )}
                {showTowns && info?.town && (
                  <g style={{ pointerEvents: "none" }}>
                    <circle cx={a.cx} cy={a.cy + 5 * zf + 4 * nameK} r={1.8 * zf} fill="#e0c97f" opacity="0.9" />
                    <text x={a.cx} y={a.cy + 5 * zf + 4 * nameK + 6 * townK}
                      textAnchor="middle" dominantBaseline="middle"
                      fontSize={5.5 * townK} fontFamily="Inter, sans-serif"
                      fill="#e0c97f" stroke="#00000099" strokeWidth={1.5 * townK} paintOrder="stroke"
                      style={{ userSelect: "none" }}>
                      {info.town}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Region legend */}
        {regionColour && !quiz.active && <RegionLegend />}

        {/* Info panel — hidden during quiz */}
        {selectedId && !quiz.active && (
          <InfoPanel id={selectedId} onClose={() => setSelectedId(null)} onMore={() => setDetailsId(selectedId)} />
        )}

        {/* Quiz results overlay */}
        {showResults && (
          <QuizResults
            placed={quiz.placed.size}
            total={areas.length}
            elapsed={quizElapsed}
            onClose={() => { setShowResults(false); assemble(); setShowLabels(true); setSnapEnabled(true); }}
          />
        )}

        {/* Quiz hint bar */}
        {quiz.active && (
          <div style={{
            position: "absolute", top: 10, left: "50%",
            transform: "translateX(-50%)",
            padding: "5px 18px", borderRadius: 20,
            background: "rgba(15,52,96,0.9)",
            border: "1px solid rgba(224,201,127,0.4)",
            color: "#e0c97f", fontSize: "0.75rem",
            pointerEvents: "none", whiteSpace: "nowrap",
            boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
          }}>
            Drag each piece to its correct position on the ghost map — snap will lock it in place
          </div>
        )}

        {/* Tooltip */}
        {tooltip && !selectedId && (
          <div style={{
            position: "fixed", left: tooltip.x + 14, top: tooltip.y - 10,
            zIndex: 9999, pointerEvents: "none",
            padding: "4px 12px", borderRadius: 4,
            background: "rgba(22,33,62,0.95)",
            border: "1px solid rgba(224,201,127,0.4)",
            color: "#e0c97f",
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "0.82rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
            whiteSpace: "nowrap",
          }}>{tooltip.name}</div>
        )}

        {/* Zoom indicator */}
        <div style={{
          position: "absolute", bottom: 38, right: 12,
          padding: "3px 10px", borderRadius: 4,
          background: "rgba(22,33,62,0.8)",
          border: "1px solid rgba(58,80,112,0.5)",
          color: "#4a6080", fontSize: "0.68rem",
          fontFamily: "monospace", pointerEvents: "none",
        }}>{Math.round(view.scale * 100)}%</div>

        {/* Snap indicator */}
        <div style={{
          position: "absolute", bottom: 38, left: "50%",
          transform: "translateX(-50%)",
          padding: "3px 14px", borderRadius: 20,
          background: "rgba(224,201,127,0.12)",
          border: "1px solid rgba(224,201,127,0.5)",
          color: "#e0c97f", fontSize: "0.72rem",
          pointerEvents: "none",
          opacity: snapMsg ? 1 : 0, transition: "opacity 0.3s",
          whiteSpace: "nowrap",
        }}>✓ Snapped to map position</div>

        {/* Info bar */}
        <div style={{
          position: "absolute", bottom: 10, left: "50%",
          transform: "translateX(-50%)",
          padding: "3px 16px", borderRadius: 20,
          background: "rgba(22,33,62,0.7)",
          border: "1px solid rgba(58,80,112,0.5)",
          color: "#3a5070", fontSize: "0.7rem",
          pointerEvents: "none", whiteSpace: "nowrap",
        }}>
          {deckOn ? <>Drag the piece from the box onto its outline &bull; {isTouch ? "Drag the background to move the map • Pinch to zoom" : "Drag the background to move the map • Scroll to zoom • Arrow keys change piece"}</> : isTouch ? <>Drag pieces with a finger &bull; Drag the background to move the map &bull; Pinch to zoom &bull; Tap a piece for details</> : <>Scroll to zoom &bull; Drag canvas to pan &bull; Click a piece for details &bull; Double-click to bring to front</>}
        </div>
      </div>
      {deckOn && (
        <PieceDeck key={deckRun} mapKey="england" noun="area" items={deckItems} placed={deckPlaced}
          scale={view.scale} layout={portrait ? "bottom" : "side"}
          onDrop={deckDrop} onRestart={restartDeck} onExit={exitDeck} />
      )}
      </div>

      {detailsId && (() => {
        const p = ENGLAND_PIECES.find(x => x.id === detailsId);
        return p ? <DetailsModal piece={p} cfg={ENGLAND_CFG} onClose={() => setDetailsId(null)} /> : null;
      })()}

      <style>{`
        @keyframes panelIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
        g[style*="grab"]:hover path.area-fill {
          stroke: rgba(255,255,255,0.45) !important;
          stroke-width: 1.4px !important;
        }
        g.dragging { cursor: grabbing !important; filter: drop-shadow(0 8px 22px rgba(0,0,0,0.85)); }
        g.dragging path.area-fill {
          stroke: white !important;
          stroke-width: 1.8px !important;
          opacity: 0.92;
        }
      `}</style>
    </div>
  );
}

// ─── Small UI components ──────────────────────────────────────────────────────

function ToggleLabel({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{
      display: "flex", alignItems: "center", gap: 5,
      fontSize: "0.74rem", color: "#8899aa",
      cursor: "pointer", whiteSpace: "nowrap",
    }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        style={{ accentColor: "#e0c97f", cursor: "pointer" }} />
      {label}
    </label>
  );
}

function CtaButton({ onClick, children, secondary }: { onClick: () => void; children: React.ReactNode; secondary?: boolean }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        background: secondary ? (hovered ? "#1a2a3a" : "#0d1f30") : (hovered ? "#1a4a80" : "#0f3460"),
        color: secondary ? "#6a8aaa" : "#e0c97f",
        border: `1px solid ${secondary ? "rgba(58,80,112,0.4)" : "rgba(224,201,127,0.35)"}`,
        padding: "4px 11px", borderRadius: 4, cursor: "pointer",
        fontSize: "0.75rem", fontFamily: "Inter, sans-serif",
        transition: "background 0.15s",
        transform: pressed ? "scale(0.96)" : "scale(1)",
        whiteSpace: "nowrap",
      }}
    >{children}</button>
  );
}

function Divider() {
  return <div style={{ width: 1, height: 22, background: "#1a3060", margin: "0 2px" }} />;
}
