import JigsawMap from "@/components/JigsawMap";
import type { MapConfig } from "@/lib/mapTypes";
import { CANADA, CANADA_CONTEXT, SVG_HEIGHT, SVG_WIDTH } from "@/lib/canadaData";

export const CANADA_MAP: MapConfig = {
  key: "canada",
  flag: "🇨🇦",
  title: "Canada — Interactive Jigsaw",
  subtitle: "10 provinces and 3 territories • Natural Earth boundary data",
  noun: "province",
  typeLabel: "Province / territory",
  capitalLabel: "Capital",
  popLabel: "Population (2021 census)",
  areaLabel: "Area (land and water)",
  pieces: CANADA,
  width: SVG_WIDTH,
  height: SVG_HEIGHT,
  regionColours: { "Atlantic": "#4db8a0", "Central": "#e07b54", "Prairies": "#5b9bd5", "West Coast": "#c9a24a", "North": "#8a7ecf" },
  labelAreaRange: [5000, 2000000],
  context: CANADA_CONTEXT,
};

export default function Canada() {
  return <JigsawMap cfg={CANADA_MAP} />;
}
