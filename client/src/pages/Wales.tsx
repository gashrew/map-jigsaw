import JigsawMap from "@/components/JigsawMap";
import { WALES_DETAILS } from "@/lib/ukNationsDetails";
import type { MapConfig } from "@/lib/mapTypes";
import { WALES, WALES_CONTEXT, SVG_HEIGHT, SVG_WIDTH } from "@/lib/walesData";

export const WALES_MAP: MapConfig = {
  key: "wales",
  flag: "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
  title: "Wales — Interactive Jigsaw",
  subtitle: `${WALES.length} principal areas • Natural Earth boundary data`,
  noun: "area",
  typeLabel: "Principal area",
  capitalLabel: "Admin centre",
  popLabel: "Population (approx.)",
  areaLabel: "Area",
  pieces: WALES,
  width: SVG_WIDTH,
  height: SVG_HEIGHT,
  regionColours: { "Wales": "#5b9bd5" },
  labelAreaRange: [100, 5200],
  context: WALES_CONTEXT,
  details: WALES_DETAILS,
};

export default function Wales() {
  return <JigsawMap cfg={WALES_MAP} />;
}
