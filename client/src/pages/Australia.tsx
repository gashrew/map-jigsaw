import JigsawMap from "@/components/JigsawMap";
import { AUSTRALIA_DETAILS } from "@/lib/australasiaDetails";
import type { MapConfig } from "@/lib/mapTypes";
import { AUSTRALIA, AUSTRALIA_CONTEXT, SVG_HEIGHT, SVG_WIDTH } from "@/lib/australiaData";

export const AUSTRALIA_MAP: MapConfig = {
  key: "australia",
  flag: "🇦🇺",
  title: "Australia — Interactive Jigsaw",
  subtitle: `${AUSTRALIA.length} states and territories • Natural Earth boundary data`,
  noun: "state",
  typeLabel: "State or territory",
  capitalLabel: "Capital",
  popLabel: "Population (2024-25)",
  areaLabel: "Area",
  pieces: AUSTRALIA,
  width: SVG_WIDTH,
  height: SVG_HEIGHT,
  regionColours: { "East": "#5b9bd5", "Centre and West": "#e07b54" },
  labelAreaRange: [2000, 2500000],
  context: AUSTRALIA_CONTEXT,
  details: AUSTRALIA_DETAILS,
};

export default function Australia() {
  return <JigsawMap cfg={AUSTRALIA_MAP} />;
}
