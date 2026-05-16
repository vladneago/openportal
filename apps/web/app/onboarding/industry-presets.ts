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
    suggestedTemplate: "consultant-profesional", // Use consulting template as fallback
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
    suggestedTemplate: "consultant-profesional",
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
