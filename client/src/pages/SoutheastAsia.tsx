import JigsawMap from "@/components/JigsawMap";
import { SOUTHEAST_ASIA_DETAILS } from "@/lib/asiaDetails";
import type { MapConfig } from "@/lib/mapTypes";
import { SOUTHEAST_ASIA, SOUTHEAST_ASIA_CONTEXT, SVG_HEIGHT, SVG_WIDTH } from "@/lib/southeastAsiaData";

export const SOUTHEAST_ASIA_MAP: MapConfig = {
  key: "southeast-asia",
  flag: "🌏",
  title: "Southeast Asia — Interactive Jigsaw",
  subtitle: `${SOUTHEAST_ASIA.length} countries • Natural Earth boundary data`,
  noun: "country",
  typeLabel: "Country",
  capitalLabel: "Capital",
  popLabel: "Population (approx.)",
  areaLabel: "Area",
  pieces: SOUTHEAST_ASIA,
  width: SVG_WIDTH,
  height: SVG_HEIGHT,
  regionColours: { "Mainland": "#e07b54", "Maritime": "#4db8a0" },
  labelAreaRange: [700, 2000000],
  context: SOUTHEAST_ASIA_CONTEXT,
  details: SOUTHEAST_ASIA_DETAILS,
};

export default function SoutheastAsia() {
  return <JigsawMap cfg={SOUTHEAST_ASIA_MAP} />;
}
