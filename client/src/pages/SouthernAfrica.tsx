import JigsawMap from "@/components/JigsawMap";
import { SOUTHERN_AFRICA_DETAILS } from "@/lib/africaDetails";
import type { MapConfig } from "@/lib/mapTypes";
import { SOUTHERN_AFRICA, SOUTHERN_AFRICA_CONTEXT, SVG_HEIGHT, SVG_WIDTH } from "@/lib/southernAfricaData";

export const SOUTHERN_AFRICA_MAP: MapConfig = {
  key: "southern-africa",
  flag: "🌍",
  title: "Southern Africa — Interactive Jigsaw",
  subtitle: `${SOUTHERN_AFRICA.length} countries • Natural Earth boundary data`,
  noun: "country",
  typeLabel: "Country",
  capitalLabel: "Capital",
  popLabel: "Population (approx.)",
  areaLabel: "Area",
  pieces: SOUTHERN_AFRICA,
  width: SVG_WIDTH,
  height: SVG_HEIGHT,
  regionColours: { "Southern mainland": "#5b9bd5", "Indian Ocean islands": "#e07b54" },
  labelAreaRange: [450, 1200000],
  context: SOUTHERN_AFRICA_CONTEXT,
  details: SOUTHERN_AFRICA_DETAILS,
};

export default function SouthernAfrica() {
  return <JigsawMap cfg={SOUTHERN_AFRICA_MAP} />;
}
