import JigsawMap from "@/components/JigsawMap";
import { CENTRAL_EAST_AFRICA_DETAILS } from "@/lib/africaDetails";
import type { MapConfig } from "@/lib/mapTypes";
import { CENTRAL_EAST_AFRICA, CENTRAL_EAST_AFRICA_CONTEXT, SVG_HEIGHT, SVG_WIDTH } from "@/lib/centralEastAfricaData";

export const CENTRAL_EAST_AFRICA_MAP: MapConfig = {
  key: "central-east-africa",
  flag: "🌍",
  title: "Central & East Africa — Interactive Jigsaw",
  subtitle: `${CENTRAL_EAST_AFRICA.length} countries • Natural Earth boundary data`,
  noun: "country",
  typeLabel: "Country",
  capitalLabel: "Capital",
  popLabel: "Population (approx.)",
  areaLabel: "Area",
  pieces: CENTRAL_EAST_AFRICA,
  width: SVG_WIDTH,
  height: SVG_HEIGHT,
  regionColours: { "Central Africa": "#8a7ecf", "Horn of Africa": "#e07b54", "East Africa": "#4db8a0" },
  labelAreaRange: [1000, 2400000],
  context: CENTRAL_EAST_AFRICA_CONTEXT,
  details: CENTRAL_EAST_AFRICA_DETAILS,
};

export default function CentralEastAfrica() {
  return <JigsawMap cfg={CENTRAL_EAST_AFRICA_MAP} />;
}
