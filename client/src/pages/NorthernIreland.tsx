import JigsawMap from "@/components/JigsawMap";
import { NORTHERN_IRELAND_DETAILS } from "@/lib/ukNationsDetails";
import type { MapConfig } from "@/lib/mapTypes";
import { NORTHERN_IRELAND, NORTHERN_IRELAND_CONTEXT, SVG_HEIGHT, SVG_WIDTH } from "@/lib/northernIrelandData";

export const NORTHERN_IRELAND_MAP: MapConfig = {
  key: "northern-ireland",
  flag: "🇬🇧",
  title: "Northern Ireland — Interactive Jigsaw",
  subtitle: `${NORTHERN_IRELAND.length} districts • Natural Earth boundary data`,
  noun: "district",
  typeLabel: "District",
  capitalLabel: "Admin centre",
  popLabel: "Population (approx.)",
  areaLabel: "Area",
  pieces: NORTHERN_IRELAND,
  width: SVG_WIDTH,
  height: SVG_HEIGHT,
  regionColours: { "Northern Ireland": "#5b9bd5" },
  labelAreaRange: [130, 2900],
  context: NORTHERN_IRELAND_CONTEXT,
  details: NORTHERN_IRELAND_DETAILS,
};

export default function NorthernIreland() {
  return <JigsawMap cfg={NORTHERN_IRELAND_MAP} />;
}
