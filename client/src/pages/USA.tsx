import JigsawMap from "@/components/JigsawMap";
import type { MapConfig } from "@/lib/mapTypes";
import { US_STATES, SVG_HEIGHT, SVG_WIDTH } from "@/lib/usStatesData";
import { USA_DETAILS } from "@/lib/usaDetails";

export const USA_MAP: MapConfig = {
  key: "usa",
  flag: "🇺🇸",
  title: "United States — Interactive Jigsaw",
  subtitle: `${US_STATES.length} states • US Census 2020 boundary data`,
  noun: "state",
  typeLabel: "US State",
  capitalLabel: "State capital",
  popLabel: "Population (2020)",
  areaLabel: "Land area",
  pieces: US_STATES,
  width: SVG_WIDTH,
  height: SVG_HEIGHT,
  regionColours: { "Northeast": "#5b9bd5", "Midwest": "#4db8a0", "South": "#e07b54", "West": "#8a7ecf" },
  labelAreaRange: [4000, 700000],
  details: USA_DETAILS,
};

export default function USA() {
  return <JigsawMap cfg={USA_MAP} />;
}
