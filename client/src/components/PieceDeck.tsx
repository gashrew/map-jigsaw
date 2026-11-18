/**
 * "One at a time" quiz: a box beside the map shows one piece at a time.
 * Drag it onto the map; skip forward or back; pick from the strip of pieces
 * still to do; choose the order they come in. Timed, with mistakes counted
 * and a best time kept on this device.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import type { BBox } from "@/lib/touch";

export interface DeckItem {
  id: string;
  name: string;
  path: string;
  colour: string;
  bbox: BBox;
  area: number;
  region?: string;
}

type SortMode = "random" | "az" | "largest" | "smallest" | "region";
const SORT_LABELS: Record<SortMode, string> = {
  random: "Random", az: "A–Z", largest: "Largest first", smallest: "Smallest first", region: "By region",
};

/** Pieces smaller than this on screen get a ring drawn round them, of this radius. */
export const TINY_PX = 20, RING_PX = 18;
const GOLD = "#e0c97f", MUTED = "#6a80a0", PANEL = "#16213e", EDGE = "rgba(224,201,127,0.25)";

function load<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch { return fallback; }
}
function save(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ }
}
const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

interface Props {
  mapKey: string;
  noun: string;                 // "county" / "state"
  items: DeckItem[];
  placed: Set<string>;
  scale: number;                // the map's current zoom, so a dragged piece matches the map
  layout: "side" | "bottom";
  /** Drop the piece with its bounding box's top-left at this screen point. True if correct. */
  onDrop: (id: string, left: number, top: number) => boolean;
  onRestart: () => void;
  onExit: () => void;
}

export default function PieceDeck({ mapKey, noun, items, placed, scale, layout, onDrop, onRestart, onExit }: Props) {
  const [sort, setSort] = useState<SortMode>(() => load(`mapjigsaw-deck-sort`, "random"));
  const [showName, setShowName] = useState<boolean>(() => load(`mapjigsaw-deck-names`, true));
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [shake, setShake] = useState(0);
  const [drag, setDrag] = useState<{ id: string; left: number; top: number } | null>(null);
  const startRef = useRef(Date.now());
  const bestKey = `mapjigsaw-best-${mapKey}-${showName ? "names" : "shapes"}`;
  const [best, setBest] = useState<number | null>(() => load(bestKey, null));
  useEffect(() => setBest(load(bestKey, null)), [bestKey]);

  const total = items.length;
  const done = placed.size === total;

  // Timer runs until every piece is placed
  useEffect(() => {
    if (done) return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 250);
    return () => clearInterval(t);
  }, [done]);

  // Record a best time once, at the moment of finishing
  const finishedRef = useRef(false);
  useEffect(() => {
    if (done && !finishedRef.current) {
      finishedRef.current = true;
      const secs = Math.floor((Date.now() - startRef.current) / 1000);
      setElapsed(secs);
      if (best === null || secs < best) { setBest(secs); save(bestKey, secs); }
    }
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  // A fixed shuffle for this round, so "Random" doesn't reshuffle as you play
  const shuffle = useMemo(() => {
    const m = new Map<string, number>();
    items.forEach(i => m.set(i.id, Math.random()));
    return m;
  }, [items]);

  const order = useMemo(() => {
    const list = [...items];
    const by = {
      random: (a: DeckItem, b: DeckItem) => shuffle.get(a.id)! - shuffle.get(b.id)!,
      az: (a: DeckItem, b: DeckItem) => a.name.localeCompare(b.name),
      largest: (a: DeckItem, b: DeckItem) => b.area - a.area,
      smallest: (a: DeckItem, b: DeckItem) => a.area - b.area,
      region: (a: DeckItem, b: DeckItem) => (a.region ?? "").localeCompare(b.region ?? "") || a.name.localeCompare(b.name),
    }[sort];
    return list.sort(by);
  }, [items, sort, shuffle]);

  const remaining = useMemo(() => order.filter(i => !placed.has(i.id)), [order, placed]);
  const current = remaining.find(i => i.id === currentId) ?? remaining[0] ?? null;
  const idx = current ? remaining.indexOf(current) : -1;

  // When the current piece is placed, carry on with the one after it
  const lastOrder = useRef<string[]>([]);
  useEffect(() => {
    if (currentId && placed.has(currentId)) {
      const pos = lastOrder.current.indexOf(currentId);
      const next = lastOrder.current.slice(pos + 1).concat(lastOrder.current.slice(0, pos)).find(id => !placed.has(id));
      setCurrentId(next ?? null);
    }
    lastOrder.current = order.map(i => i.id);
  }, [placed, order, currentId]);

  function step(d: number) {
    if (!remaining.length) return;
    const n = remaining[(idx + d + remaining.length) % remaining.length];
    setCurrentId(n.id);
  }

  // Arrow keys move through the pieces on a computer
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); step(1); }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); step(-1); }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });

  // Keep the current piece visible in the strip
  const stripRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!current) return;
    stripRef.current?.querySelector(`[data-thumb="${CSS.escape(current.id)}"]`)
      ?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [current?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Dragging the big piece out onto the map ──
  const bigRef = useRef<SVGSVGElement>(null);
  function pickUp(e: React.PointerEvent) {
    if (!current || !bigRef.current) return;
    e.preventDefault();
    const ctm = bigRef.current.getScreenCTM();
    if (!ctm) return;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    const b = current.bbox;
    // Keep the same point of the piece under the pointer; on a touchscreen lift
    // it above the finger so you can see where it's going.
    const lift = e.pointerType === "touch" ? 50 : 0;
    const gx = (p.x - b.minX) * scale, gy = (p.y - b.minY) * scale + lift;
    const id = current.id;
    const move = (ev: PointerEvent) => setDrag({ id, left: ev.clientX - gx, top: ev.clientY - gy });
    move(e.nativeEvent);
    const up = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      setDrag(null);
      if (ev.type === "pointercancel") return;
      const left = ev.clientX - gx, top = ev.clientY - gy;
      // Dropped back on the box: no attempt, no penalty
      const box = boxRef.current?.getBoundingClientRect();
      if (box && ev.clientX >= box.left && ev.clientX <= box.right && ev.clientY >= box.top && ev.clientY <= box.bottom) return;
      if (!onDrop(id, left, top)) { setMistakes(m => m + 1); setShake(s => s + 1); }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  }

  const boxRef = useRef<HTMLDivElement>(null);
  const side = layout === "side";
  const dragging = drag ? items.find(i => i.id === drag.id) : null;

  const stats = (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
      <span style={{ fontFamily: "monospace", fontSize: "1.3rem", color: GOLD }}>{fmt(elapsed)}</span>
      <span style={{ fontSize: "0.8rem", color: "#c8d4e8" }}><strong style={{ color: GOLD }}>{placed.size}</strong> / {total} placed</span>
      <span style={{ fontSize: "0.75rem", color: mistakes ? "#e08080" : MUTED }}>{mistakes} {mistakes === 1 ? "mistake" : "mistakes"}</span>
    </div>
  );

  const controls = (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <label style={{ fontSize: "0.75rem", color: MUTED, display: "flex", alignItems: "center", gap: 6 }}>
        Order
        <select value={sort} onChange={e => { const v = e.target.value as SortMode; setSort(v); save("mapjigsaw-deck-sort", v); setCurrentId(null); }}
          style={{ background: "#0f1b2d", color: "#c8d4e8", border: `1px solid ${EDGE}`, borderRadius: 6, padding: "5px 6px", fontSize: "0.8rem" }}>
          {(Object.keys(SORT_LABELS) as SortMode[]).filter(k => k !== "region" || items.some(i => i.region)).map(k =>
            <option key={k} value={k}>{SORT_LABELS[k]}</option>)}
        </select>
      </label>
      <label style={{ fontSize: "0.75rem", color: MUTED, display: "flex", alignItems: "center", gap: 5, cursor: "pointer" }}>
        <input type="checkbox" checked={showName} style={{ accentColor: GOLD, width: 16, height: 16 }}
          onChange={e => { setShowName(e.target.checked); save("mapjigsaw-deck-names", e.target.checked); }} />
        Show name
      </label>
    </div>
  );

  const big = (
    <div style={{ flex: 1, minHeight: side ? 170 : 0, display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
      <div onPointerDown={pickUp}
        style={{
          flex: 1, minHeight: 0, position: "relative", borderRadius: 10, border: `1px dashed ${EDGE}`,
          background: "rgba(255,255,255,0.025)", touchAction: "none", cursor: current ? "grab" : "default",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
        {current ? (
          <svg ref={bigRef} key={current.id + shake}
            viewBox={`${current.bbox.minX} ${current.bbox.minY} ${Math.max(current.bbox.w, 1)} ${Math.max(current.bbox.h, 1)}`}
            preserveAspectRatio="xMidYMid meet"
            style={{
              width: "84%", height: "84%", overflow: "visible", opacity: drag ? 0.25 : 1,
              animation: shake ? "deckShake 0.4s" : undefined,
            }}>
            <path d={current.path} fill={current.colour} stroke="#0f1b2d" strokeWidth={1.2}
              vectorEffect="non-scaling-stroke" fillRule="evenodd" />
          </svg>
        ) : (
          <div style={{ color: GOLD, fontSize: "0.9rem" }}>All placed!</div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <NavButton onClick={() => step(-1)} disabled={remaining.length < 2} label="Previous">‹</NavButton>
        <div style={{ flex: 1, textAlign: "center", minWidth: 0 }}>
          <div style={{ color: "#fff", fontWeight: 600, fontSize: "0.95rem", lineHeight: 1.2, overflowWrap: "anywhere" }}>
            {current ? (showName ? current.name : `Which ${noun}?`) : " "}
          </div>
          <div style={{ color: MUTED, fontSize: "0.7rem" }}>{current ? `${idx + 1} of ${remaining.length} left` : ""}</div>
        </div>
        <NavButton onClick={() => step(1)} disabled={remaining.length < 2} label="Next">›</NavButton>
      </div>
    </div>
  );

  const strip = (
    <div ref={stripRef} style={{
      display: "grid", gap: 5,
      ...(side ? { gridTemplateColumns: "repeat(auto-fill, minmax(52px, 1fr))" }
               : { gridAutoFlow: "column", gridTemplateRows: "repeat(2, 44px)", gridAutoColumns: "52px" }),
      overflowY: side ? "auto" : "hidden", overflowX: side ? "hidden" : "auto",
      flex: side ? "0 1 38%" : "0 0 auto", minHeight: side ? 70 : undefined, padding: 2,
      touchAction: side ? "pan-y" : "pan-x", WebkitOverflowScrolling: "touch",
    }}>
      {remaining.map(i => {
        const on = current?.id === i.id;
        return (
          <button key={i.id} data-thumb={i.id} title={showName ? i.name : undefined} onClick={() => setCurrentId(i.id)}
            style={{
              flex: "0 0 52px", height: 44, padding: 3, borderRadius: 6, cursor: "pointer",
              background: on ? "rgba(224,201,127,0.15)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${on ? GOLD : "rgba(58,80,112,0.6)"}`,
            }}>
            <svg viewBox={`${i.bbox.minX} ${i.bbox.minY} ${Math.max(i.bbox.w, 1)} ${Math.max(i.bbox.h, 1)}`}
              preserveAspectRatio="xMidYMid meet" style={{ width: "100%", height: "100%", pointerEvents: "none" }}>
              <path d={i.path} fill={i.colour} fillRule="evenodd" />
            </svg>
          </button>
        );
      })}
    </div>
  );

  const footer = (
    <div style={{ display: "flex", gap: 8, justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: "0.72rem", color: MUTED }}>{best !== null ? `Best: ${fmt(best)}` : "No best time yet"}</span>
      <span style={{ display: "flex", gap: 6 }}>
        <SmallButton onClick={onRestart}>Restart</SmallButton>
        <SmallButton onClick={onExit}>Exit</SmallButton>
      </span>
    </div>
  );

  return (
    <div ref={boxRef} style={{
      background: PANEL, display: "flex", flexDirection: "column", gap: 10, padding: 12, position: "relative",
      fontFamily: "Inter, system-ui, sans-serif", userSelect: "none", WebkitUserSelect: "none",
      ...(side
        ? { width: 300, flexShrink: 0, borderLeft: `1px solid ${EDGE}` }
        : { height: 270, flexShrink: 0, borderTop: `1px solid ${EDGE}` }),
    }}>
      {side ? (
        <>
          {stats}{controls}{big}{strip}{footer}
        </>
      ) : (
        <div style={{ display: "flex", gap: 12, flex: 1, minHeight: 0 }}>
          <div style={{ flex: "0 0 42%", display: "flex", minWidth: 0 }}>{big}</div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
            {stats}{controls}{strip}<div style={{ flex: 1 }} />{footer}
          </div>
        </div>
      )}

      {done && (
        <div style={{
          position: "absolute", inset: 0, background: "rgba(15,27,45,0.94)", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 10, textAlign: "center", padding: 16,
        }}>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.4rem", color: GOLD }}>Complete!</div>
          <div style={{ color: "#c8d4e8", fontSize: "0.9rem" }}>
            All {total} placed in <strong>{fmt(elapsed)}</strong><br />with {mistakes} {mistakes === 1 ? "mistake" : "mistakes"}
          </div>
          {best !== null && <div style={{ color: best === elapsed ? GOLD : MUTED, fontSize: "0.8rem" }}>
            {best === elapsed ? "★ New best time" : `Best time: ${fmt(best)}`}
          </div>}
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <SmallButton onClick={onRestart}>Play again</SmallButton>
            <SmallButton onClick={onExit}>Exit</SmallButton>
          </div>
        </div>
      )}

      {/* The piece being dragged, drawn at the map's scale so it fits where it goes */}
      {drag && dragging && (
        <svg style={{
          position: "fixed", left: drag.left, top: drag.top, zIndex: 9999, pointerEvents: "none", overflow: "visible",
          width: Math.max(dragging.bbox.w, 1) * scale, height: Math.max(dragging.bbox.h, 1) * scale,
          filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.7))",
        }} viewBox={`${dragging.bbox.minX} ${dragging.bbox.minY} ${Math.max(dragging.bbox.w, 1)} ${Math.max(dragging.bbox.h, 1)}`}>
          <path d={dragging.path} fill={dragging.colour} stroke="white" strokeWidth={1.5}
            vectorEffect="non-scaling-stroke" fillRule="evenodd" opacity={0.9} />
          {/* Tiny pieces (e.g. DC) get a ring so you can see what you're carrying */}
          {Math.max(dragging.bbox.w, dragging.bbox.h) * scale < TINY_PX && (
            <circle cx={dragging.bbox.cx} cy={dragging.bbox.cy} r={RING_PX / scale}
              fill="rgba(224,201,127,0.18)" stroke={GOLD} strokeWidth={2} vectorEffect="non-scaling-stroke" />
          )}
        </svg>
      )}

      <style>{`@keyframes deckShake { 0%,100% { transform: translateX(0) } 20%,60% { transform: translateX(-8px) } 40%,80% { transform: translateX(8px) } }`}</style>
    </div>
  );
}

function NavButton({ onClick, disabled, label, children }: { onClick: () => void; disabled?: boolean; label: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled} aria-label={label} style={{
      width: 44, height: 44, borderRadius: 8, fontSize: "1.6rem", lineHeight: 1, cursor: disabled ? "default" : "pointer",
      background: "#0f3460", color: disabled ? "#3a5070" : GOLD, border: `1px solid ${EDGE}`, flexShrink: 0,
    }}>{children}</button>
  );
}

function SmallButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      padding: "7px 14px", borderRadius: 6, fontSize: "0.8rem", cursor: "pointer", minHeight: 36,
      background: "#0f3460", color: GOLD, border: `1px solid ${EDGE}`,
    }}>{children}</button>
  );
}
