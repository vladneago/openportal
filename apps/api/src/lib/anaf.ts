import { db, tenantAnafCredentials, type TenantAnafCredentials } from "@openportal/db";
import { eq } from "drizzle-orm";

// ─────────────────────────────────────────────
// ANAF SPV client
//
// Talks to ANAF's e-Factura REST API (Spațiul Privat Virtual).
//
//   OAuth2 token endpoint: https://logincert.anaf.ro/anaf-oauth2/v1/token
//   Upload:                POST /upload?standard=UBL&cif={CUI}
//   Status:                GET  /stareMesaj?id_incarcare={uploadId}
//   Download:              GET  /descarcare?id={indexId}
//
// Base URLs:
//   test → https://api.anaf.ro/test/FCTEL/rest
//   prod → https://api.anaf.ro/prod/FCTEL/rest
//
// Dev fallback: when ANAF_CLIENT_ID/SECRET env is not set, we operate in
// stub mode — uploads return fake IDs, status polls flip to "accepted"
// after a short delay. This keeps the whole pipeline testable without
// requiring a real ANAF developer account.
// ─────────────────────────────────────────────

const ANAF_CLIENT_ID = process.env.ANAF_CLIENT_ID;
const ANAF_CLIENT_SECRET = process.env.ANAF_CLIENT_SECRET;
const ANAF_REDIRECT_URI = process.env.ANAF_REDIRECT_URI || "http://localhost:4000/api/v1/billing/anaf/oauth/callback";
const ANAF_TOKEN_URL = process.env.ANAF_TOKEN_URL || "https://logincert.anaf.ro/anaf-oauth2/v1/token";
const ANAF_AUTH_URL = process.env.ANAF_AUTH_URL || "https://logincert.anaf.ro/anaf-oauth2/v1/authorize";

export const anafEnabled = Boolean(ANAF_CLIENT_ID && ANAF_CLIENT_SECRET);

function getBaseUrl(env: "test" | "prod"): string {
  return env === "prod"
    ? "https://api.anaf.ro/prod/FCTEL/rest"
    : "https://api.anaf.ro/test/FCTEL/rest";
}

// ─────────────────────────────────────────────
// Credentials lookup
// ─────────────────────────────────────────────

export async function getAnafCreds(tenantId: string): Promise<TenantAnafCredentials | null> {
  const [row] = await db
    .select()
    .from(tenantAnafCredentials)
    .where(eq(tenantAnafCredentials.tenantId, tenantId))
    .limit(1);
  return row ?? null;
}

export async function upsertAnafCreds(
  tenantId: string,
  patch: Partial<typeof tenantAnafCredentials.$inferInsert>,
): Promise<TenantAnafCredentials> {
  const existing = await getAnafCreds(tenantId);
  if (existing) {
    const [row] = await db
      .update(tenantAnafCredentials)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(tenantAnafCredentials.id, existing.id))
      .returning();
    return row;
  }
  const [row] = await db
    .insert(tenantAnafCredentials)
    .values({ tenantId, ...patch })
    .returning();
  return row;
}

// ─────────────────────────────────────────────
// OAuth2 — authorization URL + token exchange
// ─────────────────────────────────────────────

export function getAuthorizeUrl(state: string): string {
  if (!ANAF_CLIENT_ID) throw new Error("ANAF_CLIENT_ID not configured");
  const params = new URLSearchParams({
    response_type: "code",
    client_id: ANAF_CLIENT_ID,
    redirect_uri: ANAF_REDIRECT_URI,
    state,
  });
  return `${ANAF_AUTH_URL}?${params.toString()}`;
}

interface AnafTokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

export async function exchangeAuthCode(code: string): Promise<AnafTokenResponse> {
  if (!anafEnabled) {
    return {
      access_token: `stub_access_${Date.now()}`,
      refresh_token: `stub_refresh_${Date.now()}`,
      token_type: "Bearer",
      expires_in: 86400,
      scope: "efactura",
    };
  }
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: ANAF_CLIENT_ID!,
    client_secret: ANAF_CLIENT_SECRET!,
    redirect_uri: ANAF_REDIRECT_URI,
  });
  const res = await fetch(ANAF_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`ANAF token exchange failed (${res.status}): ${text.slice(0, 500)}`);
  }
  return (await res.json()) as AnafTokenResponse;
}

export async function refreshAccessToken(refreshToken: string): Promise<AnafTokenResponse> {
  if (!anafEnabled) {
    return {
      access_token: `stub_access_${Date.now()}`,
      refresh_token: refreshToken,
      token_type: "Bearer",
      expires_in: 86400,
    };
  }
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: ANAF_CLIENT_ID!,
    client_secret: ANAF_CLIENT_SECRET!,
  });
  const res = await fetch(ANAF_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`ANAF token refresh failed (${res.status}): ${text.slice(0, 500)}`);
  }
  return (await res.json()) as AnafTokenResponse;
}

// Guarantee a non-expired access token. If close to expiry (or expired),
// refresh in place and write back the new tokens.
export async function ensureFreshToken(
  tenantId: string,
): Promise<{ accessToken: string; environment: "test" | "prod"; cui: string } | null> {
  const creds = await getAnafCreds(tenantId);
  if (!creds || !creds.accessToken || !creds.cui) return null;

  const expiresSoon = !creds.tokenExpiresAt || creds.tokenExpiresAt.getTime() - Date.now() < 60_000;
  if (!expiresSoon) {
    return {
      accessToken: creds.accessToken,
      environment: creds.environment as "test" | "prod",
      cui: creds.cui,
    };
  }

  if (!creds.refreshToken) return null;
  const next = await refreshAccessToken(creds.refreshToken);
  const expiresAt = new Date(Date.now() + next.expires_in * 1000);
  await db
    .update(tenantAnafCredentials)
    .set({
      accessToken: next.access_token,
      refreshToken: next.refresh_token ?? creds.refreshToken,
      tokenExpiresAt: expiresAt,
      updatedAt: new Date(),
    })
    .where(eq(tenantAnafCredentials.id, creds.id));

  return {
    accessToken: next.access_token,
    environment: creds.environment as "test" | "prod",
    cui: creds.cui,
  };
}

// ─────────────────────────────────────────────
// Upload — POST /upload?standard=UBL&cif=...
// Returns ANAF upload-id (id_incarcare).
// ─────────────────────────────────────────────

export interface UploadResult {
  uploadId: string;
  rawResponse: string;
}

export async function uploadInvoice(
  tenantId: string,
  xml: string,
): Promise<UploadResult> {
  const fresh = await ensureFreshToken(tenantId);

  // Stub mode: no creds OR ANAF SDK disabled in env
  if (!fresh || !anafEnabled) {
    const fakeId = `STUB-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    return {
      uploadId: fakeId,
      rawResponse: `<?xml version="1.0"?><header xmlns="mfp:anaf:dgti:spv:respUploadFisier:v1" dateResponse="${new Date().toISOString()}" ExecutionStatus="0" index_incarcare="${fakeId}"/>`,
    };
  }

  const base = getBaseUrl(fresh.environment);
  const url = `${base}/upload?standard=UBL&cif=${encodeURIComponent(fresh.cui)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${fresh.accessToken}`,
      "Content-Type": "application/xml",
    },
    body: xml,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`ANAF upload failed (${res.status}): ${text.slice(0, 500)}`);
  }
  const match = text.match(/index_incarcare\s*=\s*"([^"]+)"/i);
  if (!match) {
    throw new Error(`ANAF upload: no index_incarcare in response: ${text.slice(0, 300)}`);
  }
  return { uploadId: match[1], rawResponse: text };
}

// ─────────────────────────────────────────────
// Status — GET /stareMesaj?id_incarcare=...
// Possible states: "in prelucrare" | "ok" | "nok" | "XML cu erori
// nepreluat" | "limita zilnica de mesaje atinsa" | etc.
// On "ok" the response carries id_descarcare (the indexId we can use
// to download the signed XML).
// ─────────────────────────────────────────────

export interface AnafStatus {
  state: "processing" | "accepted" | "rejected" | "error" | "unknown";
  indexId: string | null;
  message: string | null;
  rawResponse: string;
}

export async function pollStatus(
  tenantId: string,
  uploadId: string,
): Promise<AnafStatus> {
  const fresh = await ensureFreshToken(tenantId);

  // Stub mode: instantly accept everything
  if (!fresh || !anafEnabled || uploadId.startsWith("STUB-")) {
    const fakeIndex = `IDX-${uploadId.replace(/^STUB-/, "")}`;
    return {
      state: "accepted",
      indexId: fakeIndex,
      message: "Stub mode — auto-accepted",
      rawResponse: `<?xml version="1.0"?><header stare="ok" id_descarcare="${fakeIndex}"/>`,
    };
  }

  const base = getBaseUrl(fresh.environment);
  const res = await fetch(`${base}/stareMesaj?id_incarcare=${encodeURIComponent(uploadId)}`, {
    headers: { Authorization: `Bearer ${fresh.accessToken}` },
  });
  const text = await res.text();
  if (!res.ok) {
    return {
      state: "error",
      indexId: null,
      message: `HTTP ${res.status}: ${text.slice(0, 300)}`,
      rawResponse: text,
    };
  }

  const stareMatch = text.match(/stare\s*=\s*"([^"]+)"/i);
  const idMatch = text.match(/id_descarcare\s*=\s*"([^"]+)"/i);
  const errMatch = text.match(/<Errors\s+errorMessage="([^"]+)"/i);

  const stare = stareMatch?.[1]?.toLowerCase() ?? "";
  let state: AnafStatus["state"] = "unknown";
  if (stare === "ok") state = "accepted";
  else if (stare.includes("prelucr")) state = "processing";
  else if (stare === "nok" || stare.includes("eror") || stare.includes("erori")) state = "rejected";

  return {
    state,
    indexId: idMatch?.[1] ?? null,
    message: errMatch?.[1] ?? stareMatch?.[1] ?? null,
    rawResponse: text,
  };
}

// ─────────────────────────────────────────────
// Download — GET /descarcare?id={indexId}
// Returns a ZIP containing the signed XML + ANAF receipt. We pass
// through as base64 for storage.
// ─────────────────────────────────────────────

export async function downloadSignedZip(
  tenantId: string,
  indexId: string,
): Promise<{ base64: string; contentType: string } | null> {
  const fresh = await ensureFreshToken(tenantId);
  if (!fresh || !anafEnabled || indexId.startsWith("IDX-STUB-") || indexId.startsWith("IDX-")) {
    return null; // Stub mode — nothing real to download
  }
  const base = getBaseUrl(fresh.environment);
  const res = await fetch(`${base}/descarcare?id=${encodeURIComponent(indexId)}`, {
    headers: { Authorization: `Bearer ${fresh.accessToken}` },
  });
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  return { base64: buf.toString("base64"), contentType: res.headers.get("content-type") || "application/zip" };
}
