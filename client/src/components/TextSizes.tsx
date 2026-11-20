/**
 * Text size sliders: one per kind of text on a map (names, capitals, towns…).
 * Sizes are multipliers (1 = normal) and are remembered per map on this device.
 */
import { useEffect, useRef, useState } from "react";

export interface TextGroup { key: string; label: string; }
export type TextSizes = Record<string, number>;

const MIN = 0.4, MAX = 3;

function load(mapKey: string): TextSizes {
  try { return JSON.parse(localStorage.getItem(`mapjigsaw-text-${mapKey}`) || "{}"); } catch { return {}; }
}

export function useTextSizes(mapKey: string) {
  const [sizes, setSizes] = useState<TextSizes>(() => load(mapKey));
  useEffect(() => {
    try { localStorage.setItem(`mapjigsaw-text-${mapKey}`, JSON.stringify(sizes)); } catch { /* private mode */ }
  }, [mapKey, sizes]);
  const size = (k: string) => sizes[k] ?? 1;
  const set = (k: string, v: number) => setSizes(s => ({ ...s, [k]: v }));
  const reset = () => setSizes({});
  return { size, set, reset };
}

export function TextSizeButton({ groups, ts }: { groups: TextGroup[]; ts: ReturnType<typeof useTextSizes> }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [open]);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} title="Text size" style={{
        background: open ? "#1a4a80" : "#0d1f30", color: "#c8d8e8",
        border: "1px solid rgba(224,201,127,0.35)", padding: "3px 10px", borderRadius: 4,
        cursor: "pointer", fontSize: "0.75rem", fontFamily: "Inter, sans-serif", whiteSpace: "nowrap",
      }}><span style={{ fontWeight: 700 }}>A</span><span style={{ fontSize: "0.6rem", fontWeight: 700 }}>A</span> Text size</button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 900, width: 250,
          background: "rgba(16,27,50,0.98)", border: "1px solid rgba(224,201,127,0.35)",
          borderRadius: 6, padding: "10px 14px 8px", boxShadow: "0 8px 32px rgba(0,0,0,0.7)",
          fontFamily: "Inter, sans-serif",
        }}>
          {groups.map(g => (
            <label key={g.key} style={{ display: "block", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "#c8d8e8", marginBottom: 2 }}>
                <span>{g.label}</span><span style={{ color: "#8899aa", fontFamily: "monospace" }}>{Math.round(ts.size(g.key) * 100)}%</span>
              </div>
              <input type="range" min={MIN} max={MAX} step={0.05} value={ts.size(g.key)}
                aria-label={`${g.label} text size`}
                onChange={e => ts.set(g.key, +e.target.value)}
                style={{ width: "100%", accentColor: "#e0c97f", cursor: "pointer" }} />
            </label>
          ))}
          <button onClick={ts.reset} style={{
            background: "none", border: "none", color: "#6a8aaa", cursor: "pointer",
            fontSize: "0.7rem", padding: 0, textDecoration: "underline",
          }}>Reset to normal</button>
        </div>
      )}
    </div>
  );
}
