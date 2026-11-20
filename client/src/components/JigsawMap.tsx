/**
 * JigsawMap — Dark Atlas design
 * Full-viewport interactive jigsaw for any map (USA, Europe, …); each map is a MapConfig.
 *
 * Features:
 * - Zoom (mouse wheel / pinch) + pan (drag empty canvas)
 * - Scatter constrained to canvas bounds
 * - State capitals (toggleable)
 * - Info panel on click (capital, region, population, area)
 * - Region colour toggle with legend
 * - Quiz mode with timer and results overlay
 */

import type { MapConfig, MapPiece } from "@/lib/mapTypes";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SMALL_PIECE, bySizeDescending, fitView, pathBBox, pinchInfo, pinchView, type ViewState as TouchView } from "@/lib/touch";
import { pathArea } from "@/lib/touch";
import { TextSizeButton, useTextSizes } from "@/components/TextSizes";
import PieceDeck, { type DeckItem, TINY_PX, RING_PX } from "@/components/PieceDeck";
const isTouch = typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches;

// ─── Types ────────────────────────────────────────────────────────────────────
interface PieceState { tx: number; ty: number; ps?: number; } // ps = per-piece scale (default 1)
interface ViewState  { x: number; y: number; scale: number; }
interface QuizState {
  active: boolean;
  placed: Set<string>;
  startTime: number;
  endTime: number | null;
}
interface FlashState { id: string; type: 'correct' | 'wrong'; }

// Per-state label font size based on area_km2 (clamped to readable range)
function labelFontSize(area_km2: number, [minA, maxA]: [number, number]): number {
  // Scale: the smallest areas → 6px, the largest → 14px
  const minF = 6, maxF = 14;
  const clamped = Math.min(maxA, Math.max(minA, area_km2));
  return minF + (maxF - minF) * Math.log(clamped / minA) / Math.log(maxA / minA);
}

// ─── Region Legend ────────────────────────────────────────────────────────────
function RegionLegend({ colours }: { colours: Record<string, string> }) {
  return (
    <div style={{
      position: "absolute", bottom: 50, left: 12, zIndex: 400,
      background: "rgba(16,27,50,0.93)",
      border: "1px solid rgba(224,201,127,0.2)",
      borderRadius: 6, padding: "8px 12px",
      boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
      animation: "panelIn 0.18s cubic-bezier(0.23,1,0.32,1)",
    }}>
      <div style={{ fontSize: "0.62rem", color: "#4a6080", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, fontFamily: "Inter, sans-serif" }}>Region</div>
      {Object.entries(colours).map(([region, colour]) => (
        <div key={region} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
          <div style={{ width: 12, height: 12, borderRadius: 2, background: colour, flexShrink: 0 }} />
          <span style={{ fontSize: "0.72rem", color: "#c8d8e8", fontFamily: "Inter, sans-serif", whiteSpace: "nowrap" }}>{region}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Info Panel ───────────────────────────────────────────────────────────────
function InfoPanel({ id, cfg, onClose }: { id: string; cfg: MapConfig; onClose: () => void }) {
  const state = cfg.pieces.find(s => s.id === id);
  if (!state) return null;

  function fmtPop(n: number) {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(2).replace(/\.?0+$/, "") + "m";
    if (n >= 1_000)     return (n / 1_000).toFixed(0) + "k";
    return n.toLocaleString();
  }

  return (
    <div style={{
      position: "absolute", top: 60, right: 12, width: 240, zIndex: 500,
      background: "rgba(16,27,50,0.97)", border: "1px solid rgba(224,201,127,0.35)",
      borderRadius: 6, boxShadow: "0 8px 32px rgba(0,0,0,0.7)",
      fontFamily: "Inter, sans-serif",
      animation: "panelIn 0.18s cubic-bezier(0.23,1,0.32,1)",
    }}>
      <div style={{ height: 4, background: state.colour, borderRadius: "6px 6px 0 0" }} />
      <div style={{ padding: "10px 12px 8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <h2 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "0.95rem", fontWeight: 700, color: "#e0c97f",
            margin: 0, lineHeight: 1.3, flex: 1, paddingRight: 8,
          }}>{state.name}</h2>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: "#4a6080",
            cursor: "pointer", fontSize: "1rem", lineHeight: 1, padding: 0, flexShrink: 0,
          }}>✕</button>
        </div>
        <span style={{
          display: "inline-block", marginTop: 4, padding: "1px 7px",
          borderRadius: 10, fontSize: "0.65rem", letterSpacing: "0.06em",
          background: "rgba(224,201,127,0.12)", color: "#a89050",
          textTransform: "uppercase",
        }}>{cfg.typeLabel} · {state.abbr}</span>
      </div>
      <div style={{ padding: "10px 12px" }}>
        <Row label={cfg.capitalLabel} value={state.capital} />
        <Row label="Region"           value={state.region} />
        <Row label={cfg.popLabel}     value={fmtPop(state.pop)} />
        <Row label={cfg.areaLabel}    value={state.area_km2.toLocaleString() + " km²"} />
        {state.note && <div style={{ fontSize: "0.68rem", color: "#6a80a0", fontStyle: "italic", lineHeight: 1.35 }}>{state.note}</div>}
      </div>
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

// ─── Quiz Results ─────────────────────────────────────────────────────────────
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
        <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.5rem", color: "#e0c97f", margin: "0 0 4px" }}>{grade}</h2>
        <p style={{ color: "#4a6080", fontSize: "0.8rem", margin: "0 0 20px" }}>Quiz complete</p>
        <div style={{ display: "flex", gap: 24, justifyContent: "center", marginBottom: 24 }}>
          <Stat label="Placed"  value={`${placed} / ${total}`} />
          <Stat label="Score"   value={`${pct}%`} />
          <Stat label="Time"    value={`${mins}:${secs.toString().padStart(2,"0")}`} />
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

// ─── Main Component ───────────────────────────────────────────────────────────
export default function JigsawMap({ cfg }: { cfg: MapConfig }) {
  const states: MapPiece[] = cfg.pieces;
  const svgW   = cfg.width;
  const svgH   = cfg.height;
  const REGION_COLOURS = cfg.regionColours;
  // Text sizes: each map's sizes are scaled so text looks the same size on screen
  // whatever the map's shape (the USA map is the reference), then by the sliders
  const ts = useTextSizes(cfg.key);
  const textNorm = 1.32 / Math.min(1400 / svgW, 800 / svgH);

  const [showGhost,    setShowGhost]    = useState(true);
  const [showLabels,   setShowLabels]   = useState(true);
  const [showCapitals, setShowCapitals] = useState(false);
  const [regionColour, setRegionColour] = useState(false);
  const [snapEnabled,  setSnapEnabled]  = useState(true);
  const [snapMsg,      setSnapMsg]      = useState(false);
  const [showDotMap,   setShowDotMap]   = useState(false);
  const [fullNames,    setFullNames]    = useState(false);
  const [flash,        setFlash]        = useState<FlashState | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedId,   setSelectedId]   = useState<string | null>(null);
  const [tooltip,      setTooltip]      = useState<{ name: string; x: number; y: number } | null>(null);
  const [zOrder,       setZOrder]       = useState<string[]>(() => bySizeDescending(states));
  const bboxes = useMemo(() => Object.fromEntries(states.map(s => [s.id, pathBBox(s.path)])), [states]);

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
  const deckItems = useMemo<DeckItem[]>(() => states.map(s => ({
    id: s.id, name: s.name, path: s.path, colour: s.colour, bbox: bboxes[s.id],
    area: pathArea(s.path), region: s.region,
  })), [states, bboxes]);
  const deckLabelsBefore = useRef(true);
  const [view,         setView]         = useState<ViewState>({ x: 0, y: 0, scale: 1 });
  // The scale when the map is fitted to the screen. With fixed-size text, text is as big
  // on screen as it is at that scale, however far you zoom in or out.
  const [fitScale,     setFitScale]     = useState(1);
  const zf    = ts.fixed ? fitScale / view.scale : 1;
  const nameK = textNorm * ts.size("names") * zf;
  const capK  = textNorm * ts.size("capitals") * zf;
  const [ghostOff,     setGhostOff]     = useState({ tx: 0, ty: 0 });
  const [quiz, setQuiz] = useState<QuizState>({ active: false, placed: new Set(), startTime: 0, endTime: null });
  const [showResults,  setShowResults]  = useState(false);
  const [quizElapsed,  setQuizElapsed]  = useState(0);
  const [trays, setTrays] = useState<{ left: number; top: number; width: number; height: number }[] | null>(null);
  const trayView = useRef<ViewState | null>(null);

  const viewRef      = useRef<ViewState>({ x: 0, y: 0, scale: 1 });
  const canvasRef    = useRef<HTMLDivElement>(null);
  const pieceStates  = useRef<Record<string, PieceState>>({});
  const pieceRefs    = useRef<Record<string, SVGGElement | null>>({});
  const dragging     = useRef<{ id: string; ox: number; oy: number } | null>(null);
  const panning      = useRef<{ ox: number; oy: number; vx: number; vy: number } | null>(null);
  const snapTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pinchRef     = useRef<{ dist: number; mx: number; my: number; view: TouchView } | null>(null);
  const quizTimerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const scatterPositions = useRef<Record<string, PieceState>>({});

  useEffect(() => { viewRef.current = view; }, [view]);

  const assembledOffset = useCallback((): PieceState => {
    const el = canvasRef.current;
    if (!el) return { tx: 0, ty: 0 };
    const { width: w, height: h } = el.getBoundingClientRect();
    const v = viewRef.current;
    const cx = (w / 2 - v.x) / v.scale;
    const cy = (h / 2 - v.y) / v.scale;
    return { tx: cx - svgW / 2, ty: cy - svgH / 2 };
  }, [svgW, svgH]);

  const ghostScreenOffset = useCallback(() => {
    const el = canvasRef.current;
    if (!el) return { tx: 0, ty: 0 };
    const { width: w, height: h } = el.getBoundingClientRect();
    const v = viewRef.current;
    void w; void h;
    return { tx: v.x, ty: v.y };
  }, [svgW, svgH]);

  useEffect(() => {
    setGhostOff(ghostScreenOffset());
    // Rotating an iPad or resizing the window refits the map; pieces keep their places
    let t: ReturnType<typeof setTimeout> | undefined;
    const update = () => { clearTimeout(t); t = setTimeout(() => resetView(), 150); };
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [ghostScreenOffset]);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const { width: w, height: h } = el.getBoundingClientRect();
    // The assembled map lives at world (0,0); the view fits it to the screen
    const initX = 0;
    const initY = 0;
    const initView = fitView(w, h, svgW, svgH);
    setFitScale(initView.scale);
    viewRef.current = initView;
    setView(initView);
    states.forEach(s => { pieceStates.current[s.id] = { tx: initX, ty: initY }; });
    requestAnimationFrame(() => applyAllTransforms());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => { if (quizTimerRef.current) clearInterval(quizTimerRef.current); }, []);

  function pieceTransform(s: PieceState, v: ViewState): string {
    const ps = s.ps ?? 1;
    const sx = s.tx * v.scale + v.x;
    const sy = s.ty * v.scale + v.y;
    return `translate(${sx.toFixed(1)},${sy.toFixed(1)}) scale(${(v.scale * ps).toFixed(4)})`;
  }

  function applyAllTransforms() {
    const v = viewRef.current;
    Object.entries(pieceStates.current).forEach(([id, s]) => {
      const el = pieceRefs.current[id];
      if (el) el.setAttribute("transform", pieceTransform(s, v));
    });
  }

  function applyTransform(id: string) {
    const el = pieceRefs.current[id];
    const s  = pieceStates.current[id];
    const v  = viewRef.current;
    if (el && s) el.setAttribute("transform", pieceTransform(s, v));
  }

  function animatePiece(id: string, tx: number, ty: number, delay = 0, ps = 1) {
    pieceStates.current[id] = { tx, ty, ps };
    setTimeout(() => {
      const e = pieceRefs.current[id];
      if (!e) return;
      const v = viewRef.current;
      e.style.transition = "transform 0.5s cubic-bezier(0.25,0.8,0.25,1)";
      e.setAttribute("transform", pieceTransform({ tx, ty, ps }, v));
      setTimeout(() => { e.style.transition = ""; }, 560);
    }, delay);
  }

  function scatter() {
    const el = canvasRef.current;
    if (!el) return;
    const { width: w, height: fullH } = el.getBoundingClientRect();
    const h = fullH - 46; // keep clear of the hint bar along the bottom
    const n = states.length;
    const pad = 6, gap = 6, aspect = 1.25;
    const shuffled = [...states].sort(() => Math.random() - 0.5);
    // Each piece is shown filling its own cell in a tray (never larger than real
    // size) and grows to its true size when picked up. Trays go beside the map on
    // wide screens and above/below it on tall ones; the map shrinks to fit between.
    const cells: { x: number; y: number }[] = [];
    let ch: number, cw: number, mid: { x: number; y: number; w: number; h: number };
    const trayRects: { left: number; top: number; width: number; height: number }[] = [];
    if (w / h >= (svgW / svgH) * 1.15) {
      const perSide = Math.ceil(n / 2);
      let k = 1; ch = Math.min(132, (h - pad * 2 + gap) / perSide - gap);
      if (ch < 60) { k = 2; ch = Math.min(132, (h - pad * 2 + gap) / Math.ceil(perSide / k) - gap); }
      ch = Math.min(ch, (w * 0.5 / (2 * k) - gap) / aspect);
      cw = ch * aspect;
      const rows = Math.ceil(perSide / k), sideW = k * (cw + gap);
      for (let side = 0; side < 2; side++) {
        const count = side === 0 ? perSide : n - perSide;
        const x0 = side === 0 ? pad : w - pad - sideW + gap;
        const totalH = Math.min(rows, count) * (ch + gap) - gap;
        const y0 = Math.max(pad, (h - totalH) / 2);
        for (let i = 0; i < count; i++) {
          cells.push({ x: x0 + Math.floor(i / rows) * (cw + gap) + cw / 2, y: y0 + (i % rows) * (ch + gap) + ch / 2 });
        }
        trayRects.push({ left: x0 - 3, top: pad - 3, width: sideW - gap + 6, height: h - pad * 2 + 6 });
      }
      mid = { x: pad + sideW, y: 0, w: w - 2 * (pad + sideW), h };
    } else {
      ch = 80;
      let perRow = 1, rows = n;
      for (;;) {
        cw = ch * aspect;
        perRow = Math.max(1, Math.floor((w - pad * 2 + gap) / (cw + gap)));
        rows = Math.ceil(n / perRow);
        if (rows * (ch + gap) <= h * 0.5 || ch < 24) break;
        ch *= 0.92;
      }
      const topRows = Math.ceil(rows / 2), bottomRows = rows - topRows;
      const rowW = perRow * (cw + gap) - gap, x0 = (w - rowW) / 2;
      const topH = topRows * (ch + gap), bottomH = bottomRows * (ch + gap);
      for (let i = 0; i < n; i++) {
        const r = Math.floor(i / perRow), c = i % perRow;
        const y = r < topRows ? pad + r * (ch + gap) : h - pad - bottomH + (r - topRows) * (ch + gap);
        cells.push({ x: x0 + c * (cw + gap) + cw / 2, y: y + ch / 2 });
      }
      trayRects.push({ left: x0 - 3, top: pad - 3, width: rowW + 6, height: topH - gap + 6 });
      if (bottomRows) trayRects.push({ left: x0 - 3, top: h - pad - bottomH - 3, width: rowW + 6, height: bottomH - gap + 6 });
      mid = { x: 0, y: pad + topH, w, h: h - topH - bottomH - pad * 2 };
    }
    // Fit the map into the space left between the trays
    const f = fitView(mid.w, Math.max(80, mid.h), svgW, svgH, 10);
    const v = { scale: f.scale, x: f.x + mid.x, y: f.y + mid.y };
    viewRef.current = v;
    setView(v);
    setGhostOff(ghostScreenOffset());
    // screenX of a map point px = (tx + px*ps) * v.scale + v.x; centre each piece's box in its cell
    shuffled.forEach((s, i) => {
      const c = cells[i], b = bboxes[s.id];
      const ps = Math.min(1, 0.85 * Math.min(cw / (Math.max(b.w, 1) * v.scale), ch / (Math.max(b.h, 1) * v.scale)));
      const tx = (c.x - v.x) / v.scale - b.cx * ps;
      const ty = (c.y - v.y) / v.scale - b.cy * ps;
      scatterPositions.current[s.id] = { tx, ty, ps };
      animatePiece(s.id, tx, ty, i * 10, ps);
    });
    trayView.current = v;
    setTrays(trayRects);
  }

  function assemble() {
    const el = canvasRef.current;
    if (!el) return;
    states.forEach((s, i) => animatePiece(s.id, 0, 0, i * 10));
    setTrays(null);
  }

  function resetView() {
    const r = canvasRef.current?.getBoundingClientRect();
    const newView = r ? fitView(r.width, r.height, svgW, svgH) : { x: 0, y: 0, scale: 1 };
    setFitScale(newView.scale);
    viewRef.current = newView;
    setView(newView);
    requestAnimationFrame(() => applyAllTransforms());
    setGhostOff(ghostScreenOffset());
  }

  function screenToWorld(sx: number, sy: number) {
    const v = viewRef.current;
    return { x: (sx - v.x) / v.scale, y: (sy - v.y) / v.scale };
  }

  function canvasXY(clientX: number, clientY: number) {
    const r = canvasRef.current?.getBoundingClientRect();
    if (!r) return { x: clientX, y: clientY };
    return { x: clientX - r.left, y: clientY - r.top };
  }

  function startDrag(e: React.MouseEvent | React.TouchEvent, id: string) {
    if (deckOn) return; // in the one-at-a-time quiz, placed pieces stay put and the map pans
    e.preventDefault();
    e.stopPropagation();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const pt = canvasXY(clientX, clientY);
    const world = screenToWorld(pt.x, pt.y);
    const s = pieceStates.current[id];

    // If the piece has a per-piece scale (e.g. from scatter), reset it to 1
    // and reposition so the centroid stays under the cursor.
    // Current centroid screen pos (from pieceTransform):
    //   screenX = (s.tx + s.cx * s.ps) * v.scale + v.x
    // After reset to ps=1, centroid screen pos:
    //   screenX = (newTx + s.cx * 1) * v.scale + v.x
    // Setting equal: newTx = s.tx + s.cx * (s.ps - 1)
    if (s.ps && s.ps !== 1) {
      const stateData = states.find(x => x.id === id);
      if (stateData) {
        const newTx = s.tx + stateData.cx * (s.ps - 1);
        const newTy = s.ty + stateData.cy * (s.ps - 1);
        pieceStates.current[id] = { tx: newTx, ty: newTy, ps: 1 };
        applyTransform(id);
      }
    }

    const updated = pieceStates.current[id];
    dragging.current = { id, ox: world.x - updated.tx, oy: world.y - updated.ty };
    setZOrder(prev => [...prev.filter(x => x !== id), id]);
    setSelectedId(id);
    const el = pieceRefs.current[id];
    if (el) el.classList.add("dragging");
  }

  function startPan(e: React.MouseEvent) {
    if (dragging.current) return;
    panning.current = { ox: e.clientX, oy: e.clientY, vx: viewRef.current.x, vy: viewRef.current.y };
  }

  // One finger on the map background moves the map
  function startPanTouch(e: React.TouchEvent) {
    if (dragging.current || e.touches.length !== 1) return;
    panning.current = { ox: e.touches[0].clientX, oy: e.touches[0].clientY, vx: viewRef.current.x, vy: viewRef.current.y };
  }

  useEffect(() => {
    function onMove(e: MouseEvent | TouchEvent) {
      if ("touches" in e && e.touches.length !== 1) return;
      if ("touches" in e && (dragging.current || panning.current)) e.preventDefault();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      if (dragging.current) {
        const { id, ox, oy } = dragging.current;
        const pt = canvasXY(clientX, clientY);
        const world = screenToWorld(pt.x, pt.y);
        const tx = world.x - ox;
        const ty = world.y - oy;
        pieceStates.current[id] = { tx, ty };
        applyTransform(id);
        return;
      }
      if (panning.current) {
        const dx = clientX - panning.current.ox;
        const dy = clientY - panning.current.oy;
        const newView = { ...viewRef.current, x: panning.current.vx + dx, y: panning.current.vy + dy };
        viewRef.current = newView;
        setView(newView);
        setGhostOff(ghostScreenOffset());
        requestAnimationFrame(() => applyAllTransforms());
      }
    }

    function onUp(e: MouseEvent | TouchEvent) {
      if (dragging.current) {
        const { id } = dragging.current;
        const el = pieceRefs.current[id];
        if (el) el.classList.remove("dragging");
        dragging.current = null;

        if (snapEnabled) {
          const el2 = canvasRef.current;
          if (el2) {
            const homeTx = 0;
            const homeTy = 0;
            const s = pieceStates.current[id];
            const dist = Math.hypot(s.tx - homeTx, s.ty - homeTy);
            if (dist < 45) {
              // ✅ Correct placement
              animatePiece(id, homeTx, homeTy);
              if (flashTimer.current) clearTimeout(flashTimer.current);
              setFlash({ id, type: 'correct' });
              flashTimer.current = setTimeout(() => setFlash(null), 500);
              setSnapMsg(true);
              if (snapTimer.current) clearTimeout(snapTimer.current);
              snapTimer.current = setTimeout(() => setSnapMsg(false), 2000);
              setQuiz(q => {
                if (!q.active) return q;
                const newPlaced = new Set(q.placed);
                newPlaced.add(id);
                if (newPlaced.size === states.length) {
                  setTimeout(() => endQuiz(), 600);
                }
                return { ...q, placed: newPlaced };
              });
            } else if (quiz.active) {
              // ❌ Wrong placement — red flash then return to original scatter position
              if (flashTimer.current) clearTimeout(flashTimer.current);
              setFlash({ id, type: 'wrong' });
              flashTimer.current = setTimeout(() => {
                setFlash(null);
                // Return to the position it was scattered to
                const origin = scatterPositions.current[id];
                if (origin) {
                  animatePiece(id, origin.tx, origin.ty, 0, origin.ps ?? 1);
                }
              }, 420);
            }
          }
        }
      }
      panning.current = null;
    }

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const el = canvasRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const v = viewRef.current;
      const newScale = Math.min(5, Math.max(0.3, v.scale * delta));
      const newX = mx - (mx - v.x) * (newScale / v.scale);
      const newY = my - (my - v.y) * (newScale / v.scale);
      const newView = { x: newX, y: newY, scale: newScale };
      viewRef.current = newView;
      setView(newView);
      setGhostOff(ghostScreenOffset());
      requestAnimationFrame(() => applyAllTransforms());
    }

    // Two fingers: zoom around the fingers and follow them; cancels any drag or pan
    function onTouchStart(e: TouchEvent) {
      const el = canvasRef.current;
      if (e.touches.length === 2 && el) {
        if (dragging.current) {
          pieceRefs.current[dragging.current.id]?.classList.remove("dragging");
          dragging.current = null;
        }
        panning.current = null;
        pinchRef.current = { ...pinchInfo(e.touches, el.getBoundingClientRect()), view: viewRef.current };
      }
    }

    function onTouchMove(e: TouchEvent) {
      const el = canvasRef.current;
      if (e.touches.length === 2 && pinchRef.current && el) {
        e.preventDefault();
        const newView = pinchView(pinchRef.current, pinchInfo(e.touches, el.getBoundingClientRect()));
        viewRef.current = newView;
        setView(newView);
        setGhostOff(ghostScreenOffset());
        requestAnimationFrame(() => applyAllTransforms());
      } else if (e.touches.length === 1 && !pinchRef.current) {
        onMove(e);
      }
    }

    function onTouchEnd(e: TouchEvent) {
      if (e.touches.length < 2) pinchRef.current = null;
      if (e.touches.length === 0) onUp(e);
    }

    const canvas = canvasRef.current;
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchstart", onTouchStart, { passive: false });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    canvas?.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      canvas?.removeEventListener("wheel", onWheel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapEnabled, states.length]);

  function startQuiz() {
    setShowLabels(false);
    setShowCapitals(false);
    setShowDotMap(true);
    setSnapEnabled(true);
    setSelectedId(null);
    setShowResults(false);
    const now = Date.now();
    setQuiz({ active: true, placed: new Set(), startTime: now, endTime: null });
    setQuizElapsed(0);
    if (quizTimerRef.current) clearInterval(quizTimerRef.current);
    quizTimerRef.current = setInterval(() => setQuizElapsed(e => e + 1), 1000);
    setTimeout(() => scatter(), 100);
  }

  function endQuiz() {
    if (quizTimerRef.current) { clearInterval(quizTimerRef.current); quizTimerRef.current = null; }
    setQuiz(q => ({ ...q, active: false, endTime: Date.now() }));
    setShowLabels(true);
    setShowDotMap(false);
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
    states.forEach(p => { pieceStates.current[p.id] = { tx: 0, ty: 0 }; });
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
    setQuiz({ active: false, placed: new Set(), startTime: 0, endTime: null });
    setShowResults(false);
    setShowLabels(true);
    setShowDotMap(false);
    setSnapEnabled(true);
    assemble();
  }

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
          <span style={{ fontSize: "1.4rem", lineHeight: 1 }}>{cfg.flag}</span>
          <div>
            <h1 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "1.05rem", fontWeight: 700, color: "#e0c97f",
              letterSpacing: "0.03em", margin: 0, lineHeight: 1.2,
            }}>{cfg.title}</h1>
            <p style={{ fontSize: "0.68rem", color: "#4a6080", margin: 0, marginTop: 1 }}>
              {cfg.subtitle}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
          {deckOn ? (
            <div style={{ fontSize: "0.85rem", color: "#e0c97f", fontFamily: "Inter, sans-serif", display: window.innerWidth < 600 ? "none" : undefined }}>One at a time — drag each piece from the box onto the map</div>
          ) : !quiz.active ? (
            <>
              <ToggleLabel label="Ghost map"  checked={showGhost}    onChange={setShowGhost} />
              <ToggleLabel label="Dot map"    checked={showDotMap}   onChange={setShowDotMap} />
              <ToggleLabel label="Labels"     checked={showLabels}   onChange={setShowLabels} />
              <ToggleLabel label="Full names" checked={fullNames}    onChange={setFullNames} />
              <ToggleLabel label="Capitals"   checked={showCapitals} onChange={setShowCapitals} />
              <ToggleLabel label="By region"  checked={regionColour} onChange={setRegionColour} />
              <TextSizeButton ts={ts} groups={[{ key: "names", label: "Names" }, { key: "capitals", label: "Capitals" }]} />
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
                Quiz: <strong>{quiz.placed.size}</strong> / {states.length} placed
              </div>
              <div style={{ fontSize: "0.8rem", color: "#4a6080", fontFamily: "monospace", minWidth: 42, textAlign: "right" }}>
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
        style={{ flex: 1, minWidth: 0, minHeight: 0, position: "relative", overflow: "hidden", cursor: "default" }}
        onMouseDown={startPan}
        onTouchStart={startPanTouch}
      >
        {/* Trays the scattered pieces sit in (hidden once the map is moved) */}
        {trays && trayView.current === view && (
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
            {trays.map((t, i) => (
              <div key={i} style={{ position: "absolute", ...t, border: "1px solid rgba(224,201,127,0.18)", borderRadius: 8, background: "rgba(224,201,127,0.03)" }} />
            ))}
          </div>
        )}

        {/* Neighbouring land that isn't part of the jigsaw */}
        {cfg.context && (
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
            <g transform={`translate(${view.x},${view.y}) scale(${view.scale})`}>
              {cfg.context.map((d, i) => <path key={i} d={d} fill="#16243a" stroke="#0f1b2d" strokeWidth={0.6} vectorEffect="non-scaling-stroke" />)}
            </g>
          </svg>
        )}

        {/* Ghost reference */}
        {showGhost && (
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
            <g transform={`translate(${view.x},${view.y}) scale(${view.scale})`}>
              {states.map(s => (
                <path key={s.id} d={s.path} fill="none"
                  stroke="#3a5070" strokeWidth="0.7" strokeDasharray="3,3" fillRule="evenodd" />
              ))}
              {deckOn && states.filter(s => !deckPlaced.has(s.id) && Math.max(bboxes[s.id].w, bboxes[s.id].h) * view.scale < TINY_PX).map(s => (
                <circle key={"ring-" + s.id} cx={bboxes[s.id].cx} cy={bboxes[s.id].cy} r={RING_PX / view.scale}
                  fill="none" stroke="rgba(224,201,127,0.55)" strokeWidth={1.2} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
              ))}
            </g>
          </svg>
        )}

        {/* Dot map — centroid targets only */}
        {showDotMap && (
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
            <g transform={`translate(${view.x},${view.y}) scale(${view.scale})`}>
              {states.map(s => {
                const placed = quiz.active && quiz.placed.has(s.id);
                return (
                  <g key={s.id}>
                    <circle
                      cx={s.cx} cy={s.cy} r={placed ? 4 : 5}
                      fill={placed ? "#e0c97f" : "rgba(58,80,112,0.5)"}
                      stroke={placed ? "#e0c97f" : "#3a5070"}
                      strokeWidth="1"
                    />
                    {!quiz.active && (
                      <text x={s.cx} y={s.cy + 5 * zf + 5 * nameK}
                        textAnchor="middle" dominantBaseline="middle"
                        fontSize={5 * nameK} fontFamily="Inter, sans-serif"
                        fill="#3a5070" style={{ userSelect: "none" }}>
                        {s.abbr}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        )}

        {/* Interactive pieces */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", touchAction: "none" }}>
          {zOrder.map(id => {
            const s = states.find(x => x.id === id);
            if (!s) return null;
            const isSelected = selectedId === id;
            const fill = regionColour ? (REGION_COLOURS[s.region] ?? s.colour) : s.colour;
            return (
              <g
                key={s.id}
                ref={el => { pieceRefs.current[s.id] = el; }}
                data-piece={s.id}
                style={{ cursor: deckOn ? "default" : "grab", display: deckOn && !deckPlaced.has(s.id) ? "none" : undefined }}
                onMouseDown={e => startDrag(e, s.id)}
                onTouchStart={e => startDrag(e, s.id)}
                onDoubleClick={() => setZOrder(prev => [...prev.filter(x => x !== s.id), s.id])}
                onMouseEnter={e => setTooltip({ name: s.name, x: e.clientX, y: e.clientY })}
                onMouseMove={e => setTooltip(t => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
                onMouseLeave={() => setTooltip(null)}
              >
                {/* Small states get a wider invisible grab area for fingers */}
                {bboxes[s.id].w < SMALL_PIECE && bboxes[s.id].h < SMALL_PIECE && (
                  <path d={s.path} fill="none" stroke="transparent" strokeWidth={28}
                    strokeLinejoin="round" vectorEffect="non-scaling-stroke" pointerEvents="stroke" />
                )}
                <path
                  className="area-fill"
                  vectorEffect="non-scaling-stroke"
                  d={s.path}
                  fill={fill}
                  stroke={isSelected ? "#e0c97f" : "#0f1b2d"}
                  strokeWidth={isSelected ? "1.5" : "0.8"}
                  strokeLinejoin="round"
                  fillRule="evenodd"
                />
                {showLabels && (() => {
                  const label = fullNames ? s.name : s.abbr;
                  const words = label.split(' ');
                  // Scale font by area: bigger states get bigger text
                  const baseFontSize = labelFontSize(s.area_km2, cfg.labelAreaRange) * nameK;
                  // Full-name multi-line: reduce font slightly to fit
                  const fontSize = fullNames
                    ? (words.length > 2 ? baseFontSize * 0.72 : words.length > 1 ? baseFontSize * 0.82 : baseFontSize)
                    : baseFontSize;
                  const strokeW = Math.max(0.9, fontSize * 0.14);

                  if (fullNames && words.length > 1) {
                    const mid = Math.ceil(words.length / 2);
                    const line1 = words.slice(0, mid).join(' ');
                    const line2 = words.slice(mid).join(' ');
                    const lineH = fontSize * 1.25;
                    return (
                      <text x={s.cx} y={s.cy - lineH * 0.5}
                        textAnchor="middle"
                        fontSize={fontSize} fontFamily="Inter, system-ui, sans-serif"
                        fontWeight="600"
                        fill="white" stroke="rgba(0,0,0,0.6)" strokeWidth={strokeW} strokeLinejoin="round" paintOrder="stroke"
                        style={{ pointerEvents: "none", userSelect: "none" }}>
                        <tspan x={s.cx} dy="0">{line1}</tspan>
                        <tspan x={s.cx} dy={lineH}>{line2}</tspan>
                      </text>
                    );
                  }
                  return (
                    <text x={s.cx} y={s.cy}
                      textAnchor="middle" dominantBaseline="middle"
                      fontSize={fontSize} fontFamily="Inter, system-ui, sans-serif"
                      fontWeight="600"
                      fill="white" stroke="rgba(0,0,0,0.6)" strokeWidth={strokeW} strokeLinejoin="round" paintOrder="stroke"
                      style={{ pointerEvents: "none", userSelect: "none" }}>
                      {label}
                    </text>
                  );
                })()}
                {showCapitals && (
                  <g style={{ pointerEvents: "none" }}>
                    <circle cx={s.cx} cy={s.cy + 4 * zf + 6 * nameK} r={1.8 * textNorm * zf} fill="#e0c97f" opacity="0.9" />
                    <text x={s.cx} y={s.cy + 4 * zf + 6 * nameK + 7.5 * capK}
                      textAnchor="middle" dominantBaseline="middle"
                      fontSize={7 * capK} fontFamily="Inter, sans-serif" fontWeight="500"
                      fill="#e0c97f" stroke="#00000099" strokeWidth={1.5 * capK} paintOrder="stroke"
                      style={{ userSelect: "none" }}>
                      {s.capital}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {regionColour && !quiz.active && <RegionLegend colours={REGION_COLOURS} />}
        {selectedId && !quiz.active && <InfoPanel id={selectedId} cfg={cfg} onClose={() => setSelectedId(null)} />}

        {/* Flash overlay for correct / wrong placement */}
        {flash && (() => {
          const s = states.find(x => x.id === flash.id);
          if (!s) return null;
          const el = pieceRefs.current[flash.id];
          if (!el) return null;
          return (
            <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 600 }}>
              <g transform={el.getAttribute("transform") ?? ""}>
                <path d={s.path} fill={flash.type === 'correct' ? 'rgba(100,220,100,0.35)' : 'rgba(220,60,60,0.45)'}
                  stroke={flash.type === 'correct' ? '#6ddc6d' : '#e04040'}
                  strokeWidth="2" fillRule="evenodd"
                  style={{ animation: "flashPulse 0.42s ease-out forwards" }}
                />
              </g>
            </svg>
          );
        })()}

        {showResults && (
          <QuizResults
            placed={quiz.placed.size}
            total={states.length}
            elapsed={quizElapsed}
            onClose={() => { setShowResults(false); assemble(); setShowLabels(true); setSnapEnabled(true); }}
          />
        )}

        {quiz.active && (
          <div style={{
            position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)",
            padding: "5px 18px", borderRadius: 20,
            background: "rgba(15,52,96,0.9)", border: "1px solid rgba(224,201,127,0.4)",
            color: "#e0c97f", fontSize: "0.75rem",
            pointerEvents: "none", whiteSpace: "nowrap",
            boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
          }}>
            Drag each {cfg.noun} to its correct position on the dot map — snap will lock it in place
          </div>
        )}

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

        <div style={{
          position: "absolute", bottom: 38, right: 12,
          padding: "3px 10px", borderRadius: 4,
          background: "rgba(22,33,62,0.8)", border: "1px solid rgba(58,80,112,0.5)",
          color: "#4a6080", fontSize: "0.68rem", fontFamily: "monospace", pointerEvents: "none",
        }}>{Math.round(view.scale * 100)}%</div>

        <div style={{
          position: "absolute", bottom: 38, left: "50%", transform: "translateX(-50%)",
          padding: "3px 14px", borderRadius: 20,
          background: "rgba(224,201,127,0.12)", border: "1px solid rgba(224,201,127,0.5)",
          color: "#e0c97f", fontSize: "0.72rem", pointerEvents: "none",
          opacity: snapMsg ? 1 : 0, transition: "opacity 0.3s", whiteSpace: "nowrap",
        }}>✓ Snapped to map position</div>

        <div style={{
          position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)",
          padding: "3px 16px", borderRadius: 20,
          background: "rgba(22,33,62,0.7)", border: "1px solid rgba(58,80,112,0.5)",
          color: "#3a5070", fontSize: "0.7rem", pointerEvents: "none", whiteSpace: "nowrap",
        }}>
          {deckOn ? <>Drag the piece from the box onto its outline &bull; {isTouch ? "Drag the background to move the map • Pinch to zoom" : "Drag the background to move the map • Scroll to zoom • Arrow keys change piece"}</> : isTouch ? <>Drag pieces with a finger &bull; Drag the background to move the map &bull; Pinch to zoom &bull; Tap a piece for details</> : <>Scroll to zoom &bull; Drag canvas to pan &bull; Click a piece for details &bull; Double-click to bring to front</>}
        </div>
      </div>
      {deckOn && (
        <PieceDeck key={deckRun} mapKey={cfg.key} noun={cfg.noun} items={deckItems} placed={deckPlaced}
          scale={view.scale} layout={portrait ? "bottom" : "side"}
          onDrop={deckDrop} onRestart={restartDeck} onExit={exitDeck} />
      )}
      </div>

      <style>{`
        @keyframes flashPulse {
          0%   { opacity: 1; }
          60%  { opacity: 0.8; }
          100% { opacity: 0; }
        }
        @keyframes panelIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
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
    <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.74rem", color: "#8899aa", cursor: "pointer", whiteSpace: "nowrap" }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ accentColor: "#e0c97f", cursor: "pointer" }} />
      {label}
    </label>
  );
}

function CtaButton({ onClick, children, secondary }: { onClick: () => void; children: React.ReactNode; secondary?: boolean }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)}
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
