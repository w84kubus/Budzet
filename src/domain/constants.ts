/**
 * Shared emoji options for envelope picker.
 * Includes all defaults from defaults.ts plus general-purpose icons.
 */
export const ENVELOPE_EMOJI_OPTIONS = [
  // Finance & savings
  "💰", "🛟", "💳",
  // Home & transport
  "🏠", "🚗", "✈️",
  // Entertainment & lifestyle
  "🎬", "🎮", "🎵",
  // Health & personal
  "💊", "👕", "🎁",
  // Education & tech
  "🎓", "📚", "💻",
  // Food & drink
  "☕", "🍕", "🛒",
  // Sport & pets
  "🏋️", "🐕", "⚽",
  // Other
  "🫠", "💡", "🎯",
];

// ─── Expense categories for daily spending ──────────────────────────────────

export type ExpenseCategory = {
  id: string;
  emoji: string;
  name: string;
  keywords: string[]; // lowercase - matched against note for auto-detection
};

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  {
    id: "groceries",
    emoji: "🛒",
    name: "Zakupy spożywcze",
    keywords: [
      "biedronka", "lidl", "żabka", "zabka", "auchan", "kaufland",
      "carrefour", "netto", "dino", "stokrotka", "lewiatan", "freshmarket",
      "spar", "intermarche", "makro", "selgros", "aldi", "polomarket",
      "polo market", "delikatesy", "spożywcze", "spozywcze", "spożywczy",
      "warzywa", "owoce", "pieczywo", "mleko", "jedzenie",
    ],
  },
  {
    id: "fuel",
    emoji: "⛽",
    name: "Paliwo",
    keywords: [
      "paliwo", "tankowanie", "benzyna", "diesel", "orlen", "bp",
      "shell", "circle k", "lotos", "amic", "moya", "stacja",
    ],
  },
  {
    id: "health",
    emoji: "💊",
    name: "Zdrowie / Apteka",
    keywords: [
      "apteka", "leki", "lek", "lekarz", "dentysta", "stomatolog",
      "wizyta", "badania", "recepta", "szpital", "klinika", "zdrowie",
      "okulista", "fizjoterapeuta", "rehabilitacja",
    ],
  },
  {
    id: "clothes",
    emoji: "👕",
    name: "Ubrania",
    keywords: [
      "ubrania", "ciuchy", "buty", "kurtka", "spodnie", "koszulka",
      "bluza", "zara", "h&m", "reserved", "cropp", "sinsay",
      "house", "mohito", "ccc", "deichmann", "odzież", "odzieżowy",
    ],
  },
  {
    id: "eating_out",
    emoji: "🍕",
    name: "Jedzenie na mieście",
    keywords: [
      "restauracja", "pizza", "kebab", "sushi", "burger", "mcdonald",
      "kfc", "subway", "obiad", "kolacja", "lunch", "bar", "bistro",
      "food truck", "glovo", "uber eats", "pyszne", "wolt", "bolt food",
    ],
  },
  {
    id: "coffee",
    emoji: "☕",
    name: "Kawa / Napoje",
    keywords: [
      "kawa", "kawiarnia", "starbucks", "costa", "coffeedesk",
      "herbata", "napój", "napoje", "sok", "smoothie", "bubble tea",
    ],
  },
  {
    id: "home",
    emoji: "🏠",
    name: "Dom / Mieszkanie",
    keywords: [
      "ikea", "castorama", "leroy merlin", "obi", "bricoman",
      "meble", "remont", "naprawka", "dom", "mieszkanie", "dekoracje",
      "narzędzia", "ogród", "pranie", "czyszczenie", "sprzątanie",
    ],
  },
  {
    id: "car",
    emoji: "🚗",
    name: "Auto",
    keywords: [
      "serwis", "mechanik", "myjnia", "opony", "olej", "przegląd",
      "ubezpieczenie auta", "oc", "ac", "parking", "autostrada",
      "vignette", "mycie", "napraw",
    ],
  },
  {
    id: "beauty",
    emoji: "💇",
    name: "Uroda / Kosmetyki",
    keywords: [
      "kosmetyki", "rossmann", "hebe", "drogeria", "fryzjer",
      "barber", "manicure", "pedicure", "makijaż", "krem",
      "szampon", "perfumy", "uroda",
    ],
  },
  {
    id: "entertainment",
    emoji: "🎬",
    name: "Rozrywka",
    keywords: [
      "kino", "netflix", "spotify", "disney", "hbo", "bilety",
      "koncert", "teatr", "gra", "gry", "steam", "playstation",
      "xbox", "nintendo", "rozrywka", "escape room", "bowling",
    ],
  },
  {
    id: "electronics",
    emoji: "📱",
    name: "Elektronika",
    keywords: [
      "media expert", "rtv euro agd", "x-kom", "xkom", "morele",
      "komputronik", "apple", "samsung", "telefon", "laptop",
      "słuchawki", "ładowarka", "kabel", "elektronika", "mediamarkt",
    ],
  },
  {
    id: "gifts",
    emoji: "🎁",
    name: "Prezenty",
    keywords: [
      "prezent", "upominek", "kwiaty", "bukiet", "kartka",
      "urodziny", "imieniny", "rocznica", "ślub", "chrzest",
    ],
  },
  {
    id: "pets",
    emoji: "🐕",
    name: "Zwierzęta",
    keywords: [
      "weterynarz", "karma", "smycz", "legowisko", "pies",
      "kot", "zwierzę", "pet", "zooplus", "kakadu", "maxi zoo",
    ],
  },
  {
    id: "education",
    emoji: "📚",
    name: "Edukacja",
    keywords: [
      "książka", "książki", "kurs", "szkolenie", "udemy",
      "edukacja", "nauka", "empik", "ebook", "audiobook",
    ],
  },
  {
    id: "other",
    emoji: "💡",
    name: "Inne",
    keywords: [], // fallback - no auto-detection
  },
];

/**
 * Auto-detect category from note text.
 * Returns best-matching category id, or null if no match.
 */
export function detectCategory(note: string): string | null {
  if (!note.trim()) return null;
  const lower = note.toLowerCase();

  for (const cat of EXPENSE_CATEGORIES) {
    if (cat.id === "other") continue; // skip fallback
    for (const kw of cat.keywords) {
      if (lower.includes(kw)) return cat.id;
    }
  }

  return null;
}

/**
 * Get category by id - returns "Inne" as fallback.
 */
export function getCategoryById(id: string): ExpenseCategory {
  return (
    EXPENSE_CATEGORIES.find((c) => c.id === id) ??
    EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1] // "Inne"
  );
}
