import JigsawMap from "@/components/JigsawMap";
import { AFRICA_DETAILS } from "@/lib/africaDetails";
import type { MapConfig } from "@/lib/mapTypes";
import { AFRICA, AFRICA_CONTEXT, SVG_HEIGHT, SVG_WIDTH } from "@/lib/africaData";

export const AFRICA_MAP: MapConfig = {
  key: "africa",
  flag: "🌍",
  title: "Africa — Interactive Jigsaw",
  subtitle: `${AFRICA.length} countries and territories • Natural Earth boundary data`,
  noun: "country",
  typeLabel: "Country",
  capitalLabel: "Capital",
  popLabel: "Population (approx.)",
  areaLabel: "Area",
  pieces: AFRICA,
  width: SVG_WIDTH,
  height: SVG_HEIGHT,
  regionColours: { "North Africa": "#e07b54", "West Africa": "#c9a24a", "Central & East Africa": "#4db8a0", "Southern Africa": "#5b9bd5" },
  labelAreaRange: [5000, 2400000],
  context: AFRICA_CONTEXT,
  details: AFRICA_DETAILS,
};

export default function Africa() {
  return <JigsawMap cfg={AFRICA_MAP} />;
}
