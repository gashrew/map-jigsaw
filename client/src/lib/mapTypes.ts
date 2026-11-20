// One jigsaw piece (a state, county or country) and the settings a map page needs

export interface MapPiece {
  id: string;
  name: string;
  abbr: string;
  path: string;
  cx: number;   // label point
  cy: number;
  colour: string;
  capital: string;
  region: string;
  pop: number;
  area_km2: number;
  note?: string; // shown in the info panel, e.g. which area the figures cover
}

export interface MapConfig {
  key: string;              // used for saved best times
  flag: string;
  title: string;
  subtitle: string;
  noun: string;             // "state", "country"
  typeLabel: string;        // badge in the info panel, e.g. "US State"
  capitalLabel: string;
  popLabel: string;
  areaLabel: string;
  pieces: MapPiece[];
  width: number;
  height: number;
  regionColours: Record<string, string>;
  labelAreaRange: [number, number]; // area_km2 that gets the smallest and largest label
  context?: string[];       // land outside the jigsaw, drawn in the background
}
