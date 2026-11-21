import JigsawMap from "@/components/JigsawMap";
import { WEST_AFRICA_DETAILS } from "@/lib/africaDetails";
import type { MapConfig } from "@/lib/mapTypes";
import { WEST_AFRICA, WEST_AFRICA_CONTEXT, SVG_HEIGHT, SVG_WIDTH } from "@/lib/westAfricaData";

export const WEST_AFRICA_MAP: MapConfig = {
  key: "west-africa",
  flag: "🌍",
  title: "West Africa — Interactive Jigsaw",
  subtitle: `${WEST_AFRICA.length} countries • Natural Earth boundary data`,
  noun: "country",
  typeLabel: "Country",
  capitalLabel: "Capital",
  popLabel: "Population (approx.)",
  areaLabel: "Area",
  pieces: WEST_AFRICA,
  width: SVG_WIDTH,
  height: SVG_HEIGHT,
  regionColours: { "Sahel": "#c9a24a", "Coastal West Africa": "#4db8a0" },
  labelAreaRange: [4000, 1300000],
  context: WEST_AFRICA_CONTEXT,
  details: WEST_AFRICA_DETAILS,
};

export default function WestAfrica() {
  return <JigsawMap cfg={WEST_AFRICA_MAP} />;
}
