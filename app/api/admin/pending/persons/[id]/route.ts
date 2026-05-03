import { prisma } from "@/lib/prisma";
import { requireAdmin, isResponse } from "@/lib/auth-helpers";
import { generatePersonDisplayId } from "@/lib/id-generator";
import { NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (isResponse(auth)) return auth;

  const { id } = await ctx.params;
  const { action, rejectionReason } = await request.json();

  const pending = await prisma.pendingPerson.findUnique({ where: { id } });
  if (!pending) return Response.json({ error: "Not found" }, { status: 404 });
  if (pending.status !== "pending") {
    return Response.json({ error: "Already processed" }, { status: 400 });
  }

  if (action === "approve") {
    const person = await prisma.person.create({
      data: {
        displayId: await generatePersonDisplayId(),
        name: pending.name,
        nameUrdu: pending.nameUrdu,
        gender: pending.gender,
        age: null,
        dob: pending.dob,
        dod: pending.dod,
        fatherName: pending.fatherName,
        motherName: pending.motherName,
        caste: pending.caste,
        isAlive: pending.isAlive,
        submittedBy: pending.submittedBy,
      },
    });

    await prisma.pendingPerson.update({
      where: { id },
      data: { status: "approved", approvedPersonId: person.id },
    });

    return Response.json({ success: true, personId: person.id });
  }

  if (action === "reject") {
    await prisma.pendingPerson.update({
      where: { id },
      data: { status: "rejected", rejectionReason: rejectionReason || null },
    });
    return Response.json({ success: true });
  }

  return Response.json({ error: "action must be approve or reject" }, { status: 400 });
}
