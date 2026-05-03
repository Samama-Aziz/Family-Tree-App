import { prisma } from "@/lib/prisma";
import { requireAuth, isResponse } from "@/lib/auth-helpers";
import { generateFamilyDisplayId } from "@/lib/id-generator";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isResponse(auth)) return auth;

  const items = await prisma.pendingFamily.findMany({
    where: { submittedBy: auth.userId },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(items);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isResponse(auth)) return auth;

  const body = await request.json();
  const { husbandId, wifeId, sonIds, daughterIds, remarks } = body;

  if (!husbandId || !wifeId) {
    return Response.json({ error: "husbandId and wifeId are required" }, { status: 400 });
  }

  // Persons must be approved (exist in Person table) and belong to this user
  const husband = await prisma.person.findFirst({
    where: { id: husbandId, submittedBy: auth.userId },
  });
  const wife = await prisma.person.findFirst({
    where: { id: wifeId, submittedBy: auth.userId },
  });

  if (!husband || !wife) {
    return Response.json(
      { error: "Persons must be approved and belong to your account" },
      { status: 400 }
    );
  }

  const item = await prisma.pendingFamily.create({
    data: {
      displayId: await generateFamilyDisplayId(),
      husbandId,
      husbandName: husband.name,
      wifeId,
      wifeName: wife.name,
      sonIds: Array.isArray(sonIds) ? sonIds : [],
      daughterIds: Array.isArray(daughterIds) ? daughterIds : [],
      remarks: remarks || null,
      submittedBy: auth.userId,
      status: "pending",
    },
  });

  return Response.json(item, { status: 201 });
}
