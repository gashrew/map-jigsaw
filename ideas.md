# English Counties Jigsaw — Design Brainstorm

## Three Approaches

### 1. Antique Cartographic
Aged parchment tones, serif typography, compass-rose motifs, hand-drawn border textures.
**Probability: 0.07**

### 2. Dark Atlas (CHOSEN)
Deep navy/slate background evoking a night-time Ordnance Survey map. Gold/amber accents for county labels and UI chrome. Clean but authoritative — like a premium wall map come to life.
**Probability: 0.06**

### 3. Bright Educational
Clean white background, bold primary colours, rounded sans-serif type. Friendly and accessible.
**Probability: 0.04**

---

## Chosen Approach: Dark Atlas

**Design Movement:** Neo-cartographic / Dark Dashboard

**Core Principles:**
1. The map is the hero — all chrome recedes to let the county shapes dominate
2. Restraint in colour: dark background + single gold accent + muted county fills
3. Tactile drag interactions with satisfying physical feedback
4. Information hierarchy: name tooltip > label > ghost outline > controls

**Color Philosophy:**
- Background: deep navy `#0f1b2d` — the colour of a folded OS map at night
- Surface: `#16213e` — slightly lighter for header/panels
- Accent: `#e0c97f` — warm gold, the colour of map lettering and cartouche borders
- County fills: a curated palette of muted, desaturated hues — no two adjacent counties the same
- Ghost outline: `#3a5070` — subtle, present but not distracting

**Layout Paradigm:**
- Full-bleed canvas takes the entire viewport below a slim header bar
- Header is a single horizontal strip: title left, controls right — nothing else
- No sidebars, no modals, no distractions

**Signature Elements:**
1. Slim gold top-border on the header (cartouche frame reference)
2. Dashed ghost outline for the assembled map position
3. Drop-shadow on dragged pieces (lifted off the canvas)

**Interaction Philosophy:**
- Drag feels weighty — slight shadow increase on pickup
- Assemble animates with staggered cubic-bezier easing (pieces fly home one by one)
- Snap-to-map gives a brief gold flash on the snapped piece

**Animation:**
- Piece pickup: `filter: drop-shadow` increases over 120ms ease-out
- Assemble: staggered 20ms delay per piece, 500ms cubic-bezier(0.25,0.8,0.25,1)
- Scatter: random delay 0–200ms, 400ms ease-out
- Snap flash: gold stroke pulse 300ms then fades

**Typography System:**
- Header title: `Playfair Display` — authoritative, cartographic
- Controls & labels: `Inter` 0.78rem — functional, recedes
- County labels on map: `Georgia` serif 8.5px — matches the existing SVG labels

**Brand Essence:** A premium interactive atlas for anyone who loves England's geography — beautiful, accurate, endlessly replayable.
**Personality:** Authoritative · Tactile · Elegant

**Brand Voice:** Headlines sound like a museum caption — precise and evocative. CTAs are direct: "Scatter", "Assemble", "Snap to map". No filler copy.

**Wordmark:** A small compass-rose icon beside the title in gold.

**Signature Brand Color:** `#e0c97f` — cartographic gold.
