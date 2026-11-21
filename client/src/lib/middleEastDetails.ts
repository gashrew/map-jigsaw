// Extra facts for the Middle East map's information panels.
// GDP: IMF World Economic Outlook, 2025 estimates in US dollars, via statisticstimes.com
// (GDP totals from the October 2026 edition, GDP per person from the April 2026 edition).
// The IMF has published no figures for Syria since the civil war.
import type { MapDetails, PieceDetails } from "./mapTypes";

const GDP: Record<string, [number, number]> = {
  BH: [48966, 29344], CY: [41202, 41730], EG: [364638, 3379], IR: [371123, 4264], IQ: [264167, 5803],
  IL: [616560, 60335], JO: [61697, 5355], KW: [157199, 30877], LB: [34494, 6443], OM: [109432, 19996],
  PS: [17167, 3171], QA: [215560, 69680], SA: [1273555, 35464], TR: [1602867, 18611], AE: [614398, 50232],
  YE: [7860, 420],
};

// id: [about, largest city, places, founded / independence, languages, currency, industries, Wikipedia title, official site]
const RAW: Record<string, [string, string, string, string, string, string, string, string, string]> = {
  BH: ["Bahrain is a small island kingdom in the Gulf, linked to Saudi Arabia by a 25 km causeway. It was the centre of the ancient Dilmun civilisation and of pearl diving, and was the first Gulf state to strike oil, in 1932.", "Manama (also the capital)", "Manama|Muharraq|Riffa|Qal'at al-Bahrain|Bahrain International Circuit", "15 August 1971, from Britain", "Arabic", "Bahraini dinar", "Oil refining|Aluminium smelting|Banking and Islamic finance|Tourism and motor racing", "Bahrain", "https://www.bahrain.bh"],
  CY: ["Cyprus is a large island in the eastern Mediterranean, divided since 1974: the north is controlled by a Turkish Cypriot administration recognised only by Türkiye. It has been part of the EU since 2004 and is said to be the birthplace of Aphrodite.", "Nicosia (also the capital)", "Nicosia|Limassol|Larnaca|Paphos|Troodos Mountains", "16 August 1960, from Britain", "Greek and Turkish", "Euro", "Tourism|Shipping|Financial and professional services|Real estate", "Cyprus", "https://www.gov.cy"],
  EG: ["Egypt is the most populous Arab country, and almost all of its people live along the Nile and its delta. It is home to the pyramids of Giza and the temples of Luxor, and the Suez Canal, opened in 1869, links the Mediterranean with the Red Sea.", "Cairo (also the capital)", "Cairo|Alexandria|Giza|Luxor|Aswan|Sharm El Sheikh", "28 February 1922, from Britain (a republic since 1953)", "Arabic", "Egyptian pound", "Suez Canal fees|Tourism|Natural gas|Agriculture: cotton, rice and citrus|Money sent home from abroad", "Egypt", "https://www.sis.gov.eg"],
  IR: ["Iran, historically Persia, was the heart of great empires from Cyrus the Great onwards. Since the 1979 revolution it has been an Islamic Republic. It has some of the world's largest oil and gas reserves but has lived for decades under heavy international sanctions.", "Tehran (also the capital)", "Tehran|Isfahan|Shiraz|Persepolis|Mashhad|Tabriz", "Never colonised; an Islamic Republic since 1979", "Persian", "Iranian rial", "Oil and natural gas|Petrochemicals|Car manufacturing|Agriculture: pistachios and saffron|Carpets", "Iran", "https://www.president.ir"],
  IQ: ["Iraq covers ancient Mesopotamia, between the Tigris and Euphrates, where Sumer and Babylon rose and writing was invented. Baghdad was the capital of the Abbasid caliphate. The Kurdistan Region in the north governs itself.", "Baghdad (also the capital)", "Baghdad|Basra|Mosul|Erbil|Babylon|Najaf", "3 October 1932, from British mandate rule", "Arabic and Kurdish", "Iraqi dinar", "Oil (almost all government income)|Agriculture: dates and wheat|Construction|Religious tourism (Najaf, Karbala)", "Iraq", ""],
  IL: ["Israel was founded in 1948 as a Jewish state. Jerusalem is holy to Jews, Christians and Muslims. It is a world leader in technology start-ups. Since the Hamas-led attack of 7 October 2023, it has fought a long war in Gaza.", "Jerusalem (also the seat of government)", "Jerusalem|Tel Aviv|Haifa|Dead Sea|Masada|Sea of Galilee", "14 May 1948", "Hebrew (Arabic has special status)", "New shekel", "Technology and cyber security|Defence|Cut diamonds|Pharmaceuticals|Agricultural technology", "Israel", "https://www.gov.il"],
  JO: ["Jordan is a kingdom with almost no oil and little water, known for the rock-cut city of Petra, the desert of Wadi Rum and the Dead Sea, the lowest point on land. It has taken in large numbers of Palestinian, Iraqi and Syrian refugees.", "Amman (also the capital)", "Amman|Petra|Wadi Rum|Aqaba|Jerash|Dead Sea", "25 May 1946, from British mandate rule", "Arabic", "Jordanian dinar", "Phosphates and potash|Tourism|Pharmaceuticals|Clothing manufacture|Money sent home from abroad", "Jordan", "https://jordan.gov.jo"],
  KW: ["Kuwait is a small, oil-rich state at the head of the Gulf. It was invaded by Iraq in 1990 and freed in the 1991 Gulf War. Its dinar is the highest-valued currency in the world.", "Kuwait City (also the capital)", "Kuwait City|Kuwait Towers|Failaka Island|Al Ahmadi", "19 June 1961, from Britain", "Arabic", "Kuwaiti dinar", "Oil (most exports and government income)|Sovereign wealth fund investment|Petrochemicals|Finance", "Kuwait", "https://e.gov.kw"],
  LB: ["Lebanon is a small, mountainous country of many religious communities, which share power under its constitution. Beirut was once called the Paris of the Middle East, but civil war (1975–90), a financial collapse since 2019 and the 2020 port explosion have hit it hard.", "Beirut (also the capital)", "Beirut|Byblos|Baalbek|Tripoli|Tyre|Sidon", "22 November 1943, from French mandate rule", "Arabic (French widely spoken)", "Lebanese pound", "Banking and services|Tourism|Agriculture: fruit and wine|Money sent home by Lebanese abroad", "Lebanon", "http://www.pcm.gov.lb"],
  OM: ["Oman, on the south-eastern corner of Arabia, has been ruled by the Al Said dynasty since 1744 and once had an empire reaching Zanzibar. It is known for frankincense, forts, mountains and the fjords of Musandam.", "Muscat (also the capital)", "Muscat|Nizwa|Salalah|Sur|Musandam|Wahiba Sands", "Never colonised; ruled by the Al Said dynasty since 1744", "Arabic", "Omani rial", "Oil and gas|Ports and logistics|Fishing|Tourism|Frankincense (historically)", "Oman", "https://oman.om"],
  PS: ["Palestine is made up of the West Bank, including East Jerusalem, and the Gaza Strip, both occupied by Israel since 1967. It is a non-member observer state at the UN and is recognised by most UN members, including the UK and France since 2025. Gaza has been devastated by war since 2023.", "Gaza City (before the war)", "Ramallah|East Jerusalem|Bethlehem|Hebron|Nablus|Gaza City|Jericho", "Statehood declared 15 November 1988", "Arabic", "Israeli new shekel (and Jordanian dinar)", "Agriculture: olives and olive oil|Stone and marble quarrying|Services|Work in Israel|International aid", "State_of_Palestine", ""],
  QA: ["Qatar is a small peninsula with the third-largest natural gas reserves in the world, which make it one of the richest countries per person. It hosted the 2022 FIFA World Cup and is home to Al Jazeera.", "Doha (also the capital)", "Doha|Lusail|Al Wakrah|Al Khor|Museum of Islamic Art", "3 September 1971, from Britain", "Arabic", "Qatari riyal", "Liquefied natural gas|Oil|Investment (Qatar Investment Authority)|Aviation (Qatar Airways)", "Qatar", "https://hukoomi.gov.qa"],
  SA: ["Saudi Arabia covers most of the Arabian Peninsula and was founded in 1932 by Ibn Saud. It is home to Mecca and Medina, Islam's holiest cities, and is the world's largest oil exporter. Its Vision 2030 plan aims to diversify the economy.", "Riyadh (also the capital)", "Riyadh|Jeddah|Mecca|Medina|AlUla|Dammam", "23 September 1932, unified as a kingdom", "Arabic", "Saudi riyal", "Oil (Saudi Aramco)|Petrochemicals|Religious pilgrimage (the Hajj)|Construction and new cities", "Saudi_Arabia", "https://www.my.gov.sa"],
  SY: ["Syria has some of the oldest cities on Earth: Damascus and Aleppo have been lived in for thousands of years. Civil war from 2011 killed hundreds of thousands and drove millions abroad; the Assad government fell in December 2024 and a transitional government took over.", "Damascus (also the capital)", "Damascus|Aleppo|Homs|Latakia|Palmyra|Krak des Chevaliers", "17 April 1946, from French mandate rule", "Arabic", "Syrian pound", "Agriculture: wheat, cotton and olives|Oil (small)|Textiles|Rebuilding after the war", "Syria", ""],
  TR: ["Türkiye bridges Europe and Asia, with Istanbul on both sides of the Bosphorus. The country was formed in 1923 from the Ottoman Empire by Mustafa Kemal Atatürk, and it has the largest economy in the region.", "Istanbul (Ankara is the capital)", "Istanbul|Ankara|İzmir|Antalya|Cappadocia|Ephesus", "29 October 1923, as a republic", "Turkish", "Turkish lira", "Textiles and clothing|Cars and appliances|Tourism|Construction|Agriculture: hazelnuts and figs", "Turkey", "https://www.tccb.gov.tr"],
  AE: ["The United Arab Emirates is a federation of seven emirates formed in 1971. Abu Dhabi holds most of the oil; Dubai has become a global hub for trade, flights and tourism, with the Burj Khalifa, the world's tallest building. Most residents are foreign workers.", "Dubai (Abu Dhabi is the capital)", "Dubai|Abu Dhabi|Sharjah|Al Ain|Burj Khalifa|Louvre Abu Dhabi", "2 December 1971, from Britain", "Arabic", "UAE dirham", "Oil and gas (Abu Dhabi)|Trade and ports (Jebel Ali)|Aviation (Emirates, Etihad)|Tourism|Finance and property", "United_Arab_Emirates", "https://u.ae"],
  YE: ["Yemen was the ancient land of Sheba and the frankincense trade, and its port of Mocha gave its name to coffee. North and South Yemen united in 1990. Civil war since 2014 has caused one of the world's worst humanitarian crises.", "Sana'a (also the capital)", "Sana'a|Aden|Taiz|Shibam|Socotra|Al Mukalla", "22 May 1990, North and South Yemen unified", "Arabic", "Yemeni rial", "Agriculture: coffee and qat|Fishing|Oil (largely halted by the war)", "Yemen", ""],
};

const FLAG: Record<string, string> = { AE: "Flag of the United Arab Emirates.svg", PS: "Flag of Palestine.svg" };
const SEARCH: Record<string, string> = { TR: "Turkey", PS: "Palestine" };

const pieces: Record<string, PieceDetails> = {};
for (const [id, [about, largest, places, founded, langs, currency, industries, wiki, official]] of Object.entries(RAW)) {
  pieces[id] = {
    about, largestCity: largest, places: places.split("|"),
    type: id === "PS" ? "Partially recognised state" : "Country",
    identity: [
      { label: "Independence / founding", value: founded },
      { label: "Official languages", value: langs },
      { label: "Currency", value: currency },
    ],
    flag: FLAG[id] ?? `Flag of ${wiki.replace(/_/g, " ")}.svg`,
    ...(GDP[id] ? { gdp: GDP[id][0], gdpPerCap: GDP[id][1] } : {}),
    industries: industries.split("|"),
    wiki, official: official || undefined, search: SEARCH[id],
  };
}

export const MIDDLE_EAST_DETAILS: MapDetails = {
  currency: "US$",
  gdpYear: 2025,
  gdpSource: "IMF World Economic Outlook (April and October 2026 editions), 2025 estimates in US dollars; no IMF figures for Syria. Yemen's figures are very uncertain",
  national: { label: "the Middle East average", gdp: 5_800_885, gdpPerCap: 13_116, totalLabel: "the region's total (excluding Syria)" },
  pieces,
};
