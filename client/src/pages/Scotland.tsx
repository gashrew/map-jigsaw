import JigsawMap from "@/components/JigsawMap";
import { SCOTLAND_DETAILS } from "@/lib/ukNationsDetails";
import type { MapConfig } from "@/lib/mapTypes";
import { SCOTLAND, SCOTLAND_CONTEXT, SVG_HEIGHT, SVG_WIDTH } from "@/lib/scotlandData";

export const SCOTLAND_MAP: MapConfig = {
  key: "scotland",
  flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  title: "Scotland — Interactive Jigsaw",
  subtitle: `${SCOTLAND.length} council areas • Natural Earth boundary data`,
  noun: "council area",
  typeLabel: "Council area",
  capitalLabel: "Admin centre",
  popLabel: "Population (approx.)",
  areaLabel: "Area",
  pieces: SCOTLAND,
  width: SVG_WIDTH,
  height: SVG_HEIGHT,
  regionColours: { "Scotland": "#5b9bd5" },
  labelAreaRange: [50, 26000],
  context: SCOTLAND_CONTEXT,
  details: SCOTLAND_DETAILS,
};

export default function Scotland() {
  return <JigsawMap cfg={SCOTLAND_MAP} />;
}
