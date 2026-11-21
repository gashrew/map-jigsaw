// Extra facts for the Mexico & Central America and Caribbean maps.
// GDP: IMF World Economic Outlook (April 2026), 2025 estimates in US dollars, via statisticstimes.com.
// The IMF publishes no figures for Cuba.
import type { MapDetails, PieceDetails } from "./mapTypes";

const IMF: Record<string, [number, number]> = {
  MX: [1832641, 13759], GT: [121113, 6599], BZ: [3327, 7954], HN: [39694, 3598], SV: [37268, 5751], NI: [22237, 3337],
  CR: [102902, 19162], PA: [90463, 19814], JM: [22313, 8206], HT: [32102, 2557], DO: [127895, 11749], BS: [16508, 41728],
  PR: [126525, 40620], TT: [25932, 18068], BB: [8017, 27246], AG: [2273, 21676], KN: [1082, 20897], DM: [744, 9895],
  LC: [2651, 14632], VC: [1176, 10866], GD: [1420, 12648],
};

// id: [about, largest city, places, independence, official languages, currency, industries, Wikipedia title, official site]
const RAW: Record<string, [string, string, string, string, string, string, string, string, string]> = {
  MX: ["Mexico was home to the Olmec, Maya and Aztec civilisations; the Aztec capital Tenochtitlan lies beneath Mexico City. It has the world's largest Spanish-speaking population and is a major manufacturing partner of the United States.", "Mexico City (also the capital)", "Mexico City|Guadalajara|Monterrey|Oaxaca|Chichén Itzá|Cancún", "Independence declared 16 September 1810; recognised by Spain 1821", "Spanish and 68 Indigenous languages", "Mexican peso", "Car and parts manufacturing|Electronics|Oil|Tourism|Agriculture: avocados, tomatoes and berries", "Mexico", "https://www.gob.mx"],
  GT: ["Guatemala is the heartland of the Maya, whose cities such as Tikal lie in its northern forests, and about 40% of its people are Indigenous. Volcanoes line its highlands around Lake Atitlán.", "Guatemala City (also the capital)", "Guatemala City|Antigua Guatemala|Tikal|Lake Atitlán|Chichicastenango", "15 September 1821, from Spain", "Spanish", "Quetzal", "Agriculture: coffee, bananas, sugar and cardamom|Money sent home from abroad|Clothing manufacture|Tourism", "Guatemala", "https://www.guatemala.gob.gt"],
  BZ: ["Belize is the only Central American country where English is the official language, a former British colony. Its Barrier Reef is the second-largest in the world, with the famous Great Blue Hole.", "Belize City (Belmopan is the capital)", "Belize City|Belmopan|Great Blue Hole|Ambergris Caye|Caracol", "21 September 1981, from Britain", "English", "Belize dollar", "Tourism|Agriculture: sugar, citrus and bananas|Fishing", "Belize", "https://www.belize.gov.bz"],
  HN: ["Honduras has Caribbean and Pacific coasts, the Maya city of Copán and the Bay Islands. It was the original 'banana republic', a term coined for the power of US fruit companies.", "Tegucigalpa (also the capital)", "Tegucigalpa|San Pedro Sula|Copán|Roatán|Bay Islands", "15 September 1821, from Spain", "Spanish", "Lempira", "Money sent home from abroad|Clothing manufacture|Agriculture: coffee, bananas and palm oil|Shrimp", "Honduras", ""],
  SV: ["El Salvador is the smallest and most densely populated country in Central America, the only one without a Caribbean coast. In 2021 it became the first country to make Bitcoin legal tender.", "San Salvador (also the capital)", "San Salvador|Santa Ana|Joya de Cerén|La Libertad|Ruta de las Flores", "15 September 1821, from Spain", "Spanish", "US dollar", "Money sent home from abroad|Clothing manufacture|Coffee|Services", "El_Salvador", ""],
  NI: ["Nicaragua is the largest country in Central America, with Lake Nicaragua, volcanoes and colonial towns such as Granada and León. A revolution in 1979 was followed by a civil war in the 1980s.", "Managua (also the capital)", "Managua|Granada|León|Lake Nicaragua|Ometepe|Corn Islands", "15 September 1821, from Spain", "Spanish", "Córdoba", "Agriculture: coffee, beef and sugar|Gold mining|Clothing manufacture|Money sent home from abroad", "Nicaragua", ""],
  CR: ["Costa Rica abolished its army in 1948 and is known for stable democracy and conservation: about a quarter of the country is protected, and nearly all its electricity is renewable.", "San José (also the capital)", "San José|Monteverde|Arenal Volcano|Manuel Antonio|Tortuguero|Guanacaste", "15 September 1821, from Spain", "Spanish", "Costa Rican colón", "Medical devices|Tourism and eco-tourism|Agriculture: bananas, pineapples and coffee|Services", "Costa_Rica", "https://www.presidencia.go.cr"],
  PA: ["Panama connects Central and South America. The Panama Canal, opened in 1914 and handed over by the United States in 1999, links the Atlantic and Pacific and is the heart of its economy.", "Panama City (also the capital)", "Panama City|Panama Canal|Colón|Bocas del Toro|San Blas Islands", "3 November 1903, from Colombia", "Spanish", "Balboa (US dollar used)", "Panama Canal|Banking and logistics|Ship registration (the world's largest fleet)|Tourism|Copper", "Panama", "https://www.presidencia.gob.pa"],
  CU: ["Cuba is the largest island in the Caribbean. Since the 1959 revolution led by Fidel Castro it has been a one-party communist state under a long US embargo, known for its cigars, music and classic cars.", "Havana (also the capital)", "Havana|Trinidad|Santiago de Cuba|Viñales|Varadero|Cienfuegos", "20 May 1902, after Spanish rule and US occupation", "Spanish", "Cuban peso", "Tourism|Medical services sent abroad|Nickel|Tobacco and cigars|Sugar and rum", "Cuba", ""],
  JM: ["Jamaica, a former British colony, is famous for reggae and Bob Marley, Blue Mountain coffee and sprinters such as Usain Bolt.", "Kingston (also the capital)", "Kingston|Montego Bay|Ocho Rios|Blue Mountains|Negril|Port Royal", "6 August 1962, from Britain", "English", "Jamaican dollar", "Tourism|Bauxite and alumina|Money sent home from abroad|Agriculture: sugar and coffee|Business outsourcing", "Jamaica", "https://opm.gov.jm"],
  HT: ["Haiti shares the island of Hispaniola with the Dominican Republic. In 1804 it became the first independent nation in Latin America and the first state founded by formerly enslaved people. It is the poorest country in the Americas and has been hit by gang violence and political crisis.", "Port-au-Prince (also the capital)", "Port-au-Prince|Cap-Haïtien|Citadelle Laferrière|Jacmel|Labadee", "1 January 1804, from France", "Haitian Creole and French", "Gourde", "Money sent home from abroad|Clothing manufacture|Agriculture: coffee, mangoes and vetiver", "Haiti", ""],
  DO: ["The Dominican Republic shares Hispaniola with Haiti. Santo Domingo has the oldest European cathedral and university in the Americas, and its beaches make it the Caribbean's most visited country.", "Santo Domingo (also the capital)", "Santo Domingo|Punta Cana|Puerto Plata|Santiago de los Caballeros|Samaná", "27 February 1844, from Haiti", "Spanish", "Dominican peso", "Tourism|Mining: gold and nickel|Free-zone manufacturing|Agriculture: cocoa, sugar and tobacco|Money sent home from abroad", "Dominican_Republic", "https://presidencia.gob.do"],
  PR: ["Puerto Rico has been a territory of the United States since 1898. Puerto Ricans are US citizens but have no vote in Congress or presidential elections. Old San Juan has Spanish forts dating from the 16th century.", "San Juan (also the capital)", "San Juan|El Yunque|Ponce|Vieques|Culebra", "A US territory since 1898", "Spanish and English", "US dollar", "Pharmaceuticals and medical devices|Tourism|Electronics|Government services", "Puerto_Rico", "https://www.pr.gov"],
  BS: ["The Bahamas is a chain of about 700 low coral islands and cays north of Cuba. Columbus is thought to have made his first landfall here in 1492, and it is one of the richest countries in the Americas per person.", "Nassau (also the capital)", "Nassau|Grand Bahama|Exuma|Eleuthera|Andros", "10 July 1973, from Britain", "English", "Bahamian dollar", "Tourism and cruises|Offshore finance|Fishing", "The_Bahamas", "https://www.bahamas.gov.bs"],
  TT: ["Trinidad and Tobago lies just off Venezuela. Its oil and natural gas make it one of the richest Caribbean countries, and Trinidad gave the world the steelpan and calypso, celebrated at its famous Carnival.", "Chaguanas (Port of Spain is the capital)", "Port of Spain|San Fernando|Tobago|Pitch Lake|Maracas Bay", "31 August 1962, from Britain", "English", "Trinidad and Tobago dollar", "Oil and natural gas|Petrochemicals: ammonia and methanol|Financial services|Tourism (Tobago)", "Trinidad_and_Tobago", "https://www.ttconnect.gov.tt"],
  BB: ["Barbados, the most easterly Caribbean island, was a British colony for over 300 years and became a republic in 2021. It is known for cricket, rum and beaches.", "Bridgetown (also the capital)", "Bridgetown|Holetown|Bathsheba|Harrison's Cave|St Nicholas Abbey", "30 November 1966, from Britain; republic since 2021", "English", "Barbadian dollar", "Tourism|Offshore finance|Rum and sugar", "Barbados", "https://www.gov.bb"],
  AG: ["Antigua and Barbuda is known for its 365 beaches, one for every day of the year. Nelson's Dockyard at English Harbour was a Royal Navy base in the 18th century.", "St. John's (also the capital)", "St. John's|English Harbour|Nelson's Dockyard|Barbuda|Shirley Heights", "1 November 1981, from Britain", "English", "East Caribbean dollar", "Tourism|Financial services|Citizenship by investment", "Antigua_and_Barbuda", "https://ab.gov.ag"],
  KN: ["Saint Kitts and Nevis is the smallest country in the Americas, both by area and population. Brimstone Hill Fortress is a World Heritage Site, and Alexander Hamilton was born on Nevis.", "Basseterre (also the capital)", "Basseterre|Charlestown (Nevis)|Brimstone Hill Fortress|Mount Liamuiga", "19 September 1983, from Britain", "English", "East Caribbean dollar", "Tourism|Citizenship by investment|Light manufacturing", "Saint_Kitts_and_Nevis", "https://www.gov.kn"],
  DM: ["Dominica is 'the Nature Island', mountainous and covered in rainforest, with the world's second-largest hot spring, the Boiling Lake. It is home to the Kalinago, the Caribbean's last surviving pre-Columbian people.", "Roseau (also the capital)", "Roseau|Boiling Lake|Morne Trois Pitons|Kalinago Territory|Portsmouth", "3 November 1978, from Britain", "English", "East Caribbean dollar", "Agriculture: bananas|Eco-tourism|Citizenship by investment", "Dominica", ""],
  LC: ["Saint Lucia is a volcanic island known for the Pitons, two steep volcanic peaks that are a World Heritage Site. It changed hands between Britain and France fourteen times.", "Castries (also the capital)", "Castries|The Pitons|Soufrière|Rodney Bay|Marigot Bay", "22 February 1979, from Britain", "English", "East Caribbean dollar", "Tourism|Agriculture: bananas|Citizenship by investment", "Saint_Lucia", "https://www.govt.lc"],
  VC: ["Saint Vincent and the Grenadines is a main volcanic island and a chain of small islands, including Mustique and Bequia. La Soufrière volcano erupted in 2021.", "Kingstown (also the capital)", "Kingstown|Bequia|Mustique|Tobago Cays|La Soufrière", "27 October 1979, from Britain", "English", "East Caribbean dollar", "Tourism and yachting|Agriculture: bananas and arrowroot", "Saint_Vincent_and_the_Grenadines", "https://www.gov.vc"],
  GD: ["Grenada is the 'Spice Isle', a leading producer of nutmeg, which appears on its flag. A US-led invasion in 1983 followed a coup.", "St. George's (also the capital)", "St. George's|Grand Anse Beach|Carriacou|Grand Etang|Underwater Sculpture Park", "7 February 1974, from Britain", "English", "East Caribbean dollar", "Tourism|Spices: nutmeg and mace|Education (St. George's University)", "Grenada", "https://www.gov.gd"],
};

const FLAG: Record<string, string> = { BS: "Flag of the Bahamas.svg", DO: "Flag of the Dominican Republic.svg" };

function build(ids: string[]): Record<string, PieceDetails> {
  const out: Record<string, PieceDetails> = {};
  for (const id of ids) {
    const [about, largest, places, indep, langs, currency, industries, wiki, official] = RAW[id];
    out[id] = {
      about, largestCity: largest, places: places.split("|"),
      type: id === "PR" ? "US territory" : "Country",
      identity: [
        { label: id === "PR" ? "Status" : "Independence", value: indep },
        { label: "Official languages", value: langs },
        { label: "Currency", value: currency },
      ],
      flag: FLAG[id] ?? `Flag of ${wiki.replace(/_/g, " ")}.svg`,
      ...(IMF[id] ? { gdp: IMF[id][0], gdpPerCap: IMF[id][1] } : {}),
      industries: industries.split("|"), wiki, official: official || undefined,
    };
  }
  return out;
}

export const CENTRAL_AMERICA_DETAILS: MapDetails = {
  currency: "US$", gdpYear: 2025,
  gdpSource: "IMF World Economic Outlook (April 2026), 2025 estimates in US dollars",
  national: { label: "the regional average", gdp: 2_249_645, gdpPerCap: 12_090, totalLabel: "the region's total" },
  pieces: build(["MX", "GT", "BZ", "HN", "SV", "NI", "CR", "PA"]),
};
export const CARIBBEAN_DETAILS: MapDetails = {
  currency: "US$", gdpYear: 2025,
  gdpSource: "IMF World Economic Outlook (April 2026), 2025 estimates in US dollars; none for Cuba",
  national: { label: "the Caribbean average", gdp: 368_638, gdpPerCap: 11_508, totalLabel: "the region's total (excluding Cuba)" },
  pieces: build(["CU", "JM", "HT", "DO", "PR", "BS", "TT", "BB", "AG", "KN", "DM", "LC", "VC", "GD"]),
};
