// Extra facts for the South America map's information panels.
// GDP: IMF World Economic Outlook (April 2026), 2025 estimates in US dollars, via statisticstimes.com.
// French Guiana and the Falkland Islands are not covered separately by the IMF.
import type { MapDetails, PieceDetails } from "./mapTypes";

const GDP: Record<string, [number, number]> = {
  AR: [683589, 14355], BO: [65241, 5107], BR: [2279918, 10686], CL: [357401, 17735], CO: [457096, 8623],
  EC: [130321, 7199], GY: [26765, 26994], PY: [49278, 7692], PE: [341956, 9911], SR: [4738, 7099],
  UY: [85575, 24549], VE: [101492, 3736],
};

// id: [about, largest city, places, languages, currency, independence, industries, Wikipedia title, official site]
const RAW: Record<string, [string, string, string, string, string, string, string, string, string]> = {
  AR: ["Argentina stretches from the subtropical north to Tierra del Fuego, taking in the Andes, the Pampas grasslands and Patagonia. Buenos Aires is famous for the tango, and the country is known for beef, wine and football.", "Buenos Aires (also the capital)", "Buenos Aires|Córdoba|Rosario|Mendoza|Iguazú Falls|Ushuaia", "Spanish", "Argentine peso", "9 July 1816, from Spain", "Agriculture: soybeans, wheat and beef|Wine|Car manufacturing|Oil and gas (Vaca Muerta)|Lithium", "Argentina", "https://www.argentina.gob.ar"],
  BO: ["Bolivia is landlocked, high in the Andes, with a majority Indigenous population. La Paz is the world's highest seat of government, and the Salar de Uyuni is the largest salt flat on Earth.", "Santa Cruz de la Sierra", "La Paz|Santa Cruz|Sucre|Potosí|Salar de Uyuni|Lake Titicaca", "Spanish and 36 Indigenous languages", "Boliviano", "6 August 1825, from Spain", "Natural gas|Mining: silver, zinc and tin|Agriculture: soybeans|Lithium reserves", "Bolivia", "https://www.presidencia.gob.bo"],
  BR: ["Brazil is the largest country in South America, covering nearly half the continent and most of the Amazon rainforest. A Portuguese colony until 1822, it was an empire until 1889, and it is the world's largest Portuguese-speaking country.", "São Paulo (Brasília is the capital)", "São Paulo|Rio de Janeiro|Brasília|Salvador|Manaus|Iguaçu Falls", "Portuguese", "Brazilian real", "7 September 1822, from Portugal", "Agriculture: soybeans, coffee, sugar and beef|Iron ore mining|Oil (offshore)|Aircraft (Embraer)|Car manufacturing", "Brazil", "https://www.gov.br"],
  CL: ["Chile is a ribbon of land about 4,300 km long and rarely more than 350 km wide, between the Andes and the Pacific. The Atacama in the north is the driest non-polar desert in the world; Patagonia in the south has glaciers and fjords.", "Santiago (also the capital)", "Santiago|Valparaíso|Concepción|Atacama Desert|Torres del Paine|Easter Island", "Spanish", "Chilean peso", "12 February 1818, from Spain", "Copper mining (the world's largest producer)|Lithium|Fruit and wine|Salmon farming|Forestry", "Chile", "https://www.gob.cl"],
  CO: ["Colombia is the only South American country with both Caribbean and Pacific coasts. It is one of the most biodiverse countries on Earth, famous for coffee, emeralds and flowers; Gabriel García Márquez was born here.", "Bogotá (also the capital)", "Bogotá|Medellín|Cali|Cartagena|Barranquilla|The Coffee Region", "Spanish", "Colombian peso", "20 July 1810, from Spain", "Oil and coal|Coffee|Flowers|Emeralds|Tourism", "Colombia", "https://www.presidencia.gov.co"],
  EC: ["Ecuador is named after the Equator, which runs through it. It includes the Andes, part of the Amazon and the Galápagos Islands, whose wildlife inspired Darwin's theory of evolution. It uses the US dollar.", "Guayaquil", "Quito|Guayaquil|Cuenca|Cotopaxi|Galápagos Islands", "Spanish (with Kichwa and Shuar for intercultural relations)", "US dollar", "24 May 1822, from Spain", "Oil|Bananas (the world's largest exporter)|Shrimp|Cut flowers|Cocoa", "Ecuador", "https://www.gob.ec"],
  GY: ["Guyana is the only English-speaking country in South America, a former British colony with Caribbean links. Huge offshore oil discoveries since 2015 have made its economy the fastest-growing in the world.", "Georgetown (also the capital)", "Georgetown|Linden|Kaieteur Falls|Rupununi savannah", "English", "Guyanese dollar", "26 May 1966, from Britain", "Oil (offshore)|Gold and bauxite mining|Sugar and rice|Timber", "Guyana", "https://op.gov.gy"],
  PY: ["Paraguay is landlocked, split by the Paraguay River into the fertile east and the dry Chaco to the west. Most people speak Guaraní, an Indigenous language, as well as Spanish.", "Asunción (also the capital)", "Asunción|Ciudad del Este|Encarnación|Itaipú Dam|Jesuit missions", "Spanish and Guaraní", "Guaraní", "14 May 1811, from Spain", "Hydroelectric power (Itaipú Dam)|Agriculture: soybeans and beef|Re-export trade", "Paraguay", "https://www.paraguay.gov.py"],
  PE: ["Peru was the heart of the Inca Empire, whose capital was Cusco, and Machu Picchu is South America's most famous ruin. It runs from the desert coast over the Andes into the Amazon.", "Lima (also the capital)", "Lima|Cusco|Arequipa|Machu Picchu|Lake Titicaca|Nazca Lines", "Spanish, Quechua and Aymara", "Sol", "28 July 1821, from Spain", "Mining: copper, gold and silver|Fishing and fishmeal|Agriculture: avocados and blueberries|Tourism", "Peru", "https://www.gob.pe"],
  SR: ["Suriname is the smallest independent country in South America and a former Dutch colony, so Dutch is its official language. Its people descend from Africa, India, Indonesia, China, Europe and the Indigenous Americas.", "Paramaribo (also the capital)", "Paramaribo|Nieuw Nickerie|Brokopondo Reservoir|Central Suriname Nature Reserve", "Dutch", "Surinamese dollar", "25 November 1975, from the Netherlands", "Gold mining|Oil|Bauxite and alumina|Rice and bananas", "Suriname", "https://www.gov.sr"],
  UY: ["Uruguay is a small, stable country between Argentina and Brazil, known for its beaches, cattle ranches and progressive laws. It hosted and won the first football World Cup in 1930.", "Montevideo (also the capital)", "Montevideo|Punta del Este|Colonia del Sacramento|Salto", "Spanish", "Uruguayan peso", "25 August 1825, from Brazil", "Agriculture: beef, soybeans and rice|Wood pulp|Software and services|Tourism", "Uruguay", "https://www.gub.uy"],
  VE: ["Venezuela has the largest proven oil reserves in the world and Angel Falls, the highest waterfall. Economic collapse since the 2010s has led around eight million people to emigrate.", "Caracas (also the capital)", "Caracas|Maracaibo|Valencia|Angel Falls|Los Roques|Mérida", "Spanish", "Bolívar", "5 July 1811, from Spain", "Oil|Mining: gold and iron ore|Agriculture", "Venezuela", ""],
  GF: ["French Guiana is an overseas region of France, so it is part of the European Union and uses the euro. Europe's spaceport at Kourou launches Ariane rockets, and most of the territory is rainforest.", "Cayenne (also the capital)", "Cayenne|Kourou|Saint-Laurent-du-Maroni|Îles du Salut", "French", "Euro", "Part of France (French since the 17th century; an overseas department since 1946)", "Space launches (Guiana Space Centre)|Gold mining|Fishing|Public services", "French_Guiana", "https://www.ctguyane.fr"],
  FK: ["The Falkland Islands are a British Overseas Territory in the South Atlantic, home to about 3,700 people and many penguins. Argentina also claims them, and the two countries fought a war over them in 1982.", "Stanley (also the capital)", "Stanley|East Falkland|West Falkland|Goose Green", "English", "Falkland Islands pound", "British Overseas Territory; claimed by Argentina", "Fishing licences, especially for squid|Sheep farming|Tourism", "Falkland_Islands", "https://www.falklands.gov.fk"],
};

const FLAG: Record<string, string> = { GF: "Flag of France.svg", FK: "Flag of the Falkland Islands.svg" };
const IDENT_LABEL: Record<string, string> = { GF: "Status", FK: "Status" };

const pieces: Record<string, PieceDetails> = {};
for (const [id, [about, largest, places, langs, currency, indep, industries, wiki, official]] of Object.entries(RAW)) {
  pieces[id] = {
    about, largestCity: largest, places: places.split("|"),
    type: id === "GF" ? "Overseas region of France" : id === "FK" ? "British Overseas Territory" : "Country",
    identity: [
      { label: IDENT_LABEL[id] ?? "Independence", value: indep },
      { label: "Official languages", value: langs },
      { label: "Currency", value: currency },
    ],
    flag: FLAG[id] ?? `Flag of ${wiki.replace(/_/g, " ")}.svg`,
    ...(GDP[id] ? { gdp: GDP[id][0], gdpPerCap: GDP[id][1] } : {}),
    industries: industries.split("|"),
    wiki, official: official || undefined,
  };
}

export const SOUTH_AMERICA_DETAILS: MapDetails = {
  currency: "US$",
  gdpYear: 2025,
  gdpSource: "IMF World Economic Outlook (April 2026), 2025 estimates in US dollars",
  national: { label: "the South American average", gdp: 4_583_370, gdpPerCap: 10_466, totalLabel: "South America's total" },
  pieces,
};
