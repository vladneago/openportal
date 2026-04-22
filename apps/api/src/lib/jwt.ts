import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "openportal-dev-secret-change-in-production"
);

const ACCESS_TOKEN_EXPIRY = "15m";   // 15 minutes
const REFRESH_TOKEN_EXPIRY = "7d";   // 7 days

export interface TokenPayload {
  sub: string;       // User ID
  tid: string;       // Tenant ID
  email: string;
  role: string;
}

export async function generateAccessToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .setIssuer("openportal")
    .sign(JWT_SECRET);
}

export async function generateRefreshToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ sub: payload.sub, tid: payload.tid })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .setIssuer("openportal")
    .sign(JWT_SECRET);
}

export async function generateTokenPair(payload: TokenPayload) {
  const [accessToken, refreshToken] = await Promise.all([
    generateAccessToken(payload),
    generateRefreshToken(payload),
  ]);

  return {
    accessToken,
    refreshToken,
    expiresIn: 900, // 15 minutes in seconds
  };
}
