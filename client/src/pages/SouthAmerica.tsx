import JigsawMap from "@/components/JigsawMap";
import type { MapConfig } from "@/lib/mapTypes";
import { SOUTH_AMERICA, SOUTH_AMERICA_CONTEXT, SVG_HEIGHT, SVG_WIDTH } from "@/lib/southAmericaData";

export const SOUTH_AMERICA_MAP: MapConfig = {
  key: "south-america",
  flag: "🌎",
  title: "South America — Interactive Jigsaw",
  subtitle: `12 countries and 2 territories • Natural Earth boundary data`,
  noun: "country",
  typeLabel: "Country",
  capitalLabel: "Capital",
  popLabel: "Population (approx.)",
  areaLabel: "Area",
  pieces: SOUTH_AMERICA,
  width: SVG_WIDTH,
  height: SVG_HEIGHT,
  regionColours: { "Andean": "#e07b54", "Southern Cone": "#5b9bd5", "Guianas": "#4db8a0", "Brazil": "#8a7ecf" },
  labelAreaRange: [10000, 3000000],
  context: SOUTH_AMERICA_CONTEXT,
};

export default function SouthAmerica() {
  return <JigsawMap cfg={SOUTH_AMERICA_MAP} />;
}
