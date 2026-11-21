import JigsawMap from "@/components/JigsawMap";
import { INDIA_DETAILS } from "@/lib/indiaDetails";
import type { MapConfig } from "@/lib/mapTypes";
import { INDIA, INDIA_CONTEXT, SVG_HEIGHT, SVG_WIDTH } from "@/lib/indiaData";

export const INDIA_MAP: MapConfig = {
  key: "india",
  flag: "🇮🇳",
  title: "India — Interactive Jigsaw",
  subtitle: "28 states and 8 union territories • Natural Earth boundary data",
  noun: "state",
  typeLabel: "State or union territory",
  capitalLabel: "Capital",
  popLabel: "Population (approx.)",
  areaLabel: "Area",
  pieces: INDIA,
  width: SVG_WIDTH,
  height: SVG_HEIGHT,
  regionColours: { "Northern": "#5b9bd5", "Central": "#8a7ecf", "Eastern": "#c9a24a", "North East": "#4db8a0", "Western": "#e07b54", "Southern": "#d06a8a" },
  labelAreaRange: [100, 350000],
  context: INDIA_CONTEXT,
  details: INDIA_DETAILS,
};

export default function India() {
  return <JigsawMap cfg={INDIA_MAP} />;
}
