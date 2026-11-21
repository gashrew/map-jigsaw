import JigsawMap from "@/components/JigsawMap";
import { EAST_ASIA_DETAILS } from "@/lib/asiaDetails";
import type { MapConfig } from "@/lib/mapTypes";
import { EAST_ASIA, EAST_ASIA_CONTEXT, SVG_HEIGHT, SVG_WIDTH } from "@/lib/eastAsiaData";

export const EAST_ASIA_MAP: MapConfig = {
  key: "east-asia",
  flag: "🌏",
  title: "East Asia — Interactive Jigsaw",
  subtitle: `${EAST_ASIA.length} countries and territories • Natural Earth boundary data`,
  noun: "country",
  typeLabel: "Country",
  capitalLabel: "Capital",
  popLabel: "Population (approx.)",
  areaLabel: "Area",
  pieces: EAST_ASIA,
  width: SVG_WIDTH,
  height: SVG_HEIGHT,
  regionColours: { "China": "#e07b54", "Japan": "#5b9bd5", "Korean Peninsula": "#4db8a0", "Mongolia": "#8a7ecf", "Taiwan": "#c9a24a" },
  labelAreaRange: [30000, 5000000],
  context: EAST_ASIA_CONTEXT,
  details: EAST_ASIA_DETAILS,
};

export default function EastAsia() {
  return <JigsawMap cfg={EAST_ASIA_MAP} />;
}
