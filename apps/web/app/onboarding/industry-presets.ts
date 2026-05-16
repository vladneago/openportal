// Industry-specific suggestions for the onboarding wizard.
// Each preset includes default services, business hours, theme suggestion,
// and template suggestion. The wizard uses these to pre-fill the form so
// the user can finish in <5 minutes.

export interface ServiceSuggestion {
  name: string;
  durationMinutes: number;
  price: string; // RON
  category?: string;
  color?: string;
}

export interface IndustryPreset {
  id: string;
  label: string;
  icon: string;
  description: string;
  services: ServiceSuggestion[];
  // Business hours per day (0 = Sun, 1 = Mon, ..., 6 = Sat). Days not listed are closed.
  hours: Array<{ dayOfWeek: number; start: string; end: string }>;
  // Suggested theme slug (from seed-solo.ts)
  suggestedTheme: string;
  // Suggested template slug (from seed-solo.ts)
  suggestedTemplate: string;
}

const MON_FRI_9_19: Array<{ dayOfWeek: number; start: string; end: string }> = [
  { dayOfWeek: 1, start: "09:00", end: "19:00" },
  { dayOfWeek: 2, start: "09:00", end: "19:00" },
  { dayOfWeek: 3, start: "09:00", end: "19:00" },
  { dayOfWeek: 4, start: "09:00", end: "19:00" },
  { dayOfWeek: 5, start: "09:00", end: "19:00" },
];

const MON_SAT_9_19: Array<{ dayOfWeek: number; start: string; end: string }> = [
  ...MON_FRI_9_19,
  { dayOfWeek: 6, start: "09:00", end: "14:00" },
];

const MON_SAT_10_20: Array<{ dayOfWeek: number; start: string; end: string }> = [
  { dayOfWeek: 1, start: "10:00", end: "20:00" },
  { dayOfWeek: 2, start: "10:00", end: "20:00" },
  { dayOfWeek: 3, start: "10:00", end: "20:00" },
  { dayOfWeek: 4, start: "10:00", end: "20:00" },
  { dayOfWeek: 5, start: "10:00", end: "20:00" },
  { dayOfWeek: 6, start: "10:00", end: "18:00" },
];

const MON_FRI_9_17: Array<{ dayOfWeek: number; start: string; end: string }> = [
  { dayOfWeek: 1, start: "09:00", end: "17:00" },
  { dayOfWeek: 2, start: "09:00", end: "17:00" },
  { dayOfWeek: 3, start: "09:00", end: "17:00" },
  { dayOfWeek: 4, start: "09:00", end: "17:00" },
  { dayOfWeek: 5, start: "09:00", end: "17:00" },
];

export const INDUSTRY_PRESETS: IndustryPreset[] = [
  {
    id: "beauty",
    label: "Salon înfrumusețare",
    icon: "💇‍♀️",
    description: "Coafură, manichiură, cosmetică, machiaj",
    services: [
      { name: "Tunsoare damă", durationMinutes: 60, price: "100", category: "Coafură", color: "#E91E63" },
      { name: "Vopsit", durationMinutes: 90, price: "200", category: "Coafură", color: "#E91E63" },
      { name: "Manichiură", durationMinutes: 45, price: "80", category: "Unghii", color: "#FF9CB6" },
      { name: "Pedichiură", durationMinutes: 60, price: "100", category: "Unghii", color: "#FF9CB6" },
    ],
    hours: MON_SAT_9_19,
    suggestedTheme: "beauty-modern",
    suggestedTemplate: "beauty-modern-salon",
  },
  {
    id: "barbershop",
    label: "Frizerie / Barbershop",
    icon: "💈",
    description: "Tuns, barbă, vopsit pentru bărbați",
    services: [
      { name: "Tuns clasic", durationMinutes: 30, price: "60", category: "Tuns", color: "#F59E0B" },
      { name: "Fade", durationMinutes: 45, price: "80", category: "Tuns", color: "#F59E0B" },
      { name: "Tuns + Barbă", durationMinutes: 60, price: "100", category: "Combinat", color: "#D97706" },
      { name: "Barbă", durationMinutes: 30, price: "50", category: "Barbă", color: "#D97706" },
    ],
    hours: MON_SAT_10_20,
    suggestedTheme: "barbershop-bold",
    suggestedTemplate: "barbershop-classic",
  },
  {
    id: "spa_wellness",
    label: "SPA & Wellness",
    icon: "🧖‍♀️",
    description: "Masaje, tratamente, relaxare",
    services: [
      { name: "Masaj relaxare", durationMinutes: 60, price: "180", category: "Masaj", color: "#7A9F7A" },
      { name: "Masaj terapeutic", durationMinutes: 90, price: "250", category: "Masaj", color: "#7A9F7A" },
      { name: "Tratament facial", durationMinutes: 60, price: "200", category: "Facial", color: "#A8C5A8" },
      { name: "Reflexoterapie", durationMinutes: 45, price: "150", category: "Terapii", color: "#7A9F7A" },
    ],
    hours: [
      { dayOfWeek: 1, start: "10:00", end: "21:00" },
      { dayOfWeek: 2, start: "10:00", end: "21:00" },
      { dayOfWeek: 3, start: "10:00", end: "21:00" },
      { dayOfWeek: 4, start: "10:00", end: "21:00" },
      { dayOfWeek: 5, start: "10:00", end: "21:00" },
      { dayOfWeek: 6, start: "10:00", end: "18:00" },
      { dayOfWeek: 0, start: "10:00", end: "18:00" },
    ],
    suggestedTheme: "spa-wellness",
    suggestedTemplate: "spa-wellness-retreat",
  },
  {
    id: "consulting",
    label: "Consultant / Avocat / Contabil",
    icon: "💼",
    description: "Servicii profesionale, întâlniri 1-la-1",
    services: [
      { name: "Consultanță inițială", durationMinutes: 60, price: "300", category: "Consultanță", color: "#1E40AF" },
      { name: "Ședință strategică", durationMinutes: 90, price: "450", category: "Consultanță", color: "#1E40AF" },
      { name: "Follow-up", durationMinutes: 30, price: "150", category: "Consultanță", color: "#3B82F6" },
    ],
    hours: MON_FRI_9_17,
    suggestedTheme: "professional-clean",
    suggestedTemplate: "consultant-profesional",
  },
  {
    id: "medical",
    label: "Cabinet medical / Stomatolog",
    icon: "🩺",
    description: "Consultații, tratamente medicale",
    services: [
      { name: "Consultație", durationMinutes: 30, price: "200", category: "Consultații", color: "#0EA5E9" },
      { name: "Control", durationMinutes: 20, price: "150", category: "Consultații", color: "#0EA5E9" },
      { name: "Igienizare", durationMinutes: 45, price: "250", category: "Tratamente", color: "#7DD3FC" },
    ],
    hours: MON_FRI_9_19,
    suggestedTheme: "medical-trust",
    suggestedTemplate: "medical-clinic-trust",
  },
  {
    id: "fitness",
    label: "Personal trainer / Sala fitness",
    icon: "💪",
    description: "Antrenamente personalizate, programe",
    services: [
      { name: "Ședință personal training", durationMinutes: 60, price: "120", category: "Personal", color: "#FF5722" },
      { name: "Antrenament în grup", durationMinutes: 60, price: "60", category: "Grup", color: "#FF8A65" },
      { name: "Evaluare fitness", durationMinutes: 90, price: "200", category: "Evaluare", color: "#FF5722" },
    ],
    hours: [
      { dayOfWeek: 1, start: "07:00", end: "21:00" },
      { dayOfWeek: 2, start: "07:00", end: "21:00" },
      { dayOfWeek: 3, start: "07:00", end: "21:00" },
      { dayOfWeek: 4, start: "07:00", end: "21:00" },
      { dayOfWeek: 5, start: "07:00", end: "21:00" },
      { dayOfWeek: 6, start: "09:00", end: "17:00" },
    ],
    suggestedTheme: "fitness-energy",
    suggestedTemplate: "fitness-personal-trainer",
  },
  {
    id: "bakery",
    label: "Cofetărie / Patiserie",
    icon: "🎂",
    description: "Comenzi torturi, prăjituri",
    services: [
      { name: "Consultație tort personalizat", durationMinutes: 30, price: "0", category: "Comandă", color: "#8B5A2B" },
      { name: "Predare comandă", durationMinutes: 15, price: "0", category: "Predare", color: "#C49A6C" },
    ],
    hours: [
      { dayOfWeek: 1, start: "08:00", end: "20:00" },
      { dayOfWeek: 2, start: "08:00", end: "20:00" },
      { dayOfWeek: 3, start: "08:00", end: "20:00" },
      { dayOfWeek: 4, start: "08:00", end: "20:00" },
      { dayOfWeek: 5, start: "08:00", end: "20:00" },
      { dayOfWeek: 6, start: "08:00", end: "18:00" },
    ],
    suggestedTheme: "cafe-cozy",
    suggestedTemplate: "cofetarie-artizanala",
  },
  {
    id: "dental",
    label: "Cabinet stomatologic",
    icon: "🦷",
    description: "Stomatologie, implanturi, ortodonție",
    services: [
      { name: "Consultație", durationMinutes: 30, price: "150", category: "Consultații", color: "#0EA5E9" },
      { name: "Igienizare profesională", durationMinutes: 60, price: "300", category: "Profilactice", color: "#7DD3FC" },
      { name: "Detartraj", durationMinutes: 45, price: "200", category: "Profilactice", color: "#7DD3FC" },
      { name: "Obturație simplă", durationMinutes: 60, price: "300", category: "Tratamente", color: "#0EA5E9" },
    ],
    hours: [
      { dayOfWeek: 1, start: "09:00", end: "20:00" },
      { dayOfWeek: 2, start: "09:00", end: "20:00" },
      { dayOfWeek: 3, start: "09:00", end: "20:00" },
      { dayOfWeek: 4, start: "09:00", end: "20:00" },
      { dayOfWeek: 5, start: "09:00", end: "17:00" },
    ],
    suggestedTheme: "medical-trust",
    suggestedTemplate: "dental-care-modern",
  },
  {
    id: "photographer",
    label: "Fotograf / Studio foto",
    icon: "📸",
    description: "Ședințe foto, evenimente, portrete",
    services: [
      { name: "Ședință foto portret", durationMinutes: 60, price: "400", category: "Portret", color: "#6366F1" },
      { name: "Ședință foto familie", durationMinutes: 90, price: "600", category: "Familie", color: "#8B5CF6" },
      { name: "Eveniment 4h", durationMinutes: 240, price: "1500", category: "Evenimente", color: "#A78BFA" },
      { name: "Consultație creativă", durationMinutes: 30, price: "100", category: "Consultanță", color: "#6366F1" },
    ],
    hours: MON_SAT_10_20,
    suggestedTheme: "professional-clean",
    suggestedTemplate: "photographer-portfolio",
  },
  {
    id: "florist",
    label: "Florărie",
    icon: "💐",
    description: "Aranjamente florale, livrări, evenimente",
    services: [
      { name: "Consultație aranjament", durationMinutes: 30, price: "0", category: "Consultanță", color: "#EC4899" },
      { name: "Comandă buchet personalizat", durationMinutes: 15, price: "0", category: "Comenzi", color: "#F472B6" },
      { name: "Predare comandă", durationMinutes: 15, price: "0", category: "Predare", color: "#FBCFE8" },
    ],
    hours: [
      { dayOfWeek: 1, start: "08:00", end: "20:00" },
      { dayOfWeek: 2, start: "08:00", end: "20:00" },
      { dayOfWeek: 3, start: "08:00", end: "20:00" },
      { dayOfWeek: 4, start: "08:00", end: "20:00" },
      { dayOfWeek: 5, start: "08:00", end: "20:00" },
      { dayOfWeek: 6, start: "08:00", end: "18:00" },
      { dayOfWeek: 0, start: "10:00", end: "16:00" },
    ],
    suggestedTheme: "beauty-vintage",
    suggestedTemplate: "florist-boutique",
  },
  {
    id: "yoga_pilates",
    label: "Yoga / Pilates / Studio",
    icon: "🧘",
    description: "Clase grup yoga, pilates, meditație",
    services: [
      { name: "Yoga Vinyasa (clasă grup)", durationMinutes: 75, price: "60", category: "Yoga", color: "#7A9F7A" },
      { name: "Yin Yoga", durationMinutes: 90, price: "70", category: "Yoga", color: "#7A9F7A" },
      { name: "Pilates Mat (grup)", durationMinutes: 60, price: "55", category: "Pilates", color: "#A8C5A8" },
      { name: "Pilates Reformer (1-la-1)", durationMinutes: 60, price: "180", category: "Pilates", color: "#A8C5A8" },
      { name: "Meditație ghidată", durationMinutes: 45, price: "40", category: "Meditație", color: "#C4D9C4" },
    ],
    hours: [
      { dayOfWeek: 1, start: "07:00", end: "21:00" },
      { dayOfWeek: 2, start: "07:00", end: "21:00" },
      { dayOfWeek: 3, start: "07:00", end: "21:00" },
      { dayOfWeek: 4, start: "07:00", end: "21:00" },
      { dayOfWeek: 5, start: "07:00", end: "21:00" },
      { dayOfWeek: 6, start: "09:00", end: "16:00" },
      { dayOfWeek: 0, start: "09:00", end: "13:00" },
    ],
    suggestedTheme: "spa-wellness",
    suggestedTemplate: "yoga-studio-zen",
  },
  {
    id: "restaurant",
    label: "Restaurant / Bistro",
    icon: "🍽️",
    description: "Rezervări mese, meniu online",
    services: [
      { name: "Rezervare masă 2 persoane", durationMinutes: 120, price: "0", category: "Rezervări", color: "#B45309" },
      { name: "Rezervare masă 4 persoane", durationMinutes: 120, price: "0", category: "Rezervări", color: "#B45309" },
      { name: "Rezervare masă 6+ persoane", durationMinutes: 150, price: "0", category: "Rezervări", color: "#92400E" },
      { name: "Eveniment privat", durationMinutes: 240, price: "0", category: "Evenimente", color: "#78350F" },
    ],
    hours: [
      { dayOfWeek: 1, start: "12:00", end: "23:00" },
      { dayOfWeek: 2, start: "12:00", end: "23:00" },
      { dayOfWeek: 3, start: "12:00", end: "23:00" },
      { dayOfWeek: 4, start: "12:00", end: "23:00" },
      { dayOfWeek: 5, start: "12:00", end: "24:00" },
      { dayOfWeek: 6, start: "12:00", end: "24:00" },
      { dayOfWeek: 0, start: "12:00", end: "22:00" },
    ],
    suggestedTheme: "restaurant-elegant",
    suggestedTemplate: "restaurant-bistro",
  },
  {
    id: "legal",
    label: "Avocat / Notar",
    icon: "⚖️",
    description: "Consultanță juridică, cabinete drept",
    services: [
      { name: "Consultație inițială", durationMinutes: 30, price: "300", category: "Consultații", color: "#1E40AF" },
      { name: "Ședință strategie", durationMinutes: 60, price: "500", category: "Consultații", color: "#1E40AF" },
      { name: "Redactare contract", durationMinutes: 90, price: "800", category: "Acte", color: "#3B82F6" },
      { name: "Asistență mediere", durationMinutes: 120, price: "1000", category: "Mediere", color: "#3B82F6" },
    ],
    hours: MON_FRI_9_17,
    suggestedTheme: "professional-clean",
    suggestedTemplate: "lawyer-classic",
  },
  {
    id: "accounting",
    label: "Contabil / Expert contabil",
    icon: "📊",
    description: "Evidență contabilă, salarizare, ANAF",
    services: [
      { name: "Consultație fiscală", durationMinutes: 60, price: "300", category: "Consultanță", color: "#0F766E" },
      { name: "Cerere ofertă firmă nouă", durationMinutes: 30, price: "0", category: "Ofertare", color: "#14B8A6" },
      { name: "Întâlnire trimestrială", durationMinutes: 45, price: "0", category: "Follow-up", color: "#5EEAD4" },
    ],
    hours: MON_FRI_9_17,
    suggestedTheme: "professional-clean",
    suggestedTemplate: "accountant-precise",
  },
  {
    id: "psychology",
    label: "Psiholog / Coach / Terapeut",
    icon: "🧠",
    description: "Ședințe terapie, online sau cabinet",
    services: [
      { name: "Ședință de cunoaștere", durationMinutes: 30, price: "0", category: "Inițială", color: "#7C3AED" },
      { name: "Terapie individuală", durationMinutes: 50, price: "250", category: "Individual", color: "#7C3AED" },
      { name: "Terapie de cuplu", durationMinutes: 75, price: "400", category: "Cuplu", color: "#A78BFA" },
      { name: "Terapie online", durationMinutes: 50, price: "250", category: "Online", color: "#C4B5FD" },
    ],
    hours: [
      { dayOfWeek: 1, start: "10:00", end: "20:00" },
      { dayOfWeek: 2, start: "10:00", end: "20:00" },
      { dayOfWeek: 3, start: "10:00", end: "20:00" },
      { dayOfWeek: 4, start: "10:00", end: "20:00" },
      { dayOfWeek: 5, start: "10:00", end: "17:00" },
    ],
    suggestedTheme: "spa-wellness",
    suggestedTemplate: "psychology-coach",
  },
  {
    id: "general_business",
    label: "Alt tip de afacere",
    icon: "🏢",
    description: "Configurez singur de la zero",
    services: [],
    hours: MON_FRI_9_17,
    suggestedTheme: "professional-clean",
    suggestedTemplate: "consultant-profesional",
  },
];

export function getPreset(id: string): IndustryPreset | undefined {
  return INDUSTRY_PRESETS.find((p) => p.id === id);
}
