// ─────────────────────────────────────────────
// Site image bank
//
// Curated Unsplash photo IDs per industry × category. Unsplash CDN URLs
// like https://images.unsplash.com/photo-XXXXX are direct-serve and the
// Unsplash license allows free commercial use without attribution. The
// IDs below were picked for visual quality + topic fit and act as a
// zero-config image source for AI-generated sites and the manual image
// picker. No API key required.
//
// To rotate the catalog: replace photo IDs in INDUSTRY_BANK. To add a
// new industry: add a new entry mapping to the same { hero, about,
// general } shape.
// ─────────────────────────────────────────────

export type ImageCategory = "hero" | "about" | "general";

interface IndustryBank {
  hero: string[];
  about: string[];
  general: string[];
}

// Each photo ID corresponds to a public Unsplash photo CDN URL. The
// final URL is built at pick time with width/quality params.
const INDUSTRY_BANK: Record<string, IndustryBank> = {
  beauty: {
    hero: [
      "photo-1560066984-138dadb4c035",   // salon interior
      "photo-1522335789203-aabd1fc54bc9", // makeup brushes
      "photo-1487412947147-5cebf100ffc2", // hairdresser at work
    ],
    about: [
      "photo-1503951914875-452162b0f3f1", // hair stylist closeup
      "photo-1607008829749-c0f284a49841", // beauty products flatlay
    ],
    general: [
      "photo-1519415943484-9fa1873496d4", // nail polish bottles
      "photo-1631729371254-42c2892f0e6e", // salon detail
    ],
  },
  barbershop: {
    hero: [
      "photo-1503951914875-452162b0f3f1", // barber chair scene
      "photo-1521590832167-7bcbfaa6381f", // barbershop interior
      "photo-1599351431202-1e0f0137899a", // straight razor
    ],
    about: [
      "photo-1622286342621-4bd786c2447c", // barber working
      "photo-1503951914875-452162b0f3f1",
    ],
    general: [
      "photo-1593702275687-f8b402bf1fb5", // beard trimming
    ],
  },
  spa_wellness: {
    hero: [
      "photo-1544161515-4ab6ce6db874", // spa stones + candle
      "photo-1540555700478-4be289fbecef", // massage room
      "photo-1519823551278-64ac92734fb1", // bamboo + water
    ],
    about: [
      "photo-1552693673-1bf958298935", // hands massage
      "photo-1515377905703-c4788e51af15", // wellness ritual
    ],
    general: [
      "photo-1583416750470-965b2707b355", // spa essentials
    ],
  },
  fitness: {
    hero: [
      "photo-1517836357463-d25dfeac3438", // gym interior
      "photo-1534438327276-14e5300c3a48", // weights closeup
      "photo-1571019613454-1cb2f99b2d8b", // person lifting
    ],
    about: [
      "photo-1576678927484-cc907957088c", // trainer + client
    ],
    general: [
      "photo-1554344728-77cf90d9ed26", // dumbbells
    ],
  },
  yoga_pilates: {
    hero: [
      "photo-1545205597-3d9d02c29597", // yoga class
      "photo-1506126613408-eca07ce68773", // yoga pose
      "photo-1571019613454-1cb2f99b2d8b",
    ],
    about: [
      "photo-1599901860904-17e6ed7083a0", // yoga mat + props
    ],
    general: [
      "photo-1518611012118-696072aa579a", // serene studio
    ],
  },
  medical: {
    hero: [
      "photo-1519494026892-80bbd2d6fd0d", // medical office
      "photo-1538108149393-fbbd81895907", // stethoscope desk
      "photo-1576091160550-2173dba999ef", // calm clinic
    ],
    about: [
      "photo-1551601651-2a8555f1a136", // doctor consult
    ],
    general: [
      "photo-1583912267550-d44c9b1c87aa", // clean clinic detail
    ],
  },
  dental: {
    hero: [
      "photo-1606811971618-4486d14f3f99", // dental chair
      "photo-1588776814546-1ffcf47267a5", // clean clinic
    ],
    about: [
      "photo-1609840114035-3c981b782dfe", // dentist + patient
    ],
    general: [
      "photo-1606811971618-4486d14f3f99",
    ],
  },
  bakery: {
    hero: [
      "photo-1568254183919-78a4f43a2877", // pastry display
      "photo-1486427944299-d1955d23e34d", // bread loaves
      "photo-1509440159596-0249088772ff", // patisserie
    ],
    about: [
      "photo-1571115177098-24ec42ed204d", // hands kneading dough
    ],
    general: [
      "photo-1551024601-bec78aea704b", // cupcakes
    ],
  },
  cofetarie: {
    hero: [
      "photo-1568254183919-78a4f43a2877",
      "photo-1486427944299-d1955d23e34d",
      "photo-1509440159596-0249088772ff",
    ],
    about: [
      "photo-1571115177098-24ec42ed204d",
    ],
    general: [
      "photo-1551024601-bec78aea704b",
    ],
  },
  florist: {
    hero: [
      "photo-1487070183336-b863922373d4", // flower shop
      "photo-1561181286-d3fee7d55364", // bouquet
      "photo-1490750967868-88aa4486c946", // tulips
    ],
    about: [
      "photo-1416879595882-3373a0480b5b", // florist arranging
    ],
    general: [
      "photo-1508610048659-a06b669e3321",
    ],
  },
  photographer: {
    hero: [
      "photo-1452587925148-ce544e77e70d", // photographer with camera
      "photo-1502920917128-1aa500764cbd", // studio lights
    ],
    about: [
      "photo-1502920917128-1aa500764cbd",
    ],
    general: [
      "photo-1554048612-b6a482b224b8", // film roll
    ],
  },
  restaurant: {
    hero: [
      "photo-1517248135467-4c7edcad34c4", // restaurant interior
      "photo-1565299624946-b28f40a0ae38", // plate of food
    ],
    about: [
      "photo-1414235077428-338989a2e8c0", // chef plating
    ],
    general: [
      "photo-1559339352-11d035aa65de",
    ],
  },
  cafe: {
    hero: [
      "photo-1554118811-1e0d58224f24", // cafe interior
      "photo-1495474472287-4d71bcdd2085", // latte art
      "photo-1453614512568-c4024d13c247", // barista
    ],
    about: [
      "photo-1442512595331-e89e73853f31",
    ],
    general: [
      "photo-1559925393-8be0ec4767c8",
    ],
  },
  lawyer: {
    hero: [
      "photo-1505664194779-8beaceb93744", // law books
      "photo-1521791136064-7986c2920216", // handshake office
    ],
    about: [
      "photo-1521791136064-7986c2920216",
    ],
    general: [
      "photo-1450101499163-c8848c66ca85", // legal pad + pen
    ],
  },
  accountant: {
    hero: [
      "photo-1554224155-6726b3ff858f", // accounting desk
      "photo-1454165804606-c3d57bc86b40", // calculator + spreadsheets
    ],
    about: [
      "photo-1573497019418-b400bb3ab074", // professional working
    ],
    general: [
      "photo-1554224154-26032cdc0bff",
    ],
  },
  consulting: {
    hero: [
      "photo-1542744173-8e7e53415bb0", // strategy meeting
      "photo-1556761175-5973dc0f32e7", // whiteboard
    ],
    about: [
      "photo-1551836022-d5d88e9218df",
    ],
    general: [
      "photo-1551836022-d5d88e9218df",
    ],
  },
  psychology: {
    hero: [
      "photo-1573497019940-1c28c88b4f3e", // calm therapy room
      "photo-1517502884422-41eaead166d4", // empty chairs
    ],
    about: [
      "photo-1573497019418-b400bb3ab074",
    ],
    general: [
      "photo-1499209974431-9dddcece7f88",
    ],
  },
  veterinary: {
    hero: [
      "photo-1583337130417-3346a1be7dee", // vet with dog
      "photo-1601758228041-f3b2795255f1", // pets close-up
    ],
    about: [
      "photo-1612531822498-7c5dca7d4a99",
    ],
    general: [
      "photo-1601758228041-f3b2795255f1",
    ],
  },
  automotive: {
    hero: [
      "photo-1486006920555-c77dcf18193c", // car workshop
      "photo-1487754180451-c456f719a1fc", // mechanic working
    ],
    about: [
      "photo-1486006920555-c77dcf18193c",
    ],
    general: [
      "photo-1492144534655-ae79c964c9d7",
    ],
  },
  hotel_bnb: {
    hero: [
      "photo-1566073771259-6a8506099945", // hotel room
      "photo-1455587734955-081b22074882", // lobby
    ],
    about: [
      "photo-1551882547-ff40c63fe5fa",
    ],
    general: [
      "photo-1542314831-068cd1dbfeeb",
    ],
  },
  education: {
    hero: [
      "photo-1503676260728-1c00da094a0b", // classroom
      "photo-1427504494785-3a9ca7044f45", // notebooks + pen
    ],
    about: [
      "photo-1524178232363-1fb2b075b655",
    ],
    general: [
      "photo-1456513080510-7bf3a84b82f8",
    ],
  },
  tattoo_studio: {
    hero: [
      "photo-1565058379802-bbe93b2f703a", // tattoo artist working
      "photo-1542856391-010fb87dcfed", // tattoo studio
    ],
    about: [
      "photo-1542856391-010fb87dcfed",
    ],
    general: [
      "photo-1611501275019-9b5cda994e8d",
    ],
  },
};

// Generic fallback when an industry isn't in the bank
const GENERIC_BANK: IndustryBank = {
  hero: [
    "photo-1497366216548-37526070297c", // bright office
    "photo-1499951360447-b19be8fe80f5", // workspace flatlay
    "photo-1521737711867-e3b97375f902", // creative desk
  ],
  about: [
    "photo-1521737711867-e3b97375f902",
    "photo-1573497019418-b400bb3ab074",
  ],
  general: [
    "photo-1517694712202-14dd9538aa97",
  ],
};

export interface PickedImage {
  url: string;        // CDN-ready URL with width + quality
  thumbUrl: string;   // smaller version for previews
  photoId: string;    // raw Unsplash ID, for traceability
  attribution: {
    source: "unsplash";
    photoUrl: string; // canonical Unsplash page
  };
}

function buildUrl(photoId: string, width: number, quality: number): string {
  return `https://images.unsplash.com/${photoId}?w=${width}&q=${quality}&auto=format&fit=crop`;
}

function bankFor(industry: string): IndustryBank {
  return INDUSTRY_BANK[industry] || GENERIC_BANK;
}

// Deterministic pick when a seed is provided (so repeat generations
// don't fight each other). Otherwise random.
function pickFrom<T>(pool: T[], seed?: number): T {
  if (pool.length === 0) throw new Error("Image pool empty");
  if (typeof seed === "number") {
    return pool[Math.abs(seed) % pool.length];
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

export function pickImage(
  industry: string,
  category: ImageCategory,
  seed?: number,
): PickedImage {
  const bank = bankFor(industry);
  const pool = bank[category].length > 0 ? bank[category] : bank.general.length > 0 ? bank.general : bank.hero;
  const photoId = pickFrom(pool, seed);
  // Hero needs full-bleed wide; about/general can be smaller
  const width = category === "hero" ? 1800 : 1200;
  return {
    url: buildUrl(photoId, width, 80),
    thumbUrl: buildUrl(photoId, 400, 75),
    photoId,
    attribution: {
      source: "unsplash",
      photoUrl: `https://unsplash.com/photos/${photoId.replace(/^photo-/, "")}`,
    },
  };
}

export function pickImages(
  industry: string,
  category: ImageCategory,
  count: number,
): PickedImage[] {
  const bank = bankFor(industry);
  const pool = bank[category].length > 0 ? bank[category] : bank.general.length > 0 ? bank.general : bank.hero;
  // Unique pick when count <= pool size, otherwise reuse with offset
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return Array.from({ length: count }, (_, i) => {
    const photoId = shuffled[i % shuffled.length];
    const width = category === "hero" ? 1800 : 1200;
    return {
      url: buildUrl(photoId, width, 80),
      thumbUrl: buildUrl(photoId, 400, 75),
      photoId,
      attribution: {
        source: "unsplash" as const,
        photoUrl: `https://unsplash.com/photos/${photoId.replace(/^photo-/, "")}`,
      },
    };
  });
}

export function listSupportedIndustries(): string[] {
  return Object.keys(INDUSTRY_BANK);
}
