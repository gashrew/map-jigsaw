import JigsawMap from "@/components/JigsawMap";
import { CENTRAL_AMERICA_DETAILS } from "@/lib/americasDetails";
import type { MapConfig } from "@/lib/mapTypes";
import { CENTRAL_AMERICA, CENTRAL_AMERICA_CONTEXT, SVG_HEIGHT, SVG_WIDTH } from "@/lib/centralAmericaData";

export const CENTRAL_AMERICA_MAP: MapConfig = {
  key: "central-america",
  flag: "🌎",
  title: "Mexico & Central America — Interactive Jigsaw",
  subtitle: `${CENTRAL_AMERICA.length} countries • Natural Earth boundary data`,
  noun: "country",
  typeLabel: "Country",
  capitalLabel: "Capital",
  popLabel: "Population (approx.)",
  areaLabel: "Area",
  pieces: CENTRAL_AMERICA,
  width: SVG_WIDTH,
  height: SVG_HEIGHT,
  regionColours: { "Mexico": "#e07b54", "Central America": "#4db8a0" },
  labelAreaRange: [20000, 2000000],
  context: CENTRAL_AMERICA_CONTEXT,
  details: CENTRAL_AMERICA_DETAILS,
};

export default function CentralAmerica() {
  return <JigsawMap cfg={CENTRAL_AMERICA_MAP} />;
}
