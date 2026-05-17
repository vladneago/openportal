// Schema descriptions for the page editor.
// Each block type has a label, an icon, and a list of fields with form types.

export type FieldType =
  | "text"
  | "textarea"
  | "url"
  | "image"
  | "select"
  | "boolean"
  | "color"
  | "number"
  | "list"
  | "cta";

export interface BlockFieldDef {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  // For list fields: schema of each item
  itemFields?: BlockFieldDef[];
  // For string lists or checkbox groups
  enumValues?: Array<{ value: string; label: string }>;
  defaultValue?: unknown;
  helpText?: string;
}

export interface BlockTypeDef {
  type: string;
  label: string;
  icon: string;
  description: string;
  fields: BlockFieldDef[];
  defaultData: Record<string, unknown>;
}

export const BLOCK_TYPES: BlockTypeDef[] = [
  {
    type: "hero",
    label: "Hero",
    icon: "🎯",
    description: "Bandă mare cu titlu, subtitlu și butoane CTA.",
    fields: [
      { key: "title", label: "Titlu", type: "text", placeholder: "Frumusețea ta, în mâini bune" },
      { key: "subtitle", label: "Subtitlu", type: "textarea", placeholder: "Salon de înfrumusețare cu peste 10 ani de experiență" },
      { key: "backgroundImage", label: "Imagine fundal", type: "image", placeholder: "https://images.unsplash.com/..." },
      { key: "ctaPrimary", label: "Buton principal", type: "cta" },
      { key: "ctaSecondary", label: "Buton secundar", type: "cta" },
    ],
    defaultData: {
      title: "Titlul tău aici",
      subtitle: "O scurtă descriere a afacerii tale",
      ctaPrimary: { text: "Programează-te", href: "/programari" },
    },
  },
  {
    type: "featuresGrid",
    label: "Caracteristici (grid)",
    icon: "✨",
    description: "Grid 3-coloane cu iconuri și descrieri (de ce să te aleagă).",
    fields: [
      { key: "title", label: "Titlu secțiune", type: "text", placeholder: "De ce ne aleg clienții" },
      {
        key: "features",
        label: "Caracteristici",
        type: "list",
        itemFields: [
          { key: "icon", label: "Icon (emoji)", type: "text", placeholder: "✨" },
          { key: "title", label: "Titlu", type: "text" },
          { key: "text", label: "Text", type: "textarea" },
        ],
      },
    ],
    defaultData: {
      title: "De ce ne aleg clienții",
      features: [
        { icon: "✨", title: "Profesional", text: "Echipă cu experiență" },
        { icon: "🌿", title: "Produse premium", text: "Doar cele mai bune mărci" },
        { icon: "📅", title: "Rezervare rapidă", text: "Online, în 30 de secunde" },
      ],
    },
  },
  {
    type: "servicesPreview",
    label: "Preview servicii",
    icon: "📋",
    description: "Card-uri cu primele 6 servicii ale tenant-ului + buton către pagina servicii.",
    fields: [
      { key: "title", label: "Titlu", type: "text", placeholder: "Servicii populare" },
      { key: "subtitle", label: "Subtitlu", type: "text" },
      { key: "ctaText", label: "Text buton", type: "text", placeholder: "Vezi toate serviciile" },
      { key: "ctaHref", label: "Link buton", type: "text", placeholder: "/servicii", defaultValue: "/servicii" },
    ],
    defaultData: {
      title: "Servicii populare",
      ctaText: "Vezi toate serviciile",
      ctaHref: "/servicii",
    },
  },
  {
    type: "servicesList",
    label: "Listă completă servicii",
    icon: "📑",
    description: "Toate serviciile active ale tenant-ului în grid sau listă.",
    fields: [
      {
        key: "displayMode",
        label: "Mod afișare",
        type: "select",
        options: [
          { value: "grid", label: "Grid (card-uri)" },
          { value: "list", label: "Listă" },
        ],
        defaultValue: "grid",
      },
    ],
    defaultData: { displayMode: "grid" },
  },
  {
    type: "textImage",
    label: "Text + Imagine",
    icon: "📝",
    description: "Bloc cu text într-o coloană și imagine în cealaltă.",
    fields: [
      { key: "title", label: "Titlu", type: "text" },
      { key: "text", label: "Text", type: "textarea" },
      { key: "imageUrl", label: "URL imagine", type: "image" },
      {
        key: "imagePosition",
        label: "Poziție imagine",
        type: "select",
        options: [
          { value: "left", label: "Stânga" },
          { value: "right", label: "Dreapta" },
        ],
        defaultValue: "right",
      },
    ],
    defaultData: {
      title: "Despre noi",
      text: "Povestea afacerii tale...",
      imagePosition: "right",
    },
  },
  {
    type: "testimonials",
    label: "Testimoniale",
    icon: "💬",
    description: "Recenzii de la clienți cu rating.",
    fields: [
      { key: "title", label: "Titlu", type: "text", placeholder: "Ce spun clienții" },
      {
        key: "items",
        label: "Testimoniale",
        type: "list",
        itemFields: [
          { key: "author", label: "Nume client", type: "text" },
          { key: "text", label: "Mesaj", type: "textarea" },
          { key: "rating", label: "Rating (1-5)", type: "number", defaultValue: 5 },
        ],
      },
    ],
    defaultData: {
      title: "Ce spun clienții noștri",
      items: [
        { author: "Maria P.", text: "Experiență minunată, recomand!", rating: 5 },
      ],
    },
  },
  {
    type: "reviewsList",
    label: "Recenzii reale",
    icon: "⭐",
    description:
      "Trage live recenziile publicate din /booking/reviews. Fallback la textul de mai jos dacă încă n-ai recenzii.",
    fields: [
      { key: "title", label: "Titlu", type: "text", placeholder: "Ce spun clienții noștri" },
      { key: "subtitle", label: "Subtitlu", type: "textarea" },
      {
        key: "limit",
        label: "Câte recenzii să afișez",
        type: "number",
        defaultValue: 6,
        helpText: "Featured-first, apoi cele mai recente.",
      },
      {
        key: "minRating",
        label: "Rating minim",
        type: "select",
        options: [
          { value: "0", label: "Toate" },
          { value: "3", label: "≥ 3 stele" },
          { value: "4", label: "≥ 4 stele (recomandat)" },
          { value: "5", label: "Doar 5 stele" },
        ],
        defaultValue: "0",
      },
      {
        key: "fallbackItems",
        label: "Recenzii de rezervă (dacă n-ai încă reale)",
        type: "list",
        itemFields: [
          { key: "author", label: "Nume", type: "text" },
          { key: "text", label: "Mesaj", type: "textarea" },
          { key: "rating", label: "Rating (1-5)", type: "number", defaultValue: 5 },
        ],
        helpText: "Acestea apar până când ai cel puțin 1 recenzie publicată.",
      },
    ],
    defaultData: {
      title: "Ce spun clienții noștri",
      subtitle: "Feedback real de la oamenii cu care am lucrat.",
      limit: 6,
      minRating: 0,
      fallbackItems: [
        { author: "Maria P.", text: "Experiență minunată, recomand!", rating: 5 },
        { author: "Andrei S.", text: "Profesionalism și atenție la detalii.", rating: 5 },
      ],
    },
  },
  {
    type: "ctaBanner",
    label: "Banner CTA",
    icon: "📢",
    description: "Bandă colorată cu mesaj și un singur buton (call-to-action).",
    fields: [
      { key: "title", label: "Titlu", type: "text", placeholder: "Programează-te acum" },
      { key: "subtitle", label: "Subtitlu", type: "textarea" },
      { key: "ctaText", label: "Text buton", type: "text", placeholder: "Rezervă online" },
      { key: "ctaHref", label: "Link buton", type: "text", placeholder: "/programari", defaultValue: "/programari" },
    ],
    defaultData: {
      title: "Programează-te acum",
      ctaText: "Rezervă online",
      ctaHref: "/programari",
    },
  },
  {
    type: "contactInfo",
    label: "Informații contact",
    icon: "📞",
    description: "Adresă, telefon, email, program — pulled din setările afacerii.",
    fields: [
      { key: "showHours", label: "Arată program", type: "boolean", defaultValue: true },
      { key: "showSocial", label: "Arată social media", type: "boolean", defaultValue: true },
      { key: "showMap", label: "Arată hartă", type: "boolean", defaultValue: false, helpText: "În curând" },
    ],
    defaultData: { showHours: true, showSocial: true, showMap: false },
  },
  {
    type: "contactForm",
    label: "Formular contact",
    icon: "✉️",
    description: "Formular de contact simplu (momentan vizual — submit-ul se cuplează viitor).",
    fields: [
      {
        key: "fields",
        label: "Câmpuri afișate",
        type: "select",
        options: [
          { value: "all", label: "Toate (nume, email, telefon, mesaj)" },
          { value: "minimal", label: "Doar nume + email + mesaj" },
        ],
        defaultValue: "all",
      },
    ],
    defaultData: { fields: ["name", "email", "phone", "message"] },
  },
  {
    type: "bookingWidget",
    label: "Rezervare online",
    icon: "📅",
    description: "Buton care deschide flow-ul de rezervare /book/[siteId].",
    fields: [],
    defaultData: {},
  },
  {
    type: "team",
    label: "Echipa",
    icon: "👥",
    description: "Membri ai echipei cu avatar + rol.",
    fields: [
      { key: "title", label: "Titlu", type: "text", placeholder: "Echipa noastră" },
      {
        key: "members",
        label: "Membri",
        type: "list",
        itemFields: [
          { key: "name", label: "Nume", type: "text" },
          { key: "role", label: "Rol", type: "text" },
          { key: "avatarUrl", label: "URL avatar", type: "image" },
        ],
      },
    ],
    defaultData: {
      title: "Echipa noastră",
      members: [{ name: "Ana Popescu", role: "Senior", avatarUrl: "" }],
    },
  },
];

export function getBlockTypeDef(type: string): BlockTypeDef | undefined {
  return BLOCK_TYPES.find((b) => b.type === type);
}
