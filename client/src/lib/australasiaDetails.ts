// Extra facts for the Australia and New Zealand maps.
// Australia: ABS Australian National Accounts: State Accounts 2024-25 (gross state product), as compiled on Wikipedia.
// New Zealand: Stats NZ regional GDP, year ended March 2025, via Figure.NZ.
import type { MapDetails, PieceDetails } from "./mapTypes";

// ─── Australia ────────────────────────────────────────────────────────────────
const AU_GDP: Record<string, [number, number]> = {
  NSW: [829130, 96479], VIC: [615414, 86990], QLD: [523847, 92392], WA: [461658, 151677],
  SA: [151803, 79780], TAS: [42821, 74342], NT: [33960, 128442], ACT: [57582, 118775],
};
// id: [about, largest city, places, became a colony / territory, nickname, industries, Wikipedia title, official site, flag]
const AU: Record<string, [string, string, string, string, string, string, string, string, string]> = {
  NSW: ["New South Wales is where British settlement in Australia began, with the First Fleet's arrival at Sydney Cove in 1788. Sydney, with its harbour, Opera House and bridge, is the country's largest city and financial centre.", "Sydney (also the capital)", "Sydney|Blue Mountains|Newcastle|Byron Bay|Hunter Valley|Wollongong", "Colony from 26 January 1788; state at Federation, 1 January 1901", "The Premier State", "Finance and professional services|Tourism and education|Coal mining|Agriculture: wheat, beef and wool|Manufacturing", "New_South_Wales", "https://www.nsw.gov.au", "Flag of New South Wales.svg"],
  VIC: ["Victoria is mainland Australia's smallest state but its second most populous. The 1850s gold rush made Melbourne one of the richest cities in the world, and it remains Australia's cultural and sporting capital.", "Melbourne (also the capital)", "Melbourne|Great Ocean Road|Ballarat|Bendigo|Phillip Island|Grampians", "Separate colony from 1 July 1851; state 1901", "The Garden State", "Finance and professional services|Education|Manufacturing and food processing|Agriculture: dairy and wine|Tourism and events", "Victoria_(state)", "https://www.vic.gov.au", "Flag of Victoria (Australia).svg"],
  QLD: ["Queensland is Australia's second-largest state, stretching from subtropical Brisbane to the tropical north. The Great Barrier Reef, the world's largest coral reef system, runs along its coast, and the Daintree is one of the oldest rainforests on Earth.", "Brisbane (also the capital)", "Brisbane|Gold Coast|Cairns|Great Barrier Reef|Townsville|Daintree Rainforest", "Separate colony from 6 June 1859; state 1901", "The Sunshine State", "Mining: coal, gas and metals|Tourism|Agriculture: beef and sugar cane|Construction", "Queensland", "https://www.qld.gov.au", "Flag of Queensland.svg"],
  WA: ["Western Australia covers a third of the continent and is one of the largest sub-national areas in the world. Its iron ore mines in the Pilbara supply much of the world's steel industry, and Perth is one of the most isolated big cities on Earth.", "Perth (also the capital)", "Perth|Fremantle|Broome|Margaret River|Kimberley|Ningaloo Reef", "Colony from 1829 (Swan River Colony); state 1901", "The Wildflower State", "Iron ore mining|Liquefied natural gas|Gold and lithium|Agriculture: wheat|Tourism", "Western_Australia", "https://www.wa.gov.au", "Flag of Western Australia.svg"],
  SA: ["South Australia was settled by free colonists rather than convicts, and in 1894 it became one of the first places in the world to give women the vote. It is famous for its wine regions, especially the Barossa Valley.", "Adelaide (also the capital)", "Adelaide|Barossa Valley|Kangaroo Island|Flinders Ranges|Coober Pedy", "Province from 28 December 1836; state 1901", "The Festival State", "Wine|Defence: shipbuilding and submarines|Mining: copper and uranium|Agriculture|Renewable energy", "South_Australia", "https://www.sa.gov.au", "Flag of South Australia.svg"],
  TAS: ["Tasmania is an island state south of the mainland, with large areas of wilderness and World Heritage national parks. Founded as Van Diemen's Land, it held many of Australia's convicts, and Port Arthur's prison ruins remain.", "Hobart (also the capital)", "Hobart|Launceston|Cradle Mountain|Port Arthur|Freycinet|Bruny Island", "Separate colony from 1825 (as Van Diemen's Land); state 1901", "The Apple Isle", "Tourism|Agriculture and aquaculture: salmon|Hydroelectric power|Forestry|Food and drink", "Tasmania", "https://www.tas.gov.au", "Flag of Tasmania.svg"],
  NT: ["The Northern Territory runs from the tropical Top End around Darwin to the red desert centre around Uluru. Aboriginal people make up about a quarter of its population, the highest share anywhere in Australia.", "Darwin (also the capital)", "Darwin|Uluru|Alice Springs|Kakadu National Park|Katherine Gorge|Arnhem Land", "Territory of the Commonwealth from 1911; self-government 1978", "The Top End", "Mining and gas|Defence|Tourism|Government services|Cattle", "Northern_Territory", "https://nt.gov.au", "Flag of the Northern Territory.svg"],
  ACT: ["The Australian Capital Territory was created as a compromise when Sydney and Melbourne both wanted to be the capital. Canberra, a planned city designed by Walter Burley Griffin, has been the seat of government since 1927.", "Canberra (also the capital)", "Canberra|Parliament House|Lake Burley Griffin|Australian War Memorial|Namadgi National Park", "Territory from 1911; self-government 1989", "The Nation's Capital", "Federal government|Education and research|Defence|Professional services", "Australian_Capital_Territory", "https://www.act.gov.au", "Flag of the Australian Capital Territory.svg"],
};

const auPieces: Record<string, PieceDetails> = {};
for (const [id, [about, largest, places, formed, nick, industries, wiki, official, flag]] of Object.entries(AU)) {
  auPieces[id] = {
    about, largestCity: largest, places: places.split("|"),
    type: id === "NT" || id === "ACT" ? "Territory" : "State",
    identity: [{ label: "Founded", value: formed }, { label: "Nickname", value: nick }],
    flag, gdp: AU_GDP[id][0], gdpPerCap: AU_GDP[id][1],
    industries: industries.split("|"), wiki, official,
    search: wiki.replace(/_\(state\)$/, "").replace(/_/g, " "),
  };
}

export const AUSTRALIA_DETAILS: MapDetails = {
  currency: "A$",
  gdpYear: "2024-25",
  gdpSource: "Australian Bureau of Statistics, Australian National Accounts: State Accounts 2024-25 (gross state product)",
  national: { label: "Australia", gdp: 2_716_216, gdpPerCap: 98_362 },
  econNote: "In 2024-25 one Australian dollar was worth about 65 US cents (roughly 51p).",
  searchSuffix: "Australia",
  pieces: auPieces,
};

// ─── New Zealand ──────────────────────────────────────────────────────────────
const NZ_GDP: Record<string, [number | undefined, number]> = {
  NTL: [11645, 57992], AUK: [161800, 89521], WKO: [38306, 72330], BOP: [25041, 71343], GIS: [3093, 58588],
  HKB: [12580, 69966], TKI: [11088, 85095], MWT: [17146, 65844], WGN: [51317, 94438], TAS: [undefined, 68194],
  NSN: [undefined, 68194], MBH: [4249, 83484], WTC: [2687, 77650], CAN: [55505, 79852], OTA: [19269, 76101],
  STL: [9943, 95061],
};
// id: [about, largest town, places, Māori name, industries, Wikipedia title, council website]
const NZ: Record<string, [string, string, string, string, string, string, string]> = {
  NTL: ["Northland is the 'winterless north', a long subtropical peninsula. The Treaty of Waitangi, New Zealand's founding document, was signed here in 1840, and the Bay of Islands is a favourite holiday spot.", "Whangārei", "Whangārei|Bay of Islands|Waitangi Treaty Grounds|Cape Reinga|Waipoua Forest", "Te Tai Tokerau", "Agriculture: dairy and beef|Forestry|Tourism|Horticulture: avocados and kiwifruit", "Northland_Region", "https://www.nrc.govt.nz"],
  AUK: ["Auckland is New Zealand's largest city, home to about a third of its people, spread across volcanic cones between two harbours. It has one of the largest Polynesian populations of any city in the world.", "Auckland", "Auckland CBD|Sky Tower|Waiheke Island|Rangitoto|Waitākere Ranges", "Tāmaki Makaurau", "Finance and business services|Ports and logistics|Tourism and education|Manufacturing|Technology", "Auckland_Region", "https://www.aucklandcouncil.govt.nz"],
  WKO: ["Waikato, named after New Zealand's longest river, is rich dairy country. It includes Hamilton, Lake Taupō, the Waitomo glow-worm caves and Hobbiton, the film set from The Lord of the Rings.", "Hamilton", "Hamilton|Lake Taupō|Waitomo Caves|Hobbiton|Coromandel Peninsula", "Waikato", "Dairy farming|Energy: geothermal and hydro|Tourism|Agricultural research", "Waikato", "https://www.waikatoregion.govt.nz"],
  BOP: ["The Bay of Plenty has sunny beaches, kiwifruit orchards and the geothermal wonders and Māori culture of Rotorua. The Port of Tauranga is the country's busiest.", "Tauranga", "Tauranga|Rotorua|Whakatāne|Mount Maunganui|Whakaari / White Island", "Te Moana-a-Toi", "Horticulture: kiwifruit and avocados|Port of Tauranga|Forestry and wood processing|Tourism", "Bay_of_Plenty_Region", "https://www.boprc.govt.nz"],
  GIS: ["Gisborne, on the East Cape, is the first city in the world to see the sunrise each day. Cook made his first New Zealand landfall here in 1769, and many of its people are Māori.", "Gisborne", "Gisborne|East Cape|Tolaga Bay|Eastwoodhill Arboretum", "Te Tairāwhiti", "Forestry|Agriculture: sheep and beef|Horticulture and wine", "Gisborne_District", "https://www.gdc.govt.nz"],
  HKB: ["Hawke's Bay is a sunny wine and fruit-growing region. Napier was rebuilt in Art Deco style after the 1931 earthquake, and Cyclone Gabrielle caused great damage in 2023.", "Napier (with neighbouring Hastings)", "Napier|Hastings|Cape Kidnappers|Te Mata Peak|Havelock North", "Te Matau-a-Māui", "Horticulture: apples|Wine|Agriculture: sheep and beef|Food processing", "Hawke's_Bay_Region", "https://www.hbrc.govt.nz"],
  TKI: ["Taranaki is dominated by Mount Taranaki, a near-perfect volcanic cone. It is New Zealand's only oil- and gas-producing region and a centre of dairy farming.", "New Plymouth", "New Plymouth|Mount Taranaki|Egmont National Park|Hāwera|Pukekura Park", "Taranaki", "Oil and gas|Dairy farming|Engineering|Energy", "Taranaki", "https://www.trc.govt.nz"],
  MWT: ["Manawatū-Whanganui covers the lower centre of the North Island, from the volcanic Tongariro National Park to the coast. The Whanganui River was the first river in the world to be granted legal personhood, in 2017.", "Palmerston North", "Palmerston North|Whanganui|Tongariro National Park|Ruapehu|Feilding", "Manawatū-Whanganui", "Agriculture: sheep, beef and dairy|Education and research|Defence|Logistics", "Manawatū-Whanganui", "https://www.horizons.govt.nz"],
  WGN: ["Wellington, at the southern tip of the North Island, is New Zealand's capital and seat of Parliament. It is known as a windy, hilly harbour city with a strong arts and film industry, including Weta Workshop.", "Wellington (the capital)", "Wellington|Te Papa|The Beehive|Lower Hutt|Wairarapa|Martinborough", "Te Upoko-o-te-Ika-a-Māui", "Government|Finance and professional services|Film and creative industries|Technology", "Wellington_Region", "https://www.gw.govt.nz"],
  TAS: ["Tasman, at the top of the South Island, is New Zealand's sunniest region, with Abel Tasman National Park's golden beaches and hop, apple and vineyard country.", "Richmond", "Richmond|Abel Tasman National Park|Golden Bay|Motueka|Kahurangi National Park", "Te Tai-o-Aorere", "Horticulture: apples and hops|Fishing and seafood|Forestry|Tourism", "Tasman_District", "https://www.tasman.govt.nz"],
  NSN: ["Nelson is a small, sunny city at the top of the South Island, known for its arts and crafts and as the gateway to three national parks. It is home to one of the largest fishing ports in Australasia.", "Nelson", "Nelson|Tāhunanui Beach|Centre of New Zealand|Founders Park", "Whakatū", "Fishing and seafood|Tourism|Arts and crafts|Horticulture", "Nelson,_New_Zealand", "https://www.nelson.govt.nz"],
  MBH: ["Marlborough is New Zealand's largest wine region, famous worldwide for Sauvignon Blanc. The drowned valleys of the Marlborough Sounds and the Picton ferry link the South Island with Wellington.", "Blenheim", "Blenheim|Picton|Marlborough Sounds|Kaikōura (nearby)|Queen Charlotte Track", "Te Tauihu-o-te-Waka", "Wine: Sauvignon Blanc|Aquaculture: green-lipped mussels and salmon|Forestry|Tourism", "Marlborough_Region", "https://www.marlborough.govt.nz"],
  WTC: ["The West Coast is a long, wet and thinly populated strip between the Southern Alps and the Tasman Sea. Its gold and coal rushes built the towns, and the Franz Josef and Fox glaciers draw visitors.", "Greymouth", "Greymouth|Hokitika|Westport|Franz Josef Glacier|Punakaiki Pancake Rocks", "Te Tai Poutini", "Mining: coal and gold|Dairy farming|Tourism|Pounamu (greenstone) carving", "West_Coast,_New_Zealand", "https://www.wcrc.govt.nz"],
  CAN: ["Canterbury is New Zealand's largest region, running from the Southern Alps across the Canterbury Plains to the Pacific. Christchurch, rebuilt after the 2010–11 earthquakes, is the South Island's largest city.", "Christchurch", "Christchurch|Kaikōura|Akaroa|Aoraki / Mount Cook|Lake Tekapo|Timaru", "Waitaha", "Agriculture: dairy, sheep and grain|Manufacturing|Tourism|Education", "Canterbury_Region", "https://www.ecan.govt.nz"],
  OTA: ["Otago combines the Scottish-founded city of Dunedin with the mountains and lakes of Queenstown and Wānaka. Its 1860s gold rush made Dunedin briefly New Zealand's richest city.", "Dunedin", "Dunedin|Queenstown|Wānaka|Otago Peninsula|Central Otago|Oamaru", "Ōtākou", "Tourism and adventure sports|Education (University of Otago)|Wine: Pinot Noir|Agriculture", "Otago", "https://www.orc.govt.nz"],
  STL: ["Southland is New Zealand's southernmost region, with Fiordland's Milford Sound, Stewart Island / Rakiura and rich farmland. The Tiwai Point smelter near Bluff produces aluminium using hydro power.", "Invercargill", "Invercargill|Milford Sound|Fiordland|Stewart Island / Rakiura|Bluff|Te Anau", "Murihiku", "Dairy and sheep farming|Aluminium smelting (Tiwai Point)|Tourism|Fishing: oysters", "Southland,_New_Zealand", "https://www.es.govt.nz"],
};

const nzPieces: Record<string, PieceDetails> = {};
for (const [id, [about, largest, places, maori, industries, wiki, official]] of Object.entries(NZ)) {
  const [g, pc] = NZ_GDP[id];
  nzPieces[id] = {
    about, largestCity: largest, places: places.split("|"),
    type: id === "AUK" || id === "GIS" || id === "TAS" || id === "NSN" || id === "MBH" ? "Unitary authority region" : "Region",
    identity: [{ label: "Māori name", value: maori }, { label: "Island", value: ["TAS", "NSN", "MBH", "WTC", "CAN", "OTA", "STL"].includes(id) ? "South Island" : "North Island" }],
    ...(g != null ? { gdp: g } : {}), gdpPerCap: pc,
    industries: industries.split("|"), wiki, official,
    search: wiki.replace(/_(Region|District)$/, "").replace(/,_New_Zealand$/, "").replace(/_/g, " "),
  };
}

export const NEW_ZEALAND_DETAILS: MapDetails = {
  currency: "NZ$",
  gdpYear: "year to March 2025",
  gdpSource: "Stats NZ, regional gross domestic product, year ended March 2025",
  national: { label: "New Zealand", gdp: 431_457, gdpPerCap: 81_283 },
  econNote: "Stats NZ publishes Nelson and Tasman together, so both show the combined figure per person. In 2024-25 one New Zealand dollar was worth about 59 US cents (roughly 46p).",
  searchSuffix: "New Zealand",
  pieces: nzPieces,
};
