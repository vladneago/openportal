import Anthropic from "@anthropic-ai/sdk";
import {
  db,
  bookingServices,
  bookingResources,
  bookingAvailability,
  bookingAppointments,
  bookingBlockedSlots,
  bookingCustomers,
  chatWidgetConversations,
} from "@openportal/db";
import { and, asc, eq, gt, gte, inArray, lt, or, sql } from "drizzle-orm";
import { notifyBookingConfirmed } from "./booking-notifications";

// ─────────────────────────────────────────────
// Chat-widget AI tools — function calling for Claude
//
// These tools let the AI agent actually perform actions on behalf of
// the visitor: find available slots, book appointments, escalate to a
// human. The differentiator vs Booksy/Wix is that visitors can talk
// to an AI in natural language and get a confirmed booking in the
// same conversation, not just FAQ answers.
// ─────────────────────────────────────────────

export interface ToolContext {
  tenantId: string;
  conversationId: string;
  widgetId: string;
  visitorName: string | null;
  visitorEmail: string | null;
  visitorPhone: string | null;
}

interface AvailableSlot {
  serviceId: string;
  serviceName: string;
  resourceId: string;
  resourceName: string;
  startAt: string;
  endAt: string;
  price: string;
  currency: string;
  durationMinutes: number;
}

// ─────────────────────────────────────────────
// Tool definitions (passed to Anthropic.tools)
// ─────────────────────────────────────────────

export const CHAT_TOOLS: Anthropic.Tool[] = [
  {
    name: "find_available_slots",
    description:
      "Caută slot-uri disponibile pentru programare la un anumit serviciu. Folosește când vizitatorul vrea să rezerve sau întreabă când este disponibil. Returnează primele N slot-uri din intervalul dat.",
    input_schema: {
      type: "object",
      properties: {
        serviceName: {
          type: "string",
          description: "Numele serviciului (potrivire fuzzy, ex: 'tuns', 'manichiură'). Trebuie să apară în lista de servicii ofertate.",
        },
        fromDate: {
          type: "string",
          description: "Data de început în format ISO YYYY-MM-DD. Default: azi.",
        },
        daysAhead: {
          type: "number",
          description: "Câte zile în viitor să caute. Default: 7. Max: 30.",
        },
        maxResults: {
          type: "number",
          description: "Câte slot-uri max să returneze. Default: 5. Max: 10.",
        },
      },
      required: ["serviceName"],
    },
  },
  {
    name: "book_appointment",
    description:
      'Crează o programare confirmată pentru vizitator. Folosește DOAR după ce: 1) ai chemat find_available_slots și ai un startAt valid, 2) ai numele și telefonul vizitatorului. Confirmă ÎNAINTE de a apela acest tool — întreabă vizitatorul „Confirmi rezervarea pentru…?" și abia după DA apelezi.',
    input_schema: {
      type: "object",
      properties: {
        serviceId: { type: "string", description: "ID-ul serviciului (din find_available_slots)" },
        resourceId: { type: "string", description: "ID-ul resursei (din find_available_slots)" },
        startAt: { type: "string", description: "Data+ora ISO 8601 a slot-ului ales (din find_available_slots)" },
        customerName: { type: "string", description: "Numele complet al clientului (ex: 'Maria Popescu')" },
        customerPhone: { type: "string", description: "Telefonul clientului. Format românesc OK." },
        customerEmail: { type: "string", description: "Email opțional pentru confirmare." },
        note: { type: "string", description: "Notă opțională a clientului (preferințe, alergii etc.)" },
      },
      required: ["serviceId", "resourceId", "startAt", "customerName", "customerPhone"],
    },
  },
  {
    name: "escalate_to_human",
    description:
      "Trimite conversația către un agent uman când vizitatorul cere asta explicit, când întrebarea iese din domeniul tău (probleme financiare complexe, reclamații, situații sensibile) sau când ai eșuat de două ori să rezolvi o cerere. Conversația va apărea în inbox-ul admin.",
    input_schema: {
      type: "object",
      properties: {
        reason: {
          type: "string",
          description: "Motivul scurt pentru escaladare (1 propoziție).",
        },
      },
      required: ["reason"],
    },
  },
];

// ─────────────────────────────────────────────
// Tool execution
// ─────────────────────────────────────────────

export async function executeTool(
  toolName: string,
  input: Record<string, unknown>,
  ctx: ToolContext,
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    switch (toolName) {
      case "find_available_slots":
        return await toolFindAvailableSlots(input, ctx);
      case "book_appointment":
        return await toolBookAppointment(input, ctx);
      case "escalate_to_human":
        return await toolEscalateToHuman(input, ctx);
      default:
        return { success: false, error: `Unknown tool: ${toolName}` };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

// ─────────────────────────────────────────────
// Tool 1: find_available_slots
// Picks all candidate resources (or those eligible for the service),
// scans the requested window day by day applying availability rules,
// existing appointments, and blocked slots. Returns up to maxResults
// chronologically.
// ─────────────────────────────────────────────

async function toolFindAvailableSlots(
  input: Record<string, unknown>,
  ctx: ToolContext,
): Promise<{ success: boolean; data?: AvailableSlot[]; error?: string }> {
  const serviceName = String(input.serviceName || "").trim();
  const fromDateStr = String(input.fromDate || new Date().toISOString().slice(0, 10));
  const daysAhead = Math.min(30, Math.max(1, Number(input.daysAhead) || 7));
  const maxResults = Math.min(10, Math.max(1, Number(input.maxResults) || 5));

  if (!serviceName) return { success: false, error: "serviceName este obligatoriu" };

  // Fuzzy-match service by name (case-insensitive substring)
  const services = await db
    .select()
    .from(bookingServices)
    .where(
      and(
        eq(bookingServices.tenantId, ctx.tenantId),
        eq(bookingServices.isActive, true),
        eq(bookingServices.isBookableOnline, true),
      ),
    );

  const lower = serviceName.toLowerCase();
  const service = services.find((s) => s.name.toLowerCase().includes(lower))
    || services.find((s) => lower.includes(s.name.toLowerCase()));

  if (!service) {
    return {
      success: false,
      error: `Nu am găsit niciun serviciu care să se potrivească cu „${serviceName}". Servicii disponibile: ${services.map((s) => s.name).join(", ")}`,
    };
  }

  // Resolve candidate resources
  let candidateResourceIds: string[];
  if (service.eligibleResourceIds && service.eligibleResourceIds.length > 0) {
    candidateResourceIds = service.eligibleResourceIds;
  } else {
    const rs = await db
      .select({ id: bookingResources.id })
      .from(bookingResources)
      .where(
        and(
          eq(bookingResources.tenantId, ctx.tenantId),
          eq(bookingResources.isActive, true),
          eq(bookingResources.isBookableOnline, true),
        ),
      );
    candidateResourceIds = rs.map((r) => r.id);
  }

  if (candidateResourceIds.length === 0) {
    return { success: false, error: "Nu există resurse active pentru bookable online." };
  }

  const resourcesById = new Map<string, string>();
  const rs = await db
    .select({ id: bookingResources.id, name: bookingResources.name })
    .from(bookingResources)
    .where(inArray(bookingResources.id, candidateResourceIds));
  for (const r of rs) resourcesById.set(r.id, r.name);

  const windowStart = new Date(`${fromDateStr}T00:00:00.000Z`);
  const windowEnd = new Date(windowStart.getTime() + daysAhead * 86400_000);

  // Fetch availability rules once (for all days in window)
  const availabilityRules = await db
    .select()
    .from(bookingAvailability)
    .where(
      and(
        eq(bookingAvailability.tenantId, ctx.tenantId),
        eq(bookingAvailability.isActive, true),
        inArray(bookingAvailability.resourceId, candidateResourceIds),
      ),
    );

  const appointments = await db
    .select({
      resourceId: bookingAppointments.resourceId,
      startAt: bookingAppointments.startAt,
      endAt: bookingAppointments.endAt,
    })
    .from(bookingAppointments)
    .where(
      and(
        eq(bookingAppointments.tenantId, ctx.tenantId),
        inArray(bookingAppointments.resourceId, candidateResourceIds),
        inArray(bookingAppointments.status, ["pending", "confirmed", "checked_in", "in_progress"]),
        gte(bookingAppointments.startAt, windowStart),
        lt(bookingAppointments.startAt, windowEnd),
      ),
    );

  const blockedSlots = await db
    .select()
    .from(bookingBlockedSlots)
    .where(
      and(
        eq(bookingBlockedSlots.tenantId, ctx.tenantId),
        or(
          inArray(bookingBlockedSlots.resourceId, candidateResourceIds),
          sql`${bookingBlockedSlots.resourceId} IS NULL`,
        )!,
        lt(bookingBlockedSlots.startAt, windowEnd),
        gt(bookingBlockedSlots.endAt, windowStart),
      ),
    );

  const slotIncrementMinutes = 15;
  const duration = service.durationMinutes;
  const bufferAfter = service.bufferAfterMinutes;
  const bufferBefore = service.bufferBeforeMinutes;
  const minAdvance = service.minAdvanceBookingHours ?? 2;
  const earliestStart = new Date(Date.now() + minAdvance * 60 * 60 * 1000);

  const found: AvailableSlot[] = [];

  for (let day = 0; day < daysAhead && found.length < maxResults; day++) {
    const dayStart = new Date(windowStart.getTime() + day * 86400_000);
    const date = dayStart.toISOString().slice(0, 10);
    const dayOfWeek = dayStart.getUTCDay();

    const rulesForDay = availabilityRules.filter((r) => r.dayOfWeek === dayOfWeek);
    if (rulesForDay.length === 0) continue;

    for (const rule of rulesForDay) {
      if (rule.effectiveFrom && date < rule.effectiveFrom) continue;
      if (rule.effectiveUntil && date > rule.effectiveUntil) continue;

      const ruleStart = new Date(`${date}T${rule.startTime}`);
      const ruleEnd = new Date(`${date}T${rule.endTime}`);

      let cursor = new Date(ruleStart.getTime());

      while (cursor.getTime() + duration * 60_000 <= ruleEnd.getTime() && found.length < maxResults) {
        if (cursor.getTime() < earliestStart.getTime()) {
          cursor = new Date(cursor.getTime() + slotIncrementMinutes * 60_000);
          continue;
        }

        const slotStart = new Date(cursor.getTime() - bufferBefore * 60_000);
        const slotEnd = new Date(cursor.getTime() + (duration + bufferAfter) * 60_000);

        const apptConflict = appointments.some(
          (a) =>
            a.resourceId === rule.resourceId &&
            a.startAt.getTime() < slotEnd.getTime() &&
            a.endAt.getTime() > slotStart.getTime(),
        );
        const blockedConflict = blockedSlots.some(
          (b) =>
            (b.resourceId === rule.resourceId || b.resourceId === null) &&
            b.startAt.getTime() < slotEnd.getTime() &&
            b.endAt.getTime() > slotStart.getTime(),
        );

        if (!apptConflict && !blockedConflict) {
          found.push({
            serviceId: service.id,
            serviceName: service.name,
            resourceId: rule.resourceId,
            resourceName: resourcesById.get(rule.resourceId) || "Personal",
            startAt: cursor.toISOString(),
            endAt: new Date(cursor.getTime() + duration * 60_000).toISOString(),
            price: service.price,
            currency: service.currency,
            durationMinutes: duration,
          });
        }

        cursor = new Date(cursor.getTime() + slotIncrementMinutes * 60_000);
      }
    }
  }

  if (found.length === 0) {
    return {
      success: true,
      data: [],
      error: `Niciun slot disponibil pentru „${service.name}" în următoarele ${daysAhead} zile. Sugerează vizitatorului să încerce un alt serviciu sau o dată mai îndepărtată.`,
    };
  }

  return { success: true, data: found };
}

// ─────────────────────────────────────────────
// Tool 2: book_appointment
// Atomically: finds/creates customer by phone, validates the slot is
// still free, creates the appointment, links visitor to conversation,
// sends email confirmation. Conflict-detection mirrors the public
// booking flow.
// ─────────────────────────────────────────────

async function toolBookAppointment(
  input: Record<string, unknown>,
  ctx: ToolContext,
): Promise<{
  success: boolean;
  data?: { appointmentId: string; bookingCode: string; startAt: string; endAt: string };
  error?: string;
}> {
  const serviceId = String(input.serviceId || "");
  const resourceId = String(input.resourceId || "");
  const startAt = String(input.startAt || "");
  const customerName = String(input.customerName || "").trim();
  const customerPhone = String(input.customerPhone || "").trim();
  const customerEmail = input.customerEmail ? String(input.customerEmail).trim().toLowerCase() : null;
  const note = input.note ? String(input.note).slice(0, 2000) : null;

  if (!serviceId || !resourceId || !startAt || !customerName || !customerPhone) {
    return { success: false, error: "Lipsesc câmpuri obligatorii (serviceId, resourceId, startAt, customerName, customerPhone)." };
  }

  const startDate = new Date(startAt);
  if (Number.isNaN(startDate.getTime())) {
    return { success: false, error: `startAt invalid: ${startAt}` };
  }

  // Validate service + resource belong to tenant
  const [service] = await db
    .select()
    .from(bookingServices)
    .where(
      and(
        eq(bookingServices.tenantId, ctx.tenantId),
        eq(bookingServices.id, serviceId),
        eq(bookingServices.isActive, true),
      ),
    )
    .limit(1);
  if (!service) return { success: false, error: "Serviciu inexistent sau inactiv." };

  const [resource] = await db
    .select()
    .from(bookingResources)
    .where(
      and(
        eq(bookingResources.tenantId, ctx.tenantId),
        eq(bookingResources.id, resourceId),
        eq(bookingResources.isActive, true),
      ),
    )
    .limit(1);
  if (!resource) return { success: false, error: "Resursă inexistentă sau inactivă." };

  const endDate = new Date(startDate.getTime() + service.durationMinutes * 60_000);
  const slotStart = new Date(startDate.getTime() - service.bufferBeforeMinutes * 60_000);
  const slotEnd = new Date(endDate.getTime() + service.bufferAfterMinutes * 60_000);

  // Conflict check
  const conflicts = await db
    .select({ id: bookingAppointments.id })
    .from(bookingAppointments)
    .where(
      and(
        eq(bookingAppointments.tenantId, ctx.tenantId),
        eq(bookingAppointments.resourceId, resourceId),
        inArray(bookingAppointments.status, ["pending", "confirmed", "checked_in", "in_progress"]),
        lt(bookingAppointments.startAt, slotEnd),
        gt(bookingAppointments.endAt, slotStart),
      ),
    )
    .limit(1);

  if (conflicts.length > 0) {
    return { success: false, error: "Slot-ul nu mai este disponibil. Cere AI să caute alte ore." };
  }

  // Find or create customer (by phone first, then email)
  let customerId: string | null = null;
  const [byPhone] = await db
    .select()
    .from(bookingCustomers)
    .where(and(eq(bookingCustomers.tenantId, ctx.tenantId), eq(bookingCustomers.phone, customerPhone)))
    .limit(1);

  if (byPhone) {
    customerId = byPhone.id;
  } else if (customerEmail) {
    const [byEmail] = await db
      .select()
      .from(bookingCustomers)
      .where(and(eq(bookingCustomers.tenantId, ctx.tenantId), eq(bookingCustomers.email, customerEmail)))
      .limit(1);
    if (byEmail) customerId = byEmail.id;
  }

  if (!customerId) {
    const parts = customerName.trim().split(/\s+/);
    const firstName = parts[0] || customerName;
    const lastName = parts.slice(1).join(" ") || null;
    const [created] = await db
      .insert(bookingCustomers)
      .values({
        tenantId: ctx.tenantId,
        firstName,
        lastName,
        phone: customerPhone,
        email: customerEmail,
        emailConsent: true,
        smsConsent: true,
        marketingConsent: false,
      })
      .returning({ id: bookingCustomers.id });
    customerId = created.id;
  }

  // Generate booking code (unique-enough for short windows; retry on collision)
  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  };

  let bookingCode = generateCode();
  for (let attempt = 0; attempt < 3; attempt++) {
    const [exists] = await db
      .select({ id: bookingAppointments.id })
      .from(bookingAppointments)
      .where(eq(bookingAppointments.bookingCode, bookingCode))
      .limit(1);
    if (!exists) break;
    bookingCode = generateCode();
  }

  const [appointment] = await db
    .insert(bookingAppointments)
    .values({
      tenantId: ctx.tenantId,
      bookingCode,
      customerId,
      resourceId,
      serviceId,
      startAt: startDate,
      endAt: endDate,
      status: "confirmed",
      channel: "ai_chat",
      priceSnapshot: service.price,
      currencySnapshot: service.currency,
      vatRateSnapshot: service.vatRate,
      customerNote: note,
    })
    .returning();

  // Bump customer stats
  await db
    .update(bookingCustomers)
    .set({
      totalAppointments: sql`${bookingCustomers.totalAppointments} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(bookingCustomers.id, customerId));

  // Link customer to conversation so future stats join cleanly
  await db
    .update(chatWidgetConversations)
    .set({
      customerId,
      visitorName: ctx.visitorName ?? customerName,
      visitorPhone: ctx.visitorPhone ?? customerPhone,
      visitorEmail: ctx.visitorEmail ?? customerEmail,
      updatedAt: new Date(),
    })
    .where(eq(chatWidgetConversations.id, ctx.conversationId));

  // Send confirmation email (fire-and-forget; errors logged but not blocking)
  notifyBookingConfirmed(appointment.id).catch((err) => {
    console.error("[chat-tool] confirmation email failed:", err);
  });

  return {
    success: true,
    data: {
      appointmentId: appointment.id,
      bookingCode,
      startAt: startDate.toISOString(),
      endAt: endDate.toISOString(),
    },
  };
}

// ─────────────────────────────────────────────
// Tool 3: escalate_to_human
// Flips the conversation status so admin sees it as needing attention.
// The next message from a user won't trigger AI (generateAIReply
// returns early on human_handling).
// ─────────────────────────────────────────────

async function toolEscalateToHuman(
  input: Record<string, unknown>,
  ctx: ToolContext,
): Promise<{ success: boolean; data?: { status: string; reason: string }; error?: string }> {
  const reason = String(input.reason || "").trim() || "Vizitatorul cere agent uman";

  await db
    .update(chatWidgetConversations)
    .set({
      status: "human_handling",
      updatedAt: new Date(),
    })
    .where(eq(chatWidgetConversations.id, ctx.conversationId));

  return {
    success: true,
    data: { status: "human_handling", reason },
  };
}
