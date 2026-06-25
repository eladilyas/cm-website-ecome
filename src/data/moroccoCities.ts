// Moroccan cities served by the catalog's shipping infrastructure.
//
// 32 entries — covers every regional capital + every city above
// ~75k population. Alphabetically sorted for the dropdown. ASCII
// names where common ("Fes" not "Fès") to avoid double-encoding
// issues across form submission paths.
//
// Expand as ops onboards new delivery zones. The dropdown on
// /checkout treats anything in this list as in-network.

export const MOROCCO_CITIES: readonly string[] = [
  "Agadir",
  "Al Hoceima",
  "Asilah",
  "Azrou",
  "Béni Mellal",
  "Berkane",
  "Berrechid",
  "Casablanca",
  "Chefchaouen",
  "Dakhla",
  "El Jadida",
  "Errachidia",
  "Essaouira",
  "Fes",
  "Guelmim",
  "Ifrane",
  "Kenitra",
  "Khémisset",
  "Khouribga",
  "Laayoune",
  "Larache",
  "Marrakech",
  "Meknes",
  "Mohammedia",
  "Nador",
  "Ouarzazate",
  "Oujda",
  "Rabat",
  "Safi",
  "Salé",
  "Settat",
  "Tangier",
  "Taroudant",
  "Taza",
  "Tetouan",
] as const;
