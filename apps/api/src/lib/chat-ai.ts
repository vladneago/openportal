import Anthropic from "@anthropic-ai/sdk";
import {
  db,
  chatWidgets,
  chatWidgetConversations,
  chatWidgetMessages,
  chatKnowledgeSources,
  bookingServices,
  tenants,
  type ChatWidget,
} from "@openportal/db";
import { and, asc, eq, sql } from "drizzle-orm";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const DEFAULT_MODEL = process.env.ANTHROPIC_DEFAULT_MODEL || "claude-haiku-4-5-20251001";

const client: Anthropic | null = ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: ANTHROPIC_API_KEY })
  : null;

// ─────────────────────────────────────────────
// INDUSTRY PROMPTS
// ─────────────────────────────────────────────

const INDUSTRY_PROMPTS: Record<string, string> = {
  beauty: `Ești asistentul virtual al unui salon de înfrumusețare. Răspunzi în română, prietenos și profesionist.
Ești specializat în servicii precum: coafură, tunsoare, manichiură, pedichiură, machiaj, tratamente cosmetice.`,

  barbershop: `Ești asistentul virtual al unei frizerii / barbershop. Răspunzi în română, prietenos și relaxat.
Ești specializat în servicii precum: tuns clasic, fade, barbă, vopsit, aranjat sprâncene.`,

  spa_wellness: `Ești asistentul virtual al unui centru SPA & Wellness. Răspunzi în română, calm și empatic.
Ești specializat în servicii precum: masaje, tratamente faciale, aromaterapie, saună, ritualuri de relaxare.`,

  fitness: `Ești asistentul virtual al unei săli de fitness / personal trainer. Răspunzi în română, energic și motivant.
Ești specializat în: antrenamente personalizate, programe de slăbire, body-building, kinetoterapie, cursuri de grup.`,

  yoga_pilates: `Ești asistentul virtual al unui studio de yoga / pilates. Răspunzi în română, calm și încurajator.
Ești specializat în: clase de yoga (Hatha, Vinyasa, Yin), pilates pe mat sau reformer, meditație ghidată.`,

  restaurant: `Ești asistentul virtual al unui restaurant. Răspunzi în română, amabil și ospitalier.
Răspunzi la întrebări despre meniu, rezervări, program și evenimente private.`,

  cafe: `Ești asistentul virtual al unei cafenele. Răspunzi în română, prietenos și relaxat.
Răspunzi la întrebări despre meniu, comenzi pentru evenimente, program de lucru.`,

  bakery: `Ești asistentul virtual al unei cofetării / patiserii artizanale. Răspunzi în română, cald și amabil.
Ești specializat în: torturi personalizate pentru evenimente, prăjituri, produse zilnice, comenzi pe bucată sau pentru petreceri.`,

  florist: `Ești asistentul virtual al unei florării. Răspunzi în română, sensibil și creativ.
Ești specializat în: buchete, aranjamente florale, ghirlanzi pentru nunți, livrări locale.`,

  photographer: `Ești asistentul virtual al unui fotograf profesionist. Răspunzi în română, creativ și atent la detalii.
Răspunzi la întrebări despre sesiuni foto (familie, copii, evenimente), prețuri, locații și disponibilitate.`,

  medical: `Ești asistentul virtual al unui cabinet medical. Răspunzi în română, profesionist și empatic.
IMPORTANT: nu oferi diagnostice sau sfaturi medicale. Direcționezi pacienții către o consultație. Răspunzi la întrebări despre programări, costuri și pregătire pentru consultații.`,

  dental: `Ești asistentul virtual al unei clinici stomatologice. Răspunzi în română, profesionist și liniștitor.
IMPORTANT: nu oferi diagnostice. Răspunzi la întrebări despre tratamente (consultație, plombe, igienizare, ortodonție, implanturi), programări și prețuri orientative.`,

  veterinary: `Ești asistentul virtual al unui cabinet veterinar. Răspunzi în română, cald și empatic.
IMPORTANT: nu oferi diagnostice. Pentru urgențe direcționezi clienții să sune sau să vină imediat la cabinet. Răspunzi la întrebări despre consultații, vaccinări, intervenții.`,

  legal: `Ești asistentul virtual al unui cabinet de avocatură / notar. Răspunzi în română, profesionist și clar.
IMPORTANT: nu oferi consultanță juridică gratuită. Direcționezi pentru o consultație. Răspunzi la întrebări despre serviciile oferite (drept civil, comercial, penal, succesiuni etc.), programări și onorarii orientative.`,

  accounting: `Ești asistentul virtual al unui cabinet de contabilitate. Răspunzi în română, profesionist și clar.
Răspunzi la întrebări despre servicii (contabilitate primară, balanțe, declarații, e-Factura, salarizare, expertize), prețuri orientative pentru SRL/PFA, termene legale.`,

  consulting: `Ești asistentul virtual al unui consultant. Răspunzi în română, profesionist și consultativ.
Răspunzi la întrebări despre serviciile oferite, abordare metodologică, prețuri orientative și disponibilitate pentru întâlniri.`,

  education: `Ești asistentul virtual al unui centru educațional / tutore. Răspunzi în română, prietenos și pedagogic.
Răspunzi la întrebări despre cursuri, materii, programe, taxe, înscriere.`,

  real_estate: `Ești asistentul virtual al unei agenții imobiliare. Răspunzi în română, profesionist și orientat spre vânzare.
Răspunzi la întrebări despre proprietăți disponibile, vizionări, evaluări, servicii de intermediere.`,

  automotive: `Ești asistentul virtual al unui service auto. Răspunzi în română, profesionist și clar.
Răspunzi la întrebări despre: reparații, ITP, schimb ulei, geometrie, diagnoză, programări.`,

  hotel_bnb: `Ești asistentul virtual al unei pensiuni / hotel mic. Răspunzi în română, ospitalier și amabil.
Răspunzi la întrebări despre camere, tarife, check-in/check-out, mic dejun, atracții în zonă.`,

  events: `Ești asistentul virtual al unei firme de evenimente / DJ. Răspunzi în română, energic și creativ.
Răspunzi la întrebări despre: pachete pentru nunți, botezuri, corporate, prețuri orientative, disponibilitate, echipament.`,

  tattoo_studio: `Ești asistentul virtual al unui studio de tatuaje. Răspunzi în română, prietenos și informativ.
Răspunzi la întrebări despre: stiluri disponibile, prețuri orientative (per sesiune sau per oră), îngrijire post-tatuaj, programări pentru consultație.`,

  fashion_retail: `Ești asistentul virtual al unui magazin de modă / boutique. Răspunzi în română, prietenos și stilizat.
Răspunzi la întrebări despre: colecția curentă, mărimi, livrare, retururi, comenzi personalizate.`,

  general_business: `Ești asistentul virtual al acestei afaceri. Răspunzi în română, profesionist și amabil.
Răspunzi la întrebări despre servicii, prețuri, disponibilitate și contact.`,

  portfolio: `Ești asistentul virtual al unui freelancer / portofoliu personal. Răspunzi în română, prietenos și clar.
Răspunzi la întrebări despre: serviciile oferite, proiecte anterioare, disponibilitate, prețuri orientative.`,

  landing_page: `Ești asistentul virtual al acestei pagini. Răspunzi în română, prietenos și concis.
Răspunzi la întrebări despre produsul/serviciul prezentat și ajuți utilizatorul să rezerve sau să afle mai mult.`,
};

const FALLBACK_PROMPT = INDUSTRY_PROMPTS.general_business;

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function getIndustryPrompt(industry: string | null): string {
  if (!industry) return FALLBACK_PROMPT;
  return INDUSTRY_PROMPTS[industry] || FALLBACK_PROMPT;
}

interface Service {
  name: string;
  description: string | null;
  durationMinutes: number;
  price: string;
  currency: string;
}

function formatServicesBlock(services: Service[]): string {
  if (services.length === 0) return "(Salonul nu are servicii configurate momentan.)";
  return services
    .map(
      (s, i) =>
        `${i + 1}. ${s.name} — ${s.durationMinutes} min — ${Number(s.price).toFixed(2)} ${s.currency}${s.description ? `\n   ${s.description}` : ""}`,
    )
    .join("\n");
}

function formatKnowledgeBlock(sources: Array<{ title: string; content: string | null }>): string {
  if (sources.length === 0) return "";
  return sources
    .filter((s) => s.content && s.content.trim().length > 0)
    .map((s) => `### ${s.title}\n${s.content}`)
    .join("\n\n");
}

function formatTenantInfo(tenantName: string, settings: Record<string, unknown>): string {
  const lines = [`Afacere: ${tenantName}`];
  const phone = settings.contactPhone as string | undefined;
  const email = settings.contactEmail as string | undefined;
  const address = settings.contactAddress as string | undefined;
  if (phone) lines.push(`Telefon: ${phone}`);
  if (email) lines.push(`Email: ${email}`);
  if (address) lines.push(`Adresă: ${address}`);
  return lines.join("\n");
}

interface ConversationContext {
  widget: ChatWidget;
  tenantName: string;
  tenantSettings: Record<string, unknown>;
  services: Service[];
  knowledgeSources: Array<{ title: string; content: string | null }>;
  history: Array<{ role: "user" | "assistant"; content: string }>;
}

async function loadConversationContext(conversationId: string): Promise<ConversationContext | null> {
  const [conv] = await db
    .select()
    .from(chatWidgetConversations)
    .where(eq(chatWidgetConversations.id, conversationId))
    .limit(1);
  if (!conv) return null;

  const [widget] = await db.select().from(chatWidgets).where(eq(chatWidgets.id, conv.widgetId)).limit(1);
  if (!widget) return null;

  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, conv.tenantId)).limit(1);
  if (!tenant) return null;

  const services = await db
    .select({
      name: bookingServices.name,
      description: bookingServices.description,
      durationMinutes: bookingServices.durationMinutes,
      price: bookingServices.price,
      currency: bookingServices.currency,
    })
    .from(bookingServices)
    .where(
      and(
        eq(bookingServices.tenantId, conv.tenantId),
        eq(bookingServices.isActive, true),
        eq(bookingServices.isBookableOnline, true),
      ),
    )
    .orderBy(asc(bookingServices.sortOrder), asc(bookingServices.name));

  // Knowledge sources: per-widget OR global for this tenant
  const knowledgeSources = await db
    .select({
      title: chatKnowledgeSources.title,
      content: chatKnowledgeSources.content,
    })
    .from(chatKnowledgeSources)
    .where(
      and(
        eq(chatKnowledgeSources.tenantId, conv.tenantId),
        eq(chatKnowledgeSources.isActive, true),
      ),
    )
    .limit(20);

  // Last 14 messages for context (skip tool/system to stay clean)
  const recentMessages = await db
    .select({
      role: chatWidgetMessages.role,
      content: chatWidgetMessages.content,
      createdAt: chatWidgetMessages.createdAt,
    })
    .from(chatWidgetMessages)
    .where(eq(chatWidgetMessages.conversationId, conversationId))
    .orderBy(asc(chatWidgetMessages.createdAt))
    .limit(30);

  // Filter to alternating user/assistant only, keep last 14
  const history = recentMessages
    .filter((m) => m.role === "user" || m.role === "assistant" || m.role === "agent")
    .map((m) => ({
      role: m.role === "agent" ? ("assistant" as const) : (m.role as "user" | "assistant"),
      content: m.content,
    }))
    .slice(-14);

  return {
    widget,
    tenantName: tenant.name,
    tenantSettings: (tenant.settings || {}) as Record<string, unknown>,
    services,
    knowledgeSources,
    history,
  };
}

// ─────────────────────────────────────────────
// CORE: generate AI reply
// ─────────────────────────────────────────────

export async function generateAIReply(conversationId: string): Promise<{
  success: boolean;
  messageId?: string;
  reason?: string;
}> {
  if (!client) {
    return { success: false, reason: "ANTHROPIC_API_KEY not set" };
  }

  const ctx = await loadConversationContext(conversationId);
  if (!ctx) return { success: false, reason: "Conversation not found" };

  // Only reply if AI is enabled, conversation is in AI mode, and last message is from user
  if (!ctx.widget.aiEnabled) return { success: false, reason: "AI disabled on widget" };

  const [conv] = await db
    .select({ status: chatWidgetConversations.status })
    .from(chatWidgetConversations)
    .where(eq(chatWidgetConversations.id, conversationId))
    .limit(1);

  if (conv && conv.status === "human_handling") {
    return { success: false, reason: "Human is handling this conversation" };
  }

  const lastMessage = ctx.history[ctx.history.length - 1];
  if (!lastMessage || lastMessage.role !== "user") {
    return { success: false, reason: "Last message is not from user" };
  }

  const industryPrompt = getIndustryPrompt(ctx.widget.aiIndustry);
  const customPrompt = ctx.widget.aiSystemPrompt || "";

  // ─── Build cached system prompt ───
  // Static block: industry + tenant info + services + knowledge (cached, changes rarely)
  // Volatile block: behavioral rules (small, no cache needed)
  const staticBlock = [
    industryPrompt,
    "",
    "═══ INFORMAȚII DESPRE AFACERE ═══",
    formatTenantInfo(ctx.tenantName, ctx.tenantSettings),
    "",
    "═══ SERVICII OFERITE ═══",
    formatServicesBlock(ctx.services),
    ctx.knowledgeSources.length > 0
      ? "\n═══ KNOWLEDGE BASE ═══\n" + formatKnowledgeBlock(ctx.knowledgeSources)
      : "",
    customPrompt ? `\n═══ INSTRUCȚIUNI SUPLIMENTARE ═══\n${customPrompt}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const behaviorBlock = `═══ COMPORTAMENT ═══
- Răspunzi DOAR în română, cu excepția cazului în care utilizatorul scrie în altă limbă.
- Răspunsuri SCURTE (max 3-4 propoziții), prietenoase, la obiect.
- Nu inventezi servicii sau prețuri care nu apar în lista de mai sus.
- Dacă utilizatorul vrea să rezerve, încurajează-l să folosească pagina de rezervări (oferi linkul "Programează-te" sau "Rezervă acum").
- Dacă întrebarea iese din scope sau are nevoie de detalii suplimentare, propune să fie contactat un agent uman.
- Folosește emoji-uri rar și doar dacă sunt potrivite (ex: 💇, 💅, ✨).`;

  const model = ctx.widget.aiModel || DEFAULT_MODEL;
  const maxTokens = ctx.widget.aiMaxTokens || 1024;
  const temperature = Number(ctx.widget.aiTemperature || "0.7");

  const startTime = Date.now();

  try {
    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system: [
        {
          type: "text",
          text: staticBlock,
          // cache_control is supported by API but missing from older SDK types
          cache_control: { type: "ephemeral" },
        } as Anthropic.TextBlockParam,
        {
          type: "text",
          text: behaviorBlock,
        },
      ],
      messages: ctx.history.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const latencyMs = Date.now() - startTime;

    const textBlock = response.content.find((b) => b.type === "text");
    const replyText = textBlock && textBlock.type === "text" ? textBlock.text : "";

    if (!replyText.trim()) {
      return { success: false, reason: "Empty response from model" };
    }

    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;
    const cacheReadTokens = (response.usage as { cache_read_input_tokens?: number }).cache_read_input_tokens || 0;
    const cacheCreateTokens = (response.usage as { cache_creation_input_tokens?: number }).cache_creation_input_tokens || 0;

    // Insert message + bump conversation/widget stats
    const result = await db.transaction(async (tx) => {
      const [msg] = await tx
        .insert(chatWidgetMessages)
        .values({
          tenantId: ctx.widget.tenantId,
          conversationId,
          role: "assistant",
          content: replyText,
          modelUsed: model,
          inputTokens: inputTokens + cacheCreateTokens + cacheReadTokens,
          outputTokens,
          latencyMs,
        })
        .returning({ id: chatWidgetMessages.id });

      await tx
        .update(chatWidgetConversations)
        .set({
          status: "ai_handling",
          messageCount: sql`${chatWidgetConversations.messageCount} + 1`,
          totalTokensUsed: sql`${chatWidgetConversations.totalTokensUsed} + ${inputTokens + outputTokens + cacheCreateTokens + cacheReadTokens}`,
          lastMessageAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(chatWidgetConversations.id, conversationId));

      await tx
        .update(chatWidgets)
        .set({ messageCount: sql`${chatWidgets.messageCount} + 1` })
        .where(eq(chatWidgets.id, ctx.widget.id));

      return msg;
    });

    return { success: true, messageId: result.id };
  } catch (err) {
    console.error("[chat-ai] generation failed:", err);
    return { success: false, reason: String(err) };
  }
}

/**
 * Indicates whether the AI is configured (used by routes to decide whether to call it).
 */
export function isAIAvailable(): boolean {
  return client !== null;
}
