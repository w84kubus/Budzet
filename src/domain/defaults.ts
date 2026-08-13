import type { FixedExpenseDef, Envelope } from "./types";

/**
 * Startowy zestaw wydatków stałych z SPEC.md §3.3.
 * Kwoty planowane 0 (użytkownik uzupełni sam), z wyjątkiem Studiów = 99000 (990 zł).
 */
export const DEFAULT_FIXED_EXPENSE_DEFS: Omit<FixedExpenseDef, "id">[] = [
  {
    name: "Leasing AUTO + GAP",
    type: "single",
    defaultPlanned: 0,
    dueDay: null,
    subcategories: [],
    order: 0,
    archived: false,
  },
  {
    name: "Leasing AirPods Max",
    type: "single",
    defaultPlanned: 0,
    dueDay: null,
    subcategories: [],
    order: 1,
    archived: false,
  },
  {
    name: "Transport / Paliwo",
    type: "accumulating",
    defaultPlanned: 0,
    dueDay: null,
    subcategories: ["Paliwo", "Myjnia", "Parking", "Serwis", "Autostrady"],
    order: 2,
    archived: false,
  },
  {
    name: "Studia",
    type: "single",
    defaultPlanned: 99000, // 990,00 zł
    dueDay: null,
    subcategories: [],
    order: 3,
    archived: false,
  },
  {
    name: "Subskrypcje",
    type: "single",
    defaultPlanned: 0,
    dueDay: null,
    subcategories: ["Apple", "Telefon", "HBO Max"],
    order: 4,
    archived: false,
  },
  {
    name: "Jedzenie",
    type: "accumulating",
    defaultPlanned: 0,
    dueDay: null,
    subcategories: [
      "Zakupy spożywcze",
      "Na mieście",
      "Dostawy",
      "Kawa",
    ],
    order: 5,
    archived: false,
  },
  {
    name: "Kredyty",
    type: "single",
    defaultPlanned: 0,
    dueDay: null,
    subcategories: [],
    order: 6,
    archived: false,
  },
];

/**
 * Startowy zestaw kopert z SPEC.md §3.4.
 */
export const DEFAULT_ENVELOPES: Omit<Envelope, "id">[] = [
  {
    name: "Rozrywka i czas wolny",
    emoji: "🎬",
    monthlyPlan: 0,
    targetAmount: null,
    subcategories: [],
    order: 0,
    archived: false,
  },
  {
    name: "Zdrowie / Leki",
    emoji: "💊",
    monthlyPlan: 0,
    targetAmount: null,
    subcategories: [],
    order: 1,
    archived: false,
  },
  {
    name: "Święta / Urodziny",
    emoji: "🎁",
    monthlyPlan: 0,
    targetAmount: null,
    subcategories: [],
    order: 2,
    archived: false,
  },
  {
    name: "Ubrania / Kosmetyki",
    emoji: "👕",
    monthlyPlan: 0,
    targetAmount: null,
    subcategories: [],
    order: 3,
    archived: false,
  },
  {
    name: "Wakacje",
    emoji: "✈️",
    monthlyPlan: 0,
    targetAmount: 500000, // 5 000,00 zł — placeholder goal
    subcategories: [],
    order: 4,
    archived: false,
  },
  {
    name: "Poduszka finansowa",
    emoji: "🛟",
    monthlyPlan: 0,
    targetAmount: 1000000, // 10 000,00 zł — placeholder goal
    subcategories: [],
    order: 5,
    archived: false,
  },
  {
    name: "Głupoty / Impulsy",
    emoji: "🫠",
    monthlyPlan: 0,
    targetAmount: null,
    subcategories: [],
    order: 6,
    archived: false,
  },
];
