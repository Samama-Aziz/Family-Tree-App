import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/families/[id]">
) {
  const { id } = await ctx.params;
  const family = await prisma.family.findUnique({ where: { id } });
  if (!family) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(family);
}

export async function PUT(
  request: NextRequest,
  ctx: RouteContext<"/api/families/[id]">
) {
  const { id } = await ctx.params;
  const body = await request.json();
  const { husbandId, wifeId, sonIds, daughterIds, remarks } = body;

  const family = await prisma.family.update({
    where: { id },
    data: {
      husbandId,
      wifeId,
      sonIds: Array.isArray(sonIds) ? sonIds : [],
      daughterIds: Array.isArray(daughterIds) ? daughterIds : [],
      remarks: remarks || null,
    },
  });

  return Response.json(family);
}

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/families/[id]">
) {
  const { id } = await ctx.params;
  await prisma.family.delete({ where: { id } });
  return Response.json({ success: true });
}
