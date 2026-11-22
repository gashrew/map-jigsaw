// Works out which pieces share a land border on each map, from the shapes themselves.
// Writes client/src/lib/neighbours.ts. Run: node scripts/neighbours.mjs
import fs from "fs";
import path from "path";
const SRC = "client/src";
const maps = [];
for (const f of fs.readdirSync(`${SRC}/pages`)) {
  const s = fs.readFileSync(`${SRC}/pages/${f}`, "utf8");
  const key = s.match(/^\s*key: "([^"]+)"/m)?.[1];
  const data = s.match(/from "@\/lib\/(\w+Data)"/)?.[1];
  if (key && data && f !== "Landing.tsx") maps.push({ key, data });
}
const out = {};
// Country maps use Natural Earth's world borders (scripts/maps/world-neighbours.json, from
// topojson.neighbors on world-atlas countries-50m), so borders with countries on other maps show too
const WORLD = JSON.parse(fs.readFileSync("scripts/maps/world-neighbours.json", "utf8"));
for (const [a, b] of [["Botswana", "Zambia"]]) { WORLD[a].push(b); WORLD[b].push(a); } // the short Kazungula border
const SPECS = "scripts/maps";
const display = {}, mergedInto = {};
for (const f of fs.readdirSync(SPECS)) {
  if (f.endsWith("-info.json")) for (const [n, v] of Object.entries(JSON.parse(fs.readFileSync(`${SPECS}/${f}`, "utf8")))) if (Array.isArray(v)) display[n] ??= v[5] || n;
  if (f.endsWith(".json") && !f.includes("-info") && f !== "world-neighbours.json") {
    const sp = JSON.parse(fs.readFileSync(`${SPECS}/${f}`, "utf8"));
    for (const [into, parts] of Object.entries(sp.merge ?? {})) for (const x of parts) mergedInto[x] = into;
  }
}
const canon = n => mergedInto[n] ?? n;
function worldNeighbours(specFile) {
  const sp = JSON.parse(fs.readFileSync(`${SPECS}/${specFile}`, "utf8"));
  if (sp.admin1 || !sp.info) return null;
  const info = JSON.parse(fs.readFileSync(`${SPECS}/${sp.info}`, "utf8"));
  const idOf = {};
  for (const [n, v] of Object.entries(info)) if (Array.isArray(v)) idOf[n] = v[0];
  const nb = {};
  for (const [n, id] of Object.entries(idOf)) {
    const names = new Set();
    for (const src of [n, ...Object.keys(mergedInto).filter(k => mergedInto[k] === n)])
      for (const m of WORLD[src] ?? []) if (canon(m) !== n && m !== "Siachen Glacier") names.add(canon(m)); // a disputed glacier, not a country
    nb[id] = [...names].map(m => idOf[m] ?? "~" + (display[m] ?? m)).sort((a, b) => (a[0] === "~") - (b[0] === "~") || a.localeCompare(b));
  }
  return nb;
}
const MIN_LEN = 0.8; // map units, counted from both sides
// Corrections where the simplified shapes mislead
const DROP = { africa: [["MA", "MR"]], "north-africa": [["MA", "MR"]], canada: [["NU", "QC"]] };
const ADD = { africa: [["BW", "ZM"]], "southern-africa": [["BW", "ZM"]] }; // the short Kazungula border
for (const { key, data } of maps) {
  const s = fs.readFileSync(`${SRC}/lib/${data}.ts`, "utf8");
  const specFile = s.match(/build-map\.mjs from ([\w-]+\.json)/)?.[1];
  const w = specFile && worldNeighbours(specFile);
  if (w) { out[key] = w; console.log(key.padEnd(20), "world borders"); continue; }
  const re = /"?id"?:\s*"([^"]+)"[\s\S]*?"?path"?:\s*"([^"]*)"/g;
  const pieces = [];
  for (let m; (m = re.exec(s)); ) pieces.push({ id: m[1], pts: [...m[2].matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map(p => [+p[1], +p[2]]) });
  // Each piece's border points on a fine grid; pieces that share points share a border
  const grid = new Map();
  pieces.forEach((p, i) => {
    for (const [x, y] of p.pts) {
      const k = `${Math.round(x * 2)},${Math.round(y * 2)}`;
      if (!grid.has(k)) grid.set(k, new Set());
      grid.get(k).add(i);
    }
  });
  // Length of each piece's outline that runs along another piece's outline
  const near = (x, y) => {
    const gx = Math.round(x * 2), gy = Math.round(y * 2), r = new Set();
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) grid.get(`${gx + dx},${gy + dy}`)?.forEach(j => r.add(j));
    return r;
  };
  const shared = new Map();
  pieces.forEach((p, i) => {
    let prev = null, prevNear = null;
    for (const [x, y] of p.pts) {
      const nn = near(x, y);
      if (prev) for (const j of nn) if (j !== i && prevNear.has(j)) {
        const len = Math.hypot(x - prev[0], y - prev[1]);
        if (len > 30) continue; // a jump between separate parts of the shape
        const pk = i < j ? `${i}|${j}` : `${j}|${i}`;
        shared.set(pk, (shared.get(pk) ?? 0) + len);
      }
      prev = [x, y]; prevNear = nn;
    }
  });
  const nb = Object.fromEntries(pieces.map(p => [p.id, []]));
  for (const [pk, n] of shared) {
    if (process.env.DEBUG && (n < 3 || process.env.DEBUG.includes(pieces[+pk.split("|")[0]].id + pieces[+pk.split("|")[1]].id))) console.log("  weak", key, pieces[+pk.split("|")[0]].id, pieces[+pk.split("|")[1]].id, n);
    if (n < MIN_LEN) continue; // corners that merely touch (e.g. Four Corners) don't count
    const [i, j] = pk.split("|").map(Number);
    nb[pieces[i].id].push(pieces[j].id); nb[pieces[j].id].push(pieces[i].id);
  }
  for (const [a, b] of DROP[key] ?? []) if (nb[a] && nb[b]) { nb[a] = nb[a].filter(x => x !== b); nb[b] = nb[b].filter(x => x !== a); }
  for (const [a, b] of ADD[key] ?? []) if (nb[a] && nb[b] && !nb[a].includes(b)) { nb[a].push(b); nb[b].push(a); }
  for (const k in nb) nb[k].sort();
  out[key] = nb;
  const counts = Object.values(nb).map(v => v.length);
  console.log(key.padEnd(20), pieces.length, "pieces, none:", counts.filter(c => !c).length, "avg", (counts.reduce((a, b) => a + b, 0) / counts.length).toFixed(1));
}
fs.writeFileSync(`${SRC}/lib/neighbours.ts`,
  "// Auto-generated by scripts/neighbours.mjs — pieces that share a land border on each map\n" +
  "export const NEIGHBOURS: Record<string, Record<string, string[]>> = " + JSON.stringify(out) + ";\n");
