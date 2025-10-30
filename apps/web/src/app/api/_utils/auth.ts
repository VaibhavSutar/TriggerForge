import { cookies } from "next/headers";

export async function buildAuthHeaders(request: Request) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  // Prefer secure cookie
  const token = (await cookies()).get("token")?.value;

  // Dev fallback from incoming header
  const hAuth = request.headers.get("authorization");
  const hClient = request.headers.get("x-client-token");

  if (token) headers.Authorization = `Bearer ${token}`;
  else if (hAuth) headers.Authorization = hAuth;
  else if (hClient) headers.Authorization = `Bearer ${hClient}`;

  return headers;
}
