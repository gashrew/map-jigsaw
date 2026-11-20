// Builds a map's data file from Natural Earth 1:50m and a spec in scripts/maps/.
// Countries come from world-atlas; provinces/states (spec.admin1 = country name) come from
// Natural Earth's ne_50m_admin_1_states_provinces.geojson, passed as a third argument.
// Usage (with world-atlas, topojson-client, topojson-server, d3-geo, polylabel installed):
//   node scripts/build-map.mjs scripts/maps/europe.json client/src/lib/europeData.ts
//   node scripts/build-map.mjs scripts/maps/canada.json client/src/lib/canadaData.ts ne_50m_admin_1_states_provinces.geojson
import fs from "fs";
import path from "path";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const topo = require("topojson-client");
const { geoAzimuthalEqualArea, geoConicConformal, geoPath, geoBounds, geoCentroid } = require("d3-geo");
const polylabel = require("polylabel");
const [specFile, outFile, admin1File] = process.argv.slice(2);
const spec = JSON.parse(fs.readFileSync(specFile));
const info = JSON.parse(fs.readFileSync(path.join(path.dirname(specFile), spec.info)));
const world = require("world-atlas/countries-50m.json");
let t = world, geoms = world.objects.countries.geometries;
if (spec.admin1) {
  // Build a topology of the country's provinces so shared borders and neighbours work as for countries
  const fc = JSON.parse(fs.readFileSync(admin1File));
  fc.features = fc.features.filter(f => f.properties.admin === spec.admin1)
    .map(f => ({ type: "Feature", properties: { name: f.properties.name }, geometry: f.geometry }));
  t = require("topojson-server").topology({ p: fc }, 1e6);
  geoms = t.objects.p.geometries;
}
const byName = n => geoms.filter(g => g.properties.name === n);
const MERGE = spec.merge || {};
// Each entry may take its shape from another feature (French Guiana from France)
const srcOf = name => info[name][7] || name;

const [lo0, lo1, la0, la1] = spec.window;
const inWindow = ([x, y]) => x > lo0 && x < lo1 && y > la0 && y < la1;
// Keep only the parts of each country inside the window (drops overseas territories, far islands…)
function trimPolys(f, keepAll) {
  const g = f.geometry;
  const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
  const kept = keepAll ? polys : polys.filter(p => inWindow(geoCentroid({ type: "Polygon", coordinates: p })));
  return { type: "Feature", properties: f.properties, geometry: { type: "MultiPolygon", coordinates: kept } };
}
const pieces = Object.keys(info).map(name => {
  const parts = [...byName(srcOf(name)), ...(MERGE[name] || []).flatMap(byName)];
  if (!parts.length) throw new Error("missing " + name);
  const geom = parts.length > 1 ? topo.merge(t, parts) : topo.feature(t, parts[0]).geometry;
  return { name, f: trimPolys({ type: "Feature", properties: { name }, geometry: geom }, (spec.keepAll || []).includes(name)) };
});
const used = new Set(Object.keys(info).flatMap(n => [srcOf(n), ...(MERGE[n] || [])]));
const [c0, c1, c2, c3] = spec.contextBox;
const ctxGeoms = spec.admin1 ? world.objects.countries.geometries.filter(g => g.properties.name !== spec.admin1)
  : geoms.filter(g => !used.has(g.properties.name));
const context = ctxGeoms.map(g => trimPolys(topo.feature(spec.admin1 ? world : t, g), true))
  .filter(f => { const [[a, b], [c, d]] = geoBounds(f); return (a > c || (c > c0 && a < c1)) && d > c2 && b < c3; }); // a > c: crosses the date line

// The frame fits every piece except any in frameExclude (clipped at the edge)
const W = spec.width || 1000, M = 6;
// Lambert conformal conic when the spec gives parallels (as Statistics Canada uses), else azimuthal equal-area
const proj = spec.parallels ? geoConicConformal().parallels(spec.parallels).rotate(spec.rotate)
  : geoAzimuthalEqualArea().rotate(spec.rotate);
const frame = { type: "FeatureCollection", features: pieces.filter(p => !(spec.frameExclude || []).includes(p.name)).map(p => p.f) };
proj.fitWidth(W - 2 * M, frame);
const [[x0, y0], [x1, y1]] = geoPath(proj).bounds(frame);
proj.translate([proj.translate()[0] - x0 + M, proj.translate()[1] - y0 + M]);
const H = Math.ceil(y1 - y0 + 2 * M);
proj.clipExtent([[0, 0], [W, H]]);
const pathGen = geoPath(proj).digits(1);

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
  for (const p of f.geometry.coordinates) {
    const rings = p.map(r => r.map(c => proj(c)).filter(Boolean));
    if (!rings[0] || rings[0].length < 3) continue;
    const x = rings[0].map(c => c[0]);
    const a = Math.abs(rings[0].reduce((s, c, i) => { const n = rings[0][(i + 1) % rings[0].length]; return s + c[0] * n[1] - n[0] * c[1]; }, 0));
    const inside = Math.max(...x) > 0 && Math.min(...x) < W;
    if (inside && a > bestA) { bestA = a; best = rings; }
  }
  const [cx, cy] = polylabel(best, 0.5);
  return [Math.min(W - 40, Math.max(8, cx)), Math.min(H - 8, Math.max(8, cy))];
}
const out = pieces.map(({ name, f }) => {
  const [abbr, capital, region, pop, area, display, note] = info[name];
  const at = (spec.labelAt || {})[name];
  const [cx, cy] = at ? proj(at) : labelPoint(f);
  const d = pathGen(f);
  return { id: abbr, name: display || name, abbr, path: tidy(d) || d, cx: +cx.toFixed(1), cy: +cy.toFixed(1),
    colour: "", capital, region, pop, area_km2: area, ...(note ? { note } : {}) };
});
for (const p of out) if (!p.path) throw new Error("empty path " + p.name);
// Shades within a region: neighbours get different ones where possible
const nb = topo.neighbors(geoms);
const names = Object.keys(info);
out.forEach((p, i) => {
  const myIdx = geoms.findIndex(g => g.properties.name === srcOf(names[i]));
  const taken = new Set(nb[myIdx].map(j => out[names.findIndex(n => srcOf(n) === geoms[j].properties.name)]?.colour).filter(Boolean));
  const s = spec.shades[p.region];
  p.colour = s.find(c => !taken.has(c)) || s[i % s.length];
});
const ctx = context.map(f => tidy(pathGen(f) || "")).filter(d => d.length > 10);
const N = spec.exportName;
const ts = `// Auto-generated by scripts/build-map.mjs from ${path.basename(specFile)} — do not edit manually
// Natural Earth 1:50m via world-atlas; ${spec.comment}
import type { MapPiece } from "./mapTypes";

export const SVG_WIDTH  = ${W};
export const SVG_HEIGHT = ${H};

export const ${N}: MapPiece[] = ${JSON.stringify(out, null, 1)};

// Neighbouring land outside the jigsaw, drawn in the background for context
export const ${N}_CONTEXT: string[] = ${JSON.stringify(ctx)};
`;
fs.writeFileSync(outFile, ts);
console.log(N, "pieces", out.length, "size", (ts.length / 1024).toFixed(0) + "KB", "H", H);
