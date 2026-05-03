import { prisma } from "@/lib/prisma";
import { requireAdmin, isResponse } from "@/lib/auth-helpers";
import { generateFamilyDisplayId } from "@/lib/id-generator";
import { NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (isResponse(auth)) return auth;

  const { id } = await ctx.params;
  const { action, rejectionReason } = await request.json();

  const pending = await prisma.pendingFamily.findUnique({ where: { id } });
  if (!pending) return Response.json({ error: "Not found" }, { status: 404 });
  if (pending.status !== "pending") {
    return Response.json({ error: "Already processed" }, { status: 400 });
  }

  if (action === "approve") {
    try {
      const family = await prisma.family.create({
        data: {
          displayId: await generateFamilyDisplayId(),
          husbandId: pending.husbandId,
          husbandName: pending.husbandName,
          wifeId: pending.wifeId,
          wifeName: pending.wifeName,
          sonIds: pending.sonIds,
          daughterIds: pending.daughterIds,
          remarks: pending.remarks,
          submittedBy: pending.submittedBy,
        },
      });

      await prisma.pendingFamily.update({
        where: { id },
        data: { status: "approved", approvedFamilyId: family.id },
      });

      return Response.json({ success: true, familyId: family.id });
    } catch (error) {
      console.error("Approval error:", error);
      return Response.json(
        { error: "Failed to approve family", details: String(error) },
        { status: 500 }
      );
    }
  }

  if (action === "reject") {
    await prisma.pendingFamily.update({
      where: { id },
      data: { status: "rejected", rejectionReason: rejectionReason || null },
    });
    return Response.json({ success: true });
  }

  return Response.json({ error: "action must be approve or reject" }, { status: 400 });
}
