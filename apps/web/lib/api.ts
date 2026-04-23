const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function api<T = any>(path: string, options?: RequestInit): Promise<{ success: boolean; data?: T; error?: { code: string; message: string } }> {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  return res.json();
}

export function setAuth(tokens: { accessToken: string; refreshToken: string }, user: any, tenant: any) {
  localStorage.setItem("accessToken", tokens.accessToken);
  localStorage.setItem("refreshToken", tokens.refreshToken);
  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("tenant", JSON.stringify(tenant));
}

export function clearAuth() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  localStorage.removeItem("tenant");
}

export function getUser() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}

export function getTenant() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("tenant");
  return raw ? JSON.parse(raw) : null;
}
