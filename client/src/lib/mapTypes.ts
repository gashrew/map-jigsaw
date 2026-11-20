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
  details?: MapDetails;     // extra facts and links for the information panels
}

// Extra facts for the information panels (optional, per map)
export interface PieceDetails {
  about: string;
  type?: string;                             // overrides the map's typeLabel, e.g. "Territory"
  largestCity?: string;
  places?: string[];                         // places to know
  identity?: { label: string; value: string }[]; // joined/independence, motto, languages…
  flag?: string;                             // Wikimedia Commons file name
  gdp?: number;                              // millions, in the map's currency
  gdpPerCap?: number;
  industries?: string[];
  wiki: string;                              // English Wikipedia article title
  official?: string;                         // official website
  search?: string;                           // search words for YouTube and news (default: name)
}

export interface MapDetails {
  currency: string;                          // "C$", "£", "$"
  gdpYear: number;
  gdpSource: string;
  national: { label: string; gdp: number; gdpPerCap: number };
  searchSuffix?: string;                     // added to YouTube searches, e.g. "Canada"
  news: { label: string; url: (q: string) => string };
  pieces: Record<string, PieceDetails>;
}
