import { getSessionFromRequest } from "@/lib/session";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return Response.json({
    id: session.userId,
    name: session.name,
    email: session.email,
    role: session.role,
  });
}
