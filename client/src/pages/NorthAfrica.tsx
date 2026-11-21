import JigsawMap from "@/components/JigsawMap";
import { NORTH_AFRICA_DETAILS } from "@/lib/africaDetails";
import type { MapConfig } from "@/lib/mapTypes";
import { NORTH_AFRICA, NORTH_AFRICA_CONTEXT, SVG_HEIGHT, SVG_WIDTH } from "@/lib/northAfricaData";

export const NORTH_AFRICA_MAP: MapConfig = {
  key: "north-africa",
  flag: "🌍",
  title: "North Africa — Interactive Jigsaw",
  subtitle: `${NORTH_AFRICA.length} pieces • Natural Earth boundary data`,
  noun: "country",
  typeLabel: "Country",
  capitalLabel: "Capital",
  popLabel: "Population (approx.)",
  areaLabel: "Area",
  pieces: NORTH_AFRICA,
  width: SVG_WIDTH,
  height: SVG_HEIGHT,
  regionColours: { "Maghreb": "#e07b54", "Nile Valley": "#c9a24a" },
  labelAreaRange: [100000, 2500000],
  context: NORTH_AFRICA_CONTEXT,
  details: NORTH_AFRICA_DETAILS,
};

export default function NorthAfrica() {
  return <JigsawMap cfg={NORTH_AFRICA_MAP} />;
}
