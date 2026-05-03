import { prisma } from "@/lib/prisma";
import { requireAuth, isResponse } from "@/lib/auth-helpers";
import { NextRequest } from "next/server";

export async function DELETE(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if (isResponse(auth)) return auth;

  const { id } = await ctx.params;
  const item = await prisma.pendingFamily.findUnique({ where: { id } });

  if (!item) return Response.json({ error: "Not found" }, { status: 404 });
  if (item.submittedBy !== auth.userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  if (item.status === "approved") {
    return Response.json({ error: "Approved submissions cannot be deleted" }, { status: 400 });
  }

  await prisma.pendingFamily.delete({ where: { id } });
  return Response.json({ success: true });
}
