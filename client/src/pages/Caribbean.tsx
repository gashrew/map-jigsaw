import JigsawMap from "@/components/JigsawMap";
import { CARIBBEAN_DETAILS } from "@/lib/americasDetails";
import type { MapConfig } from "@/lib/mapTypes";
import { CARIBBEAN, CARIBBEAN_CONTEXT, SVG_HEIGHT, SVG_WIDTH } from "@/lib/caribbeanData";

export const CARIBBEAN_MAP: MapConfig = {
  key: "caribbean",
  flag: "🌎",
  title: "Caribbean — Interactive Jigsaw",
  subtitle: `${CARIBBEAN.length} countries and territories • Natural Earth boundary data`,
  noun: "country",
  typeLabel: "Country",
  capitalLabel: "Capital",
  popLabel: "Population (approx.)",
  areaLabel: "Area",
  pieces: CARIBBEAN,
  width: SVG_WIDTH,
  height: SVG_HEIGHT,
  regionColours: { "Greater Antilles": "#e07b54", "Bahamas": "#c9a24a", "Lesser Antilles": "#4db8a0" },
  labelAreaRange: [250, 110000],
  context: CARIBBEAN_CONTEXT,
  details: CARIBBEAN_DETAILS,
};

export default function Caribbean() {
  return <JigsawMap cfg={CARIBBEAN_MAP} />;
}
