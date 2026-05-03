import { prisma } from "@/lib/prisma";
import { requireAuth, isResponse } from "@/lib/auth-helpers";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/families/[id]">
) {
  const auth = await requireAuth(request);
  if (isResponse(auth)) return auth;

  const { id } = await ctx.params;
  const family = await prisma.family.findUnique({ where: { id } });
  if (!family) return Response.json({ error: "Not found" }, { status: 404 });

  if (auth.role !== "admin" && family.submittedBy !== auth.userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  return Response.json(family);
}

export async function PUT(
  request: NextRequest,
  ctx: RouteContext<"/api/families/[id]">
) {
  const auth = await requireAuth(request);
  if (isResponse(auth)) return auth;

  if (auth.role !== "admin") {
    return Response.json({ error: "Only admins can edit approved families" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const body = await request.json();
  const { husbandId, wifeId, sonIds, daughterIds, remarks } = body;

  const family = await prisma.family.update({
    where: { id },
    data: {
      husbandId, wifeId,
      sonIds: Array.isArray(sonIds) ? sonIds : [],
      daughterIds: Array.isArray(daughterIds) ? daughterIds : [],
      remarks: remarks || null,
    },
  });

  return Response.json(family);
}

export async function DELETE(
  request: NextRequest,
  ctx: RouteContext<"/api/families/[id]">
) {
  const auth = await requireAuth(request);
  if (isResponse(auth)) return auth;

  if (auth.role !== "admin") {
    return Response.json({ error: "Only admins can delete approved families" }, { status: 403 });
  }

  const { id } = await ctx.params;
  await prisma.family.delete({ where: { id } });
  return Response.json({ success: true });
}
