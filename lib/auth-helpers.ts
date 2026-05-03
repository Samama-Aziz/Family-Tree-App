import { NextRequest } from "next/server";
import { getSessionFromRequest, SessionPayload } from "./session";

export async function requireAuth(
  request: NextRequest
): Promise<SessionPayload | Response> {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return session;
}

export async function requireAdmin(
  request: NextRequest
): Promise<SessionPayload | Response> {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  return session;
}

export function isResponse(value: unknown): value is Response {
  return value instanceof Response;
}
