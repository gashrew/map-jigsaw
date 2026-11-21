import JigsawMap from "@/components/JigsawMap";
import { SOUTH_CENTRAL_ASIA_DETAILS } from "@/lib/asiaDetails";
import type { MapConfig } from "@/lib/mapTypes";
import { SOUTH_CENTRAL_ASIA, SOUTH_CENTRAL_ASIA_CONTEXT, SVG_HEIGHT, SVG_WIDTH } from "@/lib/southCentralAsiaData";

export const SOUTH_CENTRAL_ASIA_MAP: MapConfig = {
  key: "south-central-asia",
  flag: "🌏",
  title: "South & Central Asia — Interactive Jigsaw",
  subtitle: `${SOUTH_CENTRAL_ASIA.length} countries • Natural Earth boundary data`,
  noun: "country",
  typeLabel: "Country",
  capitalLabel: "Capital",
  popLabel: "Population (approx.)",
  areaLabel: "Area",
  pieces: SOUTH_CENTRAL_ASIA,
  width: SVG_WIDTH,
  height: SVG_HEIGHT,
  regionColours: { "South Asia": "#e07b54", "Central Asia": "#5b9bd5" },
  labelAreaRange: [300, 3000000],
  context: SOUTH_CENTRAL_ASIA_CONTEXT,
  details: SOUTH_CENTRAL_ASIA_DETAILS,
};

export default function SouthCentralAsia() {
  return <JigsawMap cfg={SOUTH_CENTRAL_ASIA_MAP} />;
}
