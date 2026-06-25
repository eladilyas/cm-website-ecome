// Morocco cities seed list — ordered by population/relevance for autocomplete
// priority. The autocomplete prefers (a) starts-with matches over (b)
// includes-anywhere matches, falling back to (c) Latin-vs-Arabic-alias
// matches. Diacritics are stripped on both sides for the match.

export type City = {
  /** Canonical English/Latin name (display + the value submitted in the form). */
  name: string;
  /** Optional aliases / common alternate spellings (also matched). */
  aliases?: string[];
};

// Roughly the 35 largest cities + a few mid-size ones across all 12 regions.
// Enough to cover ~95% of real-world entries while staying lean enough to
// ship inline without paginating.
export const MOROCCO_CITIES: City[] = [
  { name: "Casablanca",      aliases: ["dar el beida", "casa"] },
  { name: "Rabat",           aliases: ["ribat"] },
  { name: "Fès",             aliases: ["fes", "fez"] },
  { name: "Marrakech",       aliases: ["marrakesh", "marraquech"] },
  { name: "Tangier",         aliases: ["tanger", "tanja"] },
  { name: "Salé",            aliases: ["sale"] },
  { name: "Meknès",          aliases: ["meknes"] },
  { name: "Oujda",           aliases: [] },
  { name: "Kénitra",         aliases: ["kenitra"] },
  { name: "Tétouan",         aliases: ["tetouan", "tetuan"] },
  { name: "Safi",            aliases: ["asfi"] },
  { name: "Mohammedia",      aliases: [] },
  { name: "Khouribga",       aliases: [] },
  { name: "El Jadida",       aliases: ["mazagan"] },
  { name: "Béni Mellal",     aliases: ["beni mellal"] },
  { name: "Nador",           aliases: [] },
  { name: "Taza",            aliases: [] },
  { name: "Settat",          aliases: [] },
  { name: "Berrechid",       aliases: [] },
  { name: "Khémisset",       aliases: ["khemisset"] },
  { name: "Inezgane",        aliases: [] },
  { name: "Ksar el-Kebir",   aliases: ["ksar el kebir", "alcazarquivir"] },
  { name: "Larache",         aliases: ["arache"] },
  { name: "Guelmim",         aliases: [] },
  { name: "Berkane",         aliases: [] },
  { name: "Taourirt",        aliases: [] },
  { name: "Sidi Slimane",    aliases: [] },
  { name: "Errachidia",      aliases: ["er-rachidia"] },
  { name: "Sidi Kacem",      aliases: ["sidi kassem"] },
  { name: "Khénifra",        aliases: ["khenifra"] },
  { name: "Tiznit",          aliases: [] },
  { name: "Taroudant",       aliases: [] },
  { name: "Ouarzazate",      aliases: [] },
  { name: "Essaouira",       aliases: ["mogador"] },
  { name: "Agadir",          aliases: [] },
  { name: "Dakhla",          aliases: [] },
  { name: "Laâyoune",        aliases: ["laayoune", "el aaiun"] },
  { name: "Ifrane",          aliases: [] },
  { name: "Chefchaouen",     aliases: ["chaouen"] },
  { name: "Asilah",          aliases: ["assilah", "arzila"] },
];

/** Strip accents and lowercase for diacritic-insensitive matching. */
function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritics
    .toLowerCase()
    .trim();
}

/** Returns the top N city suggestions for a query, by relevance. */
export function searchCities(query: string, limit = 8): City[] {
  const q = normalize(query);
  if (!q) return MOROCCO_CITIES.slice(0, limit);

  const startsWith: City[] = [];
  const includes: City[] = [];

  for (const city of MOROCCO_CITIES) {
    const names = [city.name, ...(city.aliases ?? [])].map(normalize);
    if (names.some((n) => n.startsWith(q))) {
      startsWith.push(city);
    } else if (names.some((n) => n.includes(q))) {
      includes.push(city);
    }
  }

  return [...startsWith, ...includes].slice(0, limit);
}

/** True if the value is one of the canonical city names. */
export function isValidCity(value: string): boolean {
  const v = normalize(value);
  return MOROCCO_CITIES.some((c) => normalize(c.name) === v);
}
