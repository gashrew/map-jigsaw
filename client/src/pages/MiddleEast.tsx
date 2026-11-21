import JigsawMap from "@/components/JigsawMap";
import { MIDDLE_EAST_DETAILS } from "@/lib/middleEastDetails";
import type { MapConfig } from "@/lib/mapTypes";
import { MIDDLE_EAST, MIDDLE_EAST_CONTEXT, SVG_HEIGHT, SVG_WIDTH } from "@/lib/middleEastData";

export const MIDDLE_EAST_MAP: MapConfig = {
  key: "middle-east",
  flag: "🌍",
  title: "Middle East — Interactive Jigsaw",
  subtitle: `${MIDDLE_EAST.length} countries • Natural Earth boundary data`,
  noun: "country",
  typeLabel: "Country",
  capitalLabel: "Capital",
  popLabel: "Population (approx.)",
  areaLabel: "Area",
  pieces: MIDDLE_EAST,
  width: SVG_WIDTH,
  height: SVG_HEIGHT,
  regionColours: { "Levant": "#4db8a0", "Arabian Peninsula": "#e07b54", "Iraq and Iran": "#8a7ecf", "Anatolia": "#5b9bd5", "North Africa": "#c9a24a" },
  labelAreaRange: [700, 2000000],
  context: MIDDLE_EAST_CONTEXT,
  details: MIDDLE_EAST_DETAILS,
};

export default function MiddleEast() {
  return <JigsawMap cfg={MIDDLE_EAST_MAP} />;
}
