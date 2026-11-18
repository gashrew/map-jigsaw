/**
 * USA — Dark Atlas design
 * Full-viewport interactive jigsaw of US states.
 *
 * Features:
 * - Zoom (mouse wheel / pinch) + pan (drag empty canvas)
 * - Scatter constrained to canvas bounds
 * - State capitals (toggleable)
 * - Info panel on click (capital, region, population, area)
 * - Region colour toggle with legend
 * - Quiz mode with timer and results overlay
 */

import { US_STATES, SVG_HEIGHT, SVG_WIDTH } from "@/lib/usStatesData";
import { useCallback, useEffect, useRef, useState } from "react";

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
function labelFontSize(area_km2: number): number {
  // Scale: tiny states (RI ~4k km²) → 6px, huge states (AK/TX ~700k km²) → 14px
  const minA = 4000, maxA = 700000, minF = 6, maxF = 14;
  const clamped = Math.min(maxA, Math.max(minA, area_km2));
  return minF + (maxF - minF) * Math.log(clamped / minA) / Math.log(maxA / minA);
}

// ─── Region colours ───────────────────────────────────────────────────────────
export const REGION_COLOURS: Record<string, string> = {
  "Northeast": "#5b9bd5",
  "Midwest":   "#4db8a0",
  "South":     "#e07b54",
  "West":      "#8a7ecf",
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
      <div style={{ fontSize: "0.62rem", color: "#4a6080", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, fontFamily: "Inter, sans-serif" }}>Region</div>
      {Object.entries(REGION_COLOURS).map(([region, colour]) => (
        <div key={region} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
          <div style={{ width: 12, height: 12, borderRadius: 2, background: colour, flexShrink: 0 }} />
          <span style={{ fontSize: "0.72rem", color: "#c8d8e8", fontFamily: "Inter, sans-serif", whiteSpace: "nowrap" }}>{region}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Info Panel ───────────────────────────────────────────────────────────────
function InfoPanel({ id, onClose }: { id: string; onClose: () => void }) {
  const state = US_STATES.find(s => s.id === id);
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
        }}>US State · {state.abbr}</span>
      </div>
      <div style={{ padding: "10px 12px" }}>
        <Row label="State capital"    value={state.capital} />
        <Row label="Region"           value={state.region} />
        <Row label="Population (2020)" value={fmtPop(state.pop)} />
        <Row label="Land area"        value={state.area_km2.toLocaleString() + " km²"} />
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
export default function USA() {
  const states = US_STATES;
  const svgW   = SVG_WIDTH;
  const svgH   = SVG_HEIGHT;

  const [showGhost,    setShowGhost]    = useState(true);
  const [showLabels,   setShowLabels]   = useState(true);
  const [showCapitals, setShowCapitals] = useState(false);
  const [regionColour, setRegionColour] = useState(false);
  const [snapEnabled,  setSnapEnabled]  = useState(false);
  const [snapMsg,      setSnapMsg]      = useState(false);
  const [showDotMap,   setShowDotMap]   = useState(false);
  const [fullNames,    setFullNames]    = useState(false);
  const [flash,        setFlash]        = useState<FlashState | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedId,   setSelectedId]   = useState<string | null>(null);
  const [tooltip,      setTooltip]      = useState<{ name: string; x: number; y: number } | null>(null);
  const [zOrder,       setZOrder]       = useState<string[]>(() => states.map(s => s.id));
  const [view,         setView]         = useState<ViewState>({ x: 0, y: 0, scale: 1 });
  const [ghostOff,     setGhostOff]     = useState({ tx: 0, ty: 0 });
  const [quiz, setQuiz] = useState<QuizState>({ active: false, placed: new Set(), startTime: 0, endTime: null });
  const [showResults,  setShowResults]  = useState(false);
  const [quizElapsed,  setQuizElapsed]  = useState(0);
  const [scatterCols,  setScatterCols]  = useState<{ leftCols: number; rightCols: number; thumbW: number; colGap: number; outerPad: number } | null>(null);

  const viewRef      = useRef<ViewState>({ x: 0, y: 0, scale: 1 });
  const canvasRef    = useRef<HTMLDivElement>(null);
  const pieceStates  = useRef<Record<string, PieceState>>({});
  const pieceRefs    = useRef<Record<string, SVGGElement | null>>({});
  const dragging     = useRef<{ id: string; ox: number; oy: number } | null>(null);
  const panning      = useRef<{ ox: number; oy: number; vx: number; vy: number } | null>(null);
  const snapTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pinchRef     = useRef<{ dist: number; scale: number } | null>(null);
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
    const worldTx = (w - svgW) / 2;
    const worldTy = (h - svgH) / 2;
    return { tx: worldTx * v.scale + v.x, ty: worldTy * v.scale + v.y };
  }, [svgW, svgH]);

  useEffect(() => {
    const update = () => setGhostOff(ghostScreenOffset());
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [ghostScreenOffset]);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const { width: w, height: h } = el.getBoundingClientRect();
    const initX = (w - svgW) / 2;
    const initY = (h - svgH) / 2;
    const initView = { x: 0, y: 0, scale: 1 };
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
    const { width: w, height: h } = el.getBoundingClientRect();
    const v = viewRef.current;

    // Target thumbnail height on screen: ~100px so shapes are clearly visible.
    // ps = thumbH / svgH  =>  ps = 100 / 600 = 0.167
    const ps = 0.22;          // gives ~132px tall thumbnails on screen
    const thumbW = svgW * ps; // ~211px
    const thumbH = svgH * ps; // ~132px
    const rowGap = 6;         // px vertical gap between rows
    const colGap = 4;         // px horizontal gap between columns on same side
    const outerPad = 4;       // px from canvas edge

    // How many rows fit on one column on each side?
    const maxRows = Math.floor((h - outerPad * 2 + rowGap) / (thumbH + rowGap));

    // Shuffle and split into left/right halves
    const shuffled = [...states].sort(() => Math.random() - 0.5);
    const half = Math.ceil(shuffled.length / 2);
    const leftItems  = shuffled.slice(0, half);
    const rightItems = shuffled.slice(half);

    // Distribute items into sub-columns (max 2 per side)
    const splitIntoColumns = (items: typeof states) => {
      if (items.length <= maxRows) {
        return [items];  // single column fits
      }
      const col1Count = Math.ceil(items.length / 2);
      return [items.slice(0, col1Count), items.slice(col1Count)];
    };

    const leftCols  = splitIntoColumns(leftItems);
    const rightCols = splitIntoColumns(rightItems);

    // pieceTransform centroid: screenX = (tx + cx*ps) * v.scale + v.x
    // => tx = (targetCX - v.x) / v.scale - cx * ps
    const place = (s: typeof states[0], targetCX: number, targetCY: number) => {
      const tx = (targetCX - v.x) / v.scale - s.cx * ps;
      const ty = (targetCY - v.y) / v.scale - s.cy * ps;
      scatterPositions.current[s.id] = { tx, ty, ps };
      return { tx, ty };
    };

    // Place left side columns (grow rightward from left edge)
    let globalIdx = 0;
    leftCols.forEach((col, ci) => {
      const colCX = outerPad + thumbW / 2 + ci * (thumbW + colGap);
      const totalH = col.length * (thumbH + rowGap) - rowGap;
      const startY = Math.max(outerPad, (h - totalH) / 2);
      col.forEach((s, ri) => {
        const targetCY = startY + ri * (thumbH + rowGap) + thumbH / 2;
        const { tx, ty } = place(s, colCX, targetCY);
        animatePiece(s.id, tx, ty, globalIdx * 10, ps);
        globalIdx++;
      });
    });

    // Place right side columns (grow leftward from right edge)
    rightCols.forEach((col, ci) => {
      const colCX = w - outerPad - thumbW / 2 - ci * (thumbW + colGap);
      const totalH = col.length * (thumbH + rowGap) - rowGap;
      const startY = Math.max(outerPad, (h - totalH) / 2);
      col.forEach((s, ri) => {
        const targetCY = startY + ri * (thumbH + rowGap) + thumbH / 2;
        const { tx, ty } = place(s, colCX, targetCY);
        animatePiece(s.id, tx, ty, globalIdx * 10, ps);
        globalIdx++;
      });
    });

    // Store column layout for divider rendering
    setScatterCols({ leftCols: leftCols.length, rightCols: rightCols.length, thumbW, colGap, outerPad });
  }

  function assemble() {
    const el = canvasRef.current;
    if (!el) return;
    const { width: w, height: h } = el.getBoundingClientRect();
    const tx = (w - svgW) / 2;
    const ty = (h - svgH) / 2;
    states.forEach((s, i) => animatePiece(s.id, tx, ty, i * 10));
    setScatterCols(null);
  }

  function resetView() {
    const newView = { x: 0, y: 0, scale: 1 };
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

  useEffect(() => {
    function onMove(e: MouseEvent | TouchEvent) {
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
            const { width: w, height: h } = el2.getBoundingClientRect();
            const homeTx = (w - svgW) / 2;
            const homeTy = (h - svgH) / 2;
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
                  animatePiece(id, origin.tx, origin.ty);
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

    function onTouchMove(e: TouchEvent) {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        if (pinchRef.current) {
          const ratio = dist / pinchRef.current.dist;
          const v = viewRef.current;
          const newScale = Math.min(5, Math.max(0.3, pinchRef.current.scale * ratio));
          const newView = { ...v, scale: newScale };
          viewRef.current = newView;
          setView(newView);
          requestAnimationFrame(() => applyAllTransforms());
        } else {
          pinchRef.current = { dist, scale: viewRef.current.scale };
        }
      } else {
        pinchRef.current = null;
        onMove(e);
      }
    }

    const canvas = canvasRef.current;
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onUp);
    canvas?.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onUp);
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

  function exitQuiz() {
    if (quizTimerRef.current) { clearInterval(quizTimerRef.current); quizTimerRef.current = null; }
    setQuiz({ active: false, placed: new Set(), startTime: 0, endTime: null });
    setShowResults(false);
    setShowLabels(true);
    setShowDotMap(false);
    setSnapEnabled(false);
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
          <span style={{ fontSize: "1.4rem", lineHeight: 1 }}>🇺🇸</span>
          <div>
            <h1 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "1.05rem", fontWeight: 700, color: "#e0c97f",
              letterSpacing: "0.03em", margin: 0, lineHeight: 1.2,
            }}>United States — Interactive Jigsaw</h1>
            <p style={{ fontSize: "0.68rem", color: "#4a6080", margin: 0, marginTop: 1 }}>
              {states.length} states &bull; US Census 2020 boundary data
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
          {!quiz.active ? (
            <>
              <ToggleLabel label="Ghost map"  checked={showGhost}    onChange={setShowGhost} />
              <ToggleLabel label="Dot map"    checked={showDotMap}   onChange={setShowDotMap} />
              <ToggleLabel label="Labels"     checked={showLabels}   onChange={setShowLabels} />
              <ToggleLabel label="Full names" checked={fullNames}    onChange={setFullNames} />
              <ToggleLabel label="Capitals"   checked={showCapitals} onChange={setShowCapitals} />
              <ToggleLabel label="By region"  checked={regionColour} onChange={setRegionColour} />
              <Divider />
              <CtaButton onClick={scatter}>Scatter</CtaButton>
              <CtaButton onClick={assemble}>Assemble</CtaButton>
              <CtaButton onClick={resetView} secondary>Reset view</CtaButton>
              <Divider />
              <ToggleLabel label="Snap" checked={snapEnabled} onChange={setSnapEnabled} />
              <Divider />
              <CtaButton onClick={startQuiz}>Quiz mode</CtaButton>
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

      {/* ── Canvas ── */}
      <div
        ref={canvasRef}
        style={{ flex: 1, position: "relative", overflow: "hidden", cursor: "default" }}
        onMouseDown={startPan}
      >
        {/* Column divider lines shown when scattered */}
        {scatterCols && (
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 5 }}>
            {/* Left side: vertical line after the last left column */}
            <div style={{
              position: "absolute",
              left: scatterCols.outerPad + scatterCols.leftCols * (scatterCols.thumbW + scatterCols.colGap) + 2,
              top: 0, bottom: 0,
              width: 1,
              background: "rgba(224,201,127,0.25)",
            }} />
            {/* Right side: vertical line before the first right column */}
            <div style={{
              position: "absolute",
              right: scatterCols.outerPad + scatterCols.rightCols * (scatterCols.thumbW + scatterCols.colGap) + 2,
              top: 0, bottom: 0,
              width: 1,
              background: "rgba(224,201,127,0.25)",
            }} />
            {/* If 2 sub-columns on left, add inner divider */}
            {scatterCols.leftCols > 1 && (
              <div style={{
                position: "absolute",
                left: scatterCols.outerPad + scatterCols.thumbW + scatterCols.colGap / 2,
                top: 0, bottom: 0,
                width: 1,
                background: "rgba(224,201,127,0.12)",
              }} />
            )}
            {/* If 2 sub-columns on right, add inner divider */}
            {scatterCols.rightCols > 1 && (
              <div style={{
                position: "absolute",
                right: scatterCols.outerPad + scatterCols.thumbW + scatterCols.colGap / 2,
                top: 0, bottom: 0,
                width: 1,
                background: "rgba(224,201,127,0.12)",
              }} />
            )}
          </div>
        )}

        {/* Ghost reference */}
        {showGhost && (
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
            <g transform={`translate(${ghostOff.tx},${ghostOff.ty}) scale(${view.scale})`}>
              {states.map(s => (
                <path key={s.id} d={s.path} fill="none"
                  stroke="#3a5070" strokeWidth="0.7" strokeDasharray="3,3" fillRule="evenodd" />
              ))}
            </g>
          </svg>
        )}

        {/* Dot map — centroid targets only */}
        {showDotMap && (
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
            <g transform={`translate(${ghostOff.tx},${ghostOff.ty}) scale(${view.scale})`}>
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
                      <text x={s.cx} y={s.cy + 10}
                        textAnchor="middle" dominantBaseline="middle"
                        fontSize="5" fontFamily="Inter, sans-serif"
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
                style={{ cursor: "grab" }}
                onMouseDown={e => startDrag(e, s.id)}
                onTouchStart={e => startDrag(e, s.id)}
                onDoubleClick={() => setZOrder(prev => [...prev.filter(x => x !== s.id), s.id])}
                onMouseEnter={e => setTooltip({ name: s.name, x: e.clientX, y: e.clientY })}
                onMouseMove={e => setTooltip(t => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
                onMouseLeave={() => setTooltip(null)}
              >
                <path
                  className="area-fill"
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
                  const baseFontSize = labelFontSize(s.area_km2);
                  // Full-name multi-line: reduce font slightly to fit
                  const fontSize = fullNames
                    ? (words.length > 2 ? baseFontSize * 0.72 : words.length > 1 ? baseFontSize * 0.82 : baseFontSize)
                    : baseFontSize;
                  const strokeW = Math.max(2, fontSize * 0.28);

                  if (fullNames && words.length > 1) {
                    const mid = Math.ceil(words.length / 2);
                    const line1 = words.slice(0, mid).join(' ');
                    const line2 = words.slice(mid).join(' ');
                    const lineH = fontSize * 1.25;
                    return (
                      <text x={s.cx} y={s.cy - lineH * 0.5}
                        textAnchor="middle"
                        fontSize={fontSize} fontFamily="'Playfair Display', Georgia, serif"
                        fontWeight="700"
                        fill="white" stroke="rgba(0,0,0,0.75)" strokeWidth={strokeW} paintOrder="stroke"
                        style={{ pointerEvents: "none", userSelect: "none" }}>
                        <tspan x={s.cx} dy="0">{line1}</tspan>
                        <tspan x={s.cx} dy={lineH}>{line2}</tspan>
                      </text>
                    );
                  }
                  return (
                    <text x={s.cx} y={s.cy}
                      textAnchor="middle" dominantBaseline="middle"
                      fontSize={fontSize} fontFamily="'Playfair Display', Georgia, serif"
                      fontWeight="700"
                      fill="white" stroke="rgba(0,0,0,0.75)" strokeWidth={strokeW} paintOrder="stroke"
                      style={{ pointerEvents: "none", userSelect: "none" }}>
                      {label}
                    </text>
                  );
                })()}
                {showCapitals && (
                  <g style={{ pointerEvents: "none" }}>
                    <circle cx={s.cx} cy={s.cy + 10} r="1.8" fill="#e0c97f" opacity="0.9" />
                    <text x={s.cx} y={s.cy + 17}
                      textAnchor="middle" dominantBaseline="middle"
                      fontSize="5.5" fontFamily="Inter, sans-serif"
                      fill="#e0c97f" stroke="#00000099" strokeWidth="1.5" paintOrder="stroke"
                      style={{ userSelect: "none" }}>
                      {s.capital}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {regionColour && !quiz.active && <RegionLegend />}
        {selectedId && !quiz.active && <InfoPanel id={selectedId} onClose={() => setSelectedId(null)} />}

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
            onClose={() => { setShowResults(false); assemble(); setShowLabels(true); setSnapEnabled(false); }}
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
            Drag each state to its correct position on the dot map — snap will lock it in place
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
          Scroll to zoom &bull; Drag canvas to pan &bull; Click a piece for details &bull; Double-click to bring to front
        </div>
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
