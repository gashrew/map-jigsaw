import JigsawMap from "@/components/JigsawMap";
import { NEW_ZEALAND_DETAILS } from "@/lib/australasiaDetails";
import type { MapConfig } from "@/lib/mapTypes";
import { NEW_ZEALAND, NEW_ZEALAND_CONTEXT, SVG_HEIGHT, SVG_WIDTH } from "@/lib/newZealandData";

export const NEW_ZEALAND_MAP: MapConfig = {
  key: "new-zealand",
  flag: "🇳🇿",
  title: "New Zealand — Interactive Jigsaw",
  subtitle: `${NEW_ZEALAND.length} regions • Natural Earth boundary data`,
  noun: "region",
  typeLabel: "Region",
  capitalLabel: "Main city",
  popLabel: "Population (approx.)",
  areaLabel: "Land area",
  pieces: NEW_ZEALAND,
  width: SVG_WIDTH,
  height: SVG_HEIGHT,
  regionColours: { "North Island": "#5b9bd5", "South Island": "#4db8a0" },
  labelAreaRange: [400, 45000],
  context: NEW_ZEALAND_CONTEXT,
  details: NEW_ZEALAND_DETAILS,
};

export default function NewZealand() {
  return <JigsawMap cfg={NEW_ZEALAND_MAP} />;
}
