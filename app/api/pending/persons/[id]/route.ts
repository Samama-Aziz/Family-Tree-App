import { prisma } from "@/lib/prisma";
import { requireAuth, isResponse } from "@/lib/auth-helpers";
import { NextRequest } from "next/server";

export async function PUT(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if (isResponse(auth)) return auth;

  const { id } = await ctx.params;
  const item = await prisma.pendingPerson.findUnique({ where: { id } });

  if (!item) return Response.json({ error: "Not found" }, { status: 404 });
  if (item.submittedBy !== auth.userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  if (item.status !== "pending") {
    return Response.json({ error: "Only pending submissions can be edited" }, { status: 400 });
  }

  const body = await request.json();
  const { name, nameUrdu, gender, dob, dod, fatherName, motherName, caste, isAlive } = body;

  if (!name || !nameUrdu || !gender || !fatherName || !motherName) {
    return Response.json(
      { error: "name, nameUrdu, gender, fatherName and motherName are required" },
      { status: 400 }
    );
  }

  const isAliveBoolean = typeof isAlive === "boolean" ? isAlive : true;

  const parsedDob = dob ? new Date(dob) : null;
  if (parsedDob && Number.isNaN(parsedDob.getTime())) {
    return Response.json({ error: "Invalid dob" }, { status: 400 });
  }

  const parsedDod = dod ? new Date(dod) : null;
  if (parsedDob && parsedDod && parsedDod < parsedDob) {
    return Response.json({ error: "dod cannot be earlier than dob" }, { status: 400 });
  }

  const updated = await prisma.pendingPerson.update({
    where: { id },
    data: {
      name,
      nameUrdu: nameUrdu || null,
      gender,
      dob: parsedDob,
      dod: isAliveBoolean ? null : parsedDod,
      fatherName: fatherName || null,
      motherName: motherName || null,
      caste: caste || null,
      isAlive: isAliveBoolean,
    },
  });

  return Response.json(updated);
}

export async function DELETE(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if (isResponse(auth)) return auth;

  const { id } = await ctx.params;
  const item = await prisma.pendingPerson.findUnique({ where: { id } });

  if (!item) return Response.json({ error: "Not found" }, { status: 404 });
  if (item.submittedBy !== auth.userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  if (item.status === "approved") {
    return Response.json({ error: "Approved submissions cannot be deleted" }, { status: 400 });
  }

  await prisma.pendingPerson.delete({ where: { id } });
  return Response.json({ success: true });
}
