// Builds client/src/lib/europeData.ts from Natural Earth 1:50m (world-atlas) + scripts/europe-info.json
// Usage (with world-atlas, topojson-client, d3-geo, polylabel installed):
//   node scripts/build-europe.mjs scripts/europe-info.json client/src/lib/europeData.ts
import fs from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const topo = require("topojson-client");
const { geoAzimuthalEqualArea, geoPath, geoBounds, geoCentroid } = require("d3-geo");
const polylabel = require("polylabel");
const [infoFile, outFile] = process.argv.slice(2);
const info = JSON.parse(fs.readFileSync(infoFile));
const t = require("world-atlas/countries-50m.json");
const geoms = t.objects.countries.geometries;
const byName = n => geoms.filter(g => g.properties.name === n);
const MERGE = { "Cyprus": ["N. Cyprus"], "Finland": ["Åland"] };

const inWindow = ([x, y]) => x > -24.6 && x < 50 && y > 33 && y < 73;
// Keep only the European parts of each country (drops French Guiana, Canaries, Azores, Svalbard…)
function trimPolys(f, keepAll) {
  const g = f.geometry;
  const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
  const kept = keepAll ? polys : polys.filter(p => inWindow(geoCentroid({ type: "Polygon", coordinates: p })));
  return { type: "Feature", properties: f.properties, geometry: { type: "MultiPolygon", coordinates: kept } };
}
const pieces = Object.keys(info).map(name => {
  const parts = [...byName(name), ...(MERGE[name] || []).flatMap(byName)];
  if (!parts.length) throw new Error("missing " + name);
  const geom = parts.length > 1 ? topo.merge(t, parts) : topo.feature(t, parts[0]).geometry;
  return { name, f: trimPolys({ type: "Feature", properties: { name }, geometry: geom }, name === "Russia") };
});
const used = new Set(Object.keys(info).flatMap(n => [n, ...(MERGE[n] || [])]));
const context = geoms.filter(g => !used.has(g.properties.name)).map(g => trimPolys(topo.feature(t, g), true))
  .filter(f => { const [[a, b], [c, d]] = geoBounds(f); return c > -30 && a < 60 && d > 25 && b < 75; });

// Lambert azimuthal equal-area centred on Europe (as EPSG:3035); the frame fits everything except Russia
const W = 1000, M = 6;
const proj = geoAzimuthalEqualArea().rotate([-12, -52]);
const frame = { type: "FeatureCollection", features: pieces.filter(p => p.name !== "Russia").map(p => p.f) };
proj.fitWidth(W - 2 * M, frame);
const [[x0, y0], [x1, y1]] = geoPath(proj).bounds(frame);
proj.translate([proj.translate()[0] - x0 + M, proj.translate()[1] - y0 + M]);
const H = Math.ceil(y1 - y0 + 2 * M);
proj.clipExtent([[0, 0], [W, H]]);
const path = geoPath(proj).digits(1);

// Drop points closer than ~0.35px to the previous one to keep the file small
function tidy(d) {
  return d.replace(/M[^MZ]*Z?/g, ring => {
    const pts = ring.replace(/[MZ]/g, "").split("L").map(s => s.split(",").map(Number));
    const out = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const p = out[out.length - 1];
      if (i === pts.length - 1 || Math.hypot(pts[i][0] - p[0], pts[i][1] - p[1]) > 0.35) out.push(pts[i]);
    }
    if (out.length < 3) return "";
    return "M" + out.map(p => p.join(",")).join("L") + (ring.endsWith("Z") ? "Z" : "");
  });
}
function labelPoint(f) {
  let best = null, bestA = -1;
  const polys = f.geometry.coordinates;
  for (const p of polys) {
    const rings = p.map(r => r.map(c => proj(c)).filter(Boolean));
    if (!rings[0] || rings[0].length < 3) continue;
    const [x, y] = [rings[0].map(c => c[0]), rings[0].map(c => c[1])];
    const a = Math.abs(rings[0].reduce((s, c, i) => { const n = rings[0][(i + 1) % rings[0].length]; return s + c[0] * n[1] - n[0] * c[1]; }, 0));
    const inside = Math.max(...x) > 0 && Math.min(...x) < W;
    if (inside && a > bestA) { bestA = a; best = rings; }
  }
  const [cx, cy] = polylabel(best, 0.5);
  // Clip to the visible frame (Russia's label point)
  return [Math.min(W - 40, Math.max(8, cx)), Math.min(H - 8, Math.max(8, cy))];
}
const SHADES = {
  "Northern": ["#3a7abf", "#4a8fd4", "#6aaae0", "#8abce8", "#2a6aaf"],
  "Western": ["#1d8a70", "#2d9a80", "#3daa90", "#5dc4aa", "#0d7a60"],
  "Southern": ["#c05a34", "#d06a44", "#e07a54", "#f08a64", "#b04a24", "#e09a74"],
  "Eastern": ["#5a4e9f", "#6a5eaf", "#7a6ebf", "#9a8ecf", "#4a3e8f", "#baaee0"],
  "Western Asia": ["#b8923a", "#c9a24a"],
};
const out = pieces.map(({ name, f }) => {
  const [abbr, capital, region, pop, area, display, note] = info[name];
  // Russia is clipped by the frame, so its label goes in the visible part, east of Moscow
  const [cx, cy] = name === "Russia" ? proj([42, 57]) : labelPoint(f);
  return { id: abbr, name: display || name, abbr, path: (tidy(path(f)) || path(f)), cx: +cx.toFixed(1), cy: +cy.toFixed(1),
    colour: "", capital, region, pop, area_km2: area, ...(note ? { note } : {}) };
});
// Shades within a region: neighbours get different ones where possible
const nb = topo.neighbors(geoms);
const idxOf = n => geoms.findIndex(g => g.properties.name === n);
const names = Object.keys(info);
out.forEach((p, i) => {
  const myIdx = idxOf(names[i]);
  const taken = new Set(nb[myIdx].map(j => out[names.indexOf(geoms[j].properties.name)]?.colour).filter(Boolean));
  const s = SHADES[p.region];
  p.colour = s.find(c => !taken.has(c)) || s[i % s.length];
});
const ctx = context.map(f => tidy(path(f) || "")).filter(d => d.length > 10);
const ts = `// Auto-generated by scripts/build-europe.mjs — do not edit manually
// Natural Earth 1:50m via world-atlas; Lambert azimuthal equal-area centred on 12°E 52°N
import type { MapPiece } from "./mapTypes";

export const SVG_WIDTH  = ${W};
export const SVG_HEIGHT = ${H};

export const EUROPE: MapPiece[] = ${JSON.stringify(out, null, 1)};

// Neighbouring land outside the jigsaw, drawn in the background for context
export const EUROPE_CONTEXT: string[] = ${JSON.stringify(ctx)};
`;
fs.writeFileSync(outFile, ts);
console.log("pieces", out.length, "size", (ts.length / 1024).toFixed(0) + "KB", "H", H);
for (const p of out) if (!p.path) throw new Error("empty path " + p.name);
