import JigsawMap from "@/components/JigsawMap";
import type { MapConfig } from "@/lib/mapTypes";
import { EUROPE, EUROPE_CONTEXT, SVG_HEIGHT, SVG_WIDTH } from "@/lib/europeData";

export const EUROPE_MAP: MapConfig = {
  key: "europe",
  flag: "🌍",
  title: "Europe — Interactive Jigsaw",
  subtitle: `${EUROPE.length} countries • Natural Earth boundary data`,
  noun: "country",
  typeLabel: "Country",
  capitalLabel: "Capital",
  popLabel: "Population (approx.)",
  areaLabel: "Area",
  pieces: EUROPE,
  width: SVG_WIDTH,
  height: SVG_HEIGHT,
  // UN regions; Cyprus and Turkey are in Western Asia in that scheme
  regionColours: { "Northern": "#5b9bd5", "Western": "#4db8a0", "Southern": "#e07b54", "Eastern": "#8a7ecf", "Western Asia": "#c9a24a" },
  labelAreaRange: [300, 600000],
  context: EUROPE_CONTEXT,
};

export default function Europe() {
  return <JigsawMap cfg={EUROPE_MAP} />;
}
