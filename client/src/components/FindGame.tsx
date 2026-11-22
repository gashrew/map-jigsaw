/**
 * "Find it" quiz: a place's name appears and the player taps where it is on the map.
 * A correct tap snaps the piece in; a wrong one costs points and names what was tapped.
 * After three wrong taps the place is shown and the game moves on.
 */
import { useEffect, useRef, useState } from "react";
import type { MapConfig, MapPiece } from "@/lib/mapTypes";

export type FindLevel = "easy" | "medium" | "hard";
export const LEVELS: { id: FindLevel; label: string; note: string }[] = [
  { id: "easy",   label: "Easy",   note: "All borders shown" },
  { id: "medium", label: "Medium", note: "Coastline and outer edge only" },
  { id: "hard",   label: "Hard",   note: "Dots only, no borders" },
];
export const POINTS = 100;      // a correct tap
export const WRONG = 25;        // taken off for a wrong tap
export const MAX_TRIES = 3;     // wrong taps before the place is shown
const PAR: Record<FindLevel, number> = { easy: 5, medium: 7, hard: 9 }; // seconds per place for the time bonus
const MIN_ACC_FOR_BONUS = 0.7;

export interface FindRound { key: string; label: string; ids: string[] }
export interface FindState {
  level: FindLevel; round: FindRound;
  queue: string[]; idx: number; tries: number;
  found: Set<string>;
  results: Record<string, { tries: number; revealed: boolean }>;
  wrong: number; points: number;
  start: number; end: number | null;
}
export interface FindMark { id: string | null; kind: "right" | "wrong" | "reveal"; text: string; n: number }

const GOLD = "#e0c97f", MUTED = "#8899aa", PANEL = "#101b32";

function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
}

export function roundsFor(pieces: MapPiece[]): FindRound[] {
  const all = pieces.map(p => p.id), n = all.length;
  const r: FindRound[] = [{ key: "all", label: `All ${n}`, ids: all }];
  if (n > 14) r.push({ key: "r10", label: "10 at random", ids: all });
  if (n > 30) r.push({ key: "r20", label: "20 at random", ids: all });
  const regions = Array.from(new Set(pieces.map(p => p.region)));
  if (regions.length > 1) for (const reg of regions) {
    const ids = pieces.filter(p => p.region === reg).map(p => p.id);
    if (ids.length >= 3 && ids.length < n) r.push({ key: "region:" + reg, label: `${reg} (${ids.length})`, ids });
  }
  return r;
}

export function finalScore(g: FindState) {
  const n = g.queue.length;
  const secs = Math.round(((g.end ?? Date.now()) - g.start) / 1000);
  const firstTry = Object.values(g.results).filter(r => r.tries === 0 && !r.revealed).length;
  const acc = n ? firstTry / n : 0;
  const base = Math.max(0, g.points);
  const bonus = acc >= MIN_ACC_FOR_BONUS ? Math.max(0, Math.round((PAR[g.level] * n - secs) * 2)) : 0;
  const total = base + bonus;
  const pct = n ? total / (POINTS * n) : 0;
  const stars = pct >= 1 ? 5 : pct >= 0.85 ? 4 : pct >= 0.7 ? 3 : pct >= 0.5 ? 2 : 1;
  return { n, secs, firstTry, acc, base, bonus, total, stars, par: PAR[g.level] * n };
}

const bestKey = (map: string, level: FindLevel, round: string) => `find:${map}:${level}:${round}`;
export function readBest(map: string, level: FindLevel, round: string): { total: number; secs: number; acc: number } | null {
  try { const s = localStorage.getItem(bestKey(map, level, round)); return s ? JSON.parse(s) : null; } catch { return null; }
}
function writeBest(map: string, level: FindLevel, round: string, v: { total: number; secs: number; acc: number }) {
  try { localStorage.setItem(bestKey(map, level, round), JSON.stringify(v)); } catch { /* ignore */ }
}

export const fmtTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

// ─── Game state ───────────────────────────────────────────────────────────────
export function useFindGame(pieces: MapPiece[], mapKey: string, noun: string) {
  const [game, setGameState] = useState<FindState | null>(null);
  const gameRef = useRef<FindState | null>(null);
  const setGame = (g: FindState | null) => { gameRef.current = g; setGameState(g); };
  const [mark, setMark] = useState<FindMark | null>(null);
  const [newBest, setNewBest] = useState(false);
  const busy = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [, tick] = useState(0);
  const nameOf = (id: string) => pieces.find(p => p.id === id)?.name ?? id;
  const later = (ms: number, f: () => void) => { timers.current.push(setTimeout(f, ms)); };
  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  // The clock ticks once a second while a game is running
  useEffect(() => {
    if (!game || game.end) return;
    const t = setInterval(() => tick(x => x + 1), 1000);
    return () => clearInterval(t);
  }, [game?.start, game?.end]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => clearTimers, []);

  function start(level: FindLevel, round: FindRound) {
    clearTimers(); busy.current = false; setMark(null); setNewBest(false);
    const queue = shuffle(round.ids).slice(0, round.key === "r10" ? 10 : round.key === "r20" ? 20 : undefined);
    setGame({ level, round, queue, idx: 0, tries: 0, found: new Set(), results: {}, wrong: 0, points: 0, start: Date.now(), end: null });
  }

  function advance() {
    const g = gameRef.current; if (!g) return;
    busy.current = false;
    if (g.idx + 1 >= g.queue.length) {
      const done = { ...g, end: Date.now() };
      setGame(done);
      const s = finalScore(done), prev = readBest(mapKey, g.level, g.round.key);
      if (!prev || s.total > prev.total) { writeBest(mapKey, g.level, g.round.key, { total: s.total, secs: s.secs, acc: s.acc }); setNewBest(true); }
      return;
    }
    setGame({ ...g, idx: g.idx + 1, tries: 0 });
  }

  function place(g: FindState, id: string, revealed: boolean, extra: Partial<FindState> = {}) {
    const found = new Set(g.found); found.add(id);
    setGame({ ...g, ...extra, found, results: { ...g.results, [id]: { tries: extra.tries ?? g.tries, revealed } } });
  }

  // hit: the piece the tap landed in (or null for sea); near: close enough to a small target to count
  function guess(hit: string | null, near: boolean) {
    const g = gameRef.current;
    if (!g || g.end || busy.current) return;
    const target = g.queue[g.idx];
    if (hit === target || near) {
      busy.current = true;
      place(g, target, false, { points: g.points + POINTS });
      setMark({ id: target, kind: "right", text: `✓ ${nameOf(target)}  +${POINTS}`, n: Date.now() });
      later(650, advance);
      return;
    }
    const tries = g.tries + 1;
    const where = hit ? (g.found.has(hit) ? `That's ${nameOf(hit)}, already found` : `That's ${nameOf(hit)}`) : `That's not on any ${noun}`;
    if (tries >= MAX_TRIES) {
      busy.current = true;
      place(g, target, true, { tries, wrong: g.wrong + 1, points: g.points - WRONG });
      setMark({ id: target, kind: "reveal", text: `${where}. Here is ${nameOf(target)}`, n: Date.now() });
      later(1900, advance);
    } else {
      setGame({ ...g, tries, wrong: g.wrong + 1, points: g.points - WRONG });
      setMark({ id: hit, kind: "wrong", text: `✗ ${where}  −${WRONG}  (${MAX_TRIES - tries} ${MAX_TRIES - tries === 1 ? "try" : "tries"} left)`, n: Date.now() });
    }
  }

  // "Show me": counts as a miss with no further penalty
  function reveal() {
    const g = gameRef.current;
    if (!g || g.end || busy.current) return;
    const target = g.queue[g.idx];
    busy.current = true;
    place(g, target, true);
    setMark({ id: target, kind: "reveal", text: `Here is ${nameOf(target)}`, n: Date.now() });
    later(1600, advance);
  }

  function stop() { clearTimers(); busy.current = false; setGame(null); setMark(null); }

  // Fade the message after a while
  useEffect(() => {
    if (!mark) return;
    const t = setTimeout(() => setMark(m => (m && m.n === mark.n ? null : m)), mark.kind === "wrong" ? 1800 : 1900);
    return () => clearTimeout(t);
  }, [mark]);

  return { game, mark, newBest, start, guess, reveal, stop, target: game && !game.end ? game.queue[game.idx] : null, nameOf };
}

// ─── Setup ────────────────────────────────────────────────────────────────────
export function FindSetup({ cfg, onStart, onClose }: { cfg: MapConfig; onStart: (l: FindLevel, r: FindRound) => void; onClose: () => void }) {
  const rounds = roundsFor(cfg.pieces);
  const [level, setLevel] = useState<FindLevel>(() => { try { return (localStorage.getItem("findLevel") as FindLevel) || "easy"; } catch { return "easy"; } });
  const [roundKey, setRoundKey] = useState(rounds.length > 1 && cfg.pieces.length > 25 ? "r10" : "all");
  const round = rounds.find(r => r.key === roundKey) ?? rounds[0];
  const best = readBest(cfg.key, level, round.key);
  const go = () => { try { localStorage.setItem("findLevel", level); } catch { /* ignore */ } onStart(level, round); };
  return (
    <Modal onClose={onClose} label="Find it quiz">
      <h2 style={h2}>Find it</h2>
      <p style={{ fontSize: "0.85rem", lineHeight: 1.55, margin: "0 0 14px", color: "#c8d4e0" }}>
        A name appears: tap where that {cfg.noun} is. A correct tap scores {POINTS}, each wrong tap loses {WRONG}. After {MAX_TRIES} wrong
        taps you'll be shown where it is. Finish quickly with good accuracy for a time bonus.
      </p>
      <div style={lab}>Level</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 14 }}>
        {LEVELS.map(l => (
          <button key={l.id} onClick={() => setLevel(l.id)} style={choice(level === l.id)}>
            <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{l.label}</div>
            <div style={{ fontSize: "0.65rem", color: level === l.id ? "#c8b56a" : MUTED, marginTop: 2 }}>{l.note}</div>
          </button>
        ))}
      </div>
      <div style={lab}>Which places</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
        {rounds.map(r => (
          <button key={r.key} onClick={() => setRoundKey(r.key)} style={{ ...choice(roundKey === r.key), padding: "6px 12px", fontSize: "0.8rem" }}>{r.label}</button>
        ))}
      </div>
      <div style={{ fontSize: "0.75rem", color: MUTED, marginBottom: 14, minHeight: "1.2em" }}>
        {best ? <>Your best here: <strong style={{ color: GOLD }}>{best.total.toLocaleString()}</strong> ({Math.round(best.acc * 100)}% first time, {fmtTime(best.secs)})</> : "No score yet for this level and set of places."}
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button onClick={onClose} style={btn(false)}>Cancel</button>
        <button onClick={go} style={btn(true)}>Start</button>
      </div>
    </Modal>
  );
}

// ─── During the game ──────────────────────────────────────────────────────────
export function FindHud({ game, name, mark, onReveal, onExit }: { game: FindState; name: string; mark: FindMark | null; onReveal: () => void; onExit: () => void }) {
  const secs = Math.round(((game.end ?? Date.now()) - game.start) / 1000);
  const markColour = mark?.kind === "right" ? "#6ddc6d" : mark?.kind === "wrong" ? "#ff8a80" : "#ffb74d";
  return (
    <div data-ui style={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", zIndex: 700, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, maxWidth: "calc(100% - 20px)" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 14, padding: "8px 14px", borderRadius: 10,
        background: "rgba(16,27,50,0.95)", border: "1px solid rgba(224,201,127,0.45)", boxShadow: "0 4px 18px rgba(0,0,0,0.6)",
        fontFamily: "Inter, sans-serif",
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: "0.6rem", color: MUTED, textTransform: "uppercase", letterSpacing: "0.1em" }}>Find {game.idx + 1} of {game.queue.length}</div>
          <div data-find-target style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.3rem", color: GOLD, fontWeight: 700, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{game.end ? "Finished" : name}</div>
          {game.tries > 0 && !game.end && <div style={{ fontSize: "0.65rem", color: "#ff8a80" }}>{MAX_TRIES - game.tries} {MAX_TRIES - game.tries === 1 ? "try" : "tries"} left</div>}
        </div>
        <div style={{ textAlign: "right", fontSize: "0.75rem", color: MUTED, lineHeight: 1.5, whiteSpace: "nowrap" }}>
          <div>Score <strong style={{ color: GOLD }}>{Math.max(0, game.points)}</strong></div>
          <div style={{ fontFamily: "monospace" }}>{fmtTime(secs)}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <button onClick={onReveal} style={{ ...btn(false), padding: "3px 10px", fontSize: "0.7rem" }}>Show me</button>
          <button onClick={onExit} style={{ ...btn(false), padding: "3px 10px", fontSize: "0.7rem" }}>Exit</button>
        </div>
      </div>
      {mark && (
        <div key={mark.n} style={{
          padding: "4px 14px", borderRadius: 20, background: "rgba(16,27,50,0.95)", border: `1px solid ${markColour}`,
          color: markColour, fontSize: "0.8rem", fontFamily: "Inter, sans-serif", whiteSpace: "nowrap", pointerEvents: "none",
          animation: "panelIn 0.18s ease-out",
        }}>{mark.text}</div>
      )}
    </div>
  );
}

// ─── Results ──────────────────────────────────────────────────────────────────
export function FindResults({ game, nameOf, newBest, mapKey, onAgain, onClose }: {
  game: FindState; nameOf: (id: string) => string; newBest: boolean; mapKey: string; onAgain: () => void; onClose: () => void;
}) {
  const s = finalScore(game);
  const best = readBest(mapKey, game.level, game.round.key);
  const missed = game.queue.filter(id => game.results[id] && (game.results[id].tries > 0 || game.results[id].revealed));
  const level = LEVELS.find(l => l.id === game.level)?.label;
  return (
    <Modal onClose={onClose} label="Quiz results">
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "0.7rem", color: MUTED, textTransform: "uppercase", letterSpacing: "0.1em" }}>{level} · {game.round.label}</div>
        <div style={{ fontSize: "1.9rem", color: GOLD, letterSpacing: "0.1em", margin: "4px 0" }} aria-label={`${s.stars} stars`}>
          {"★".repeat(s.stars)}<span style={{ color: "#2a3a55" }}>{"★".repeat(5 - s.stars)}</span>
        </div>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "2.2rem", color: GOLD, fontWeight: 700, lineHeight: 1 }}>{s.total.toLocaleString()}</div>
        <div style={{ fontSize: "0.75rem", color: newBest ? "#6ddc6d" : MUTED, marginTop: 4 }}>
          {newBest ? "New personal best!" : best ? `Your best: ${best.total.toLocaleString()}` : ""}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, margin: "16px 0" }}>
        <Stat label="First time" value={`${Math.round(s.acc * 100)}%`} sub={`${s.firstTry} of ${s.n}`} />
        <Stat label="Time" value={fmtTime(s.secs)} sub={`par ${fmtTime(s.par)}`} />
        <Stat label="Wrong taps" value={String(game.wrong)} sub={`−${game.wrong * WRONG}`} />
        <Stat label="Time bonus" value={`+${s.bonus}`} sub={s.acc < MIN_ACC_FOR_BONUS ? `needs ${MIN_ACC_FOR_BONUS * 100}% first time` : "2 a second under par"} />
      </div>
      {missed.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={lab}>Worth another look</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {missed.map(id => {
              const r = game.results[id];
              return <span key={id} style={{ fontSize: "0.75rem", padding: "2px 9px", borderRadius: 12, background: r.revealed ? "rgba(255,183,77,0.12)" : "rgba(255,255,255,0.06)", border: `1px solid ${r.revealed ? "rgba(255,183,77,0.4)" : "rgba(255,255,255,0.12)"}`, color: "#dde6f0" }}>
                {nameOf(id)}{r.revealed ? " (shown)" : ` (${r.tries + 1} tries)`}
              </span>;
            })}
          </div>
        </div>
      )}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button onClick={onClose} style={btn(false)}>Back to map</button>
        <button onClick={onAgain} style={btn(true)}>Play again</button>
      </div>
    </Modal>
  );
}

// ─── Bits ─────────────────────────────────────────────────────────────────────
function Modal({ children, onClose, label }: { children: React.ReactNode; onClose: () => void; label: string }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div data-ui onPointerDown={e => { if (e.target === e.currentTarget) onClose(); }} style={{
      position: "fixed", inset: 0, zIndex: 2000, background: "rgba(8,14,28,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: 12,
    }}>
      <div role="dialog" aria-label={label} style={{
        width: "min(520px, 100%)", maxHeight: "100%", overflowY: "auto", background: PANEL, borderRadius: 10, padding: "18px 20px",
        border: "1px solid rgba(224,201,127,0.35)", boxShadow: "0 16px 48px rgba(0,0,0,0.8)", fontFamily: "Inter, sans-serif", color: "#dde6f0",
        animation: "panelIn 0.2s cubic-bezier(0.23,1,0.32,1)",
      }}>{children}</div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div style={{ textAlign: "center", padding: "8px 4px", borderRadius: 6, background: "rgba(255,255,255,0.04)" }}>
      <div style={{ fontSize: "1.15rem", color: GOLD, fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: "0.6rem", color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
      <div style={{ fontSize: "0.6rem", color: "#5a7090", marginTop: 2 }}>{sub}</div>
    </div>
  );
}

const h2: React.CSSProperties = { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.4rem", color: GOLD, margin: "0 0 8px" };
const lab: React.CSSProperties = { fontSize: "0.62rem", color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 };
const choice = (on: boolean): React.CSSProperties => ({
  padding: "8px 6px", borderRadius: 6, cursor: "pointer", textAlign: "center", fontFamily: "Inter, sans-serif",
  background: on ? "rgba(224,201,127,0.16)" : "rgba(255,255,255,0.03)", color: on ? GOLD : "#c8d4e0",
  border: `1px solid ${on ? "rgba(224,201,127,0.6)" : "rgba(255,255,255,0.12)"}`,
});
const btn = (primary: boolean): React.CSSProperties => ({
  padding: "7px 18px", borderRadius: 5, cursor: "pointer", fontSize: "0.85rem", fontFamily: "Inter, sans-serif",
  background: primary ? "#0f3460" : "transparent", color: primary ? GOLD : MUTED,
  border: `1px solid ${primary ? "rgba(224,201,127,0.5)" : "rgba(255,255,255,0.15)"}`,
});
