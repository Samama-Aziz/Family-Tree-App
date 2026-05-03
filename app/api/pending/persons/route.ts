import { prisma } from "@/lib/prisma";
import { requireAuth, isResponse } from "@/lib/auth-helpers";
import { generatePersonDisplayId } from "@/lib/id-generator";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isResponse(auth)) return auth;

  const items = await prisma.pendingPerson.findMany({
    where: { submittedBy: auth.userId },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(items);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isResponse(auth)) return auth;

  const body = await request.json();
  const { name, nameUrdu, gender, dob, dod, fatherName, motherName, caste, isAlive } = body;

  const isAliveBoolean = typeof isAlive === "boolean" ? isAlive : true;

  if (!name || !nameUrdu || !gender || !fatherName || !motherName) {
    return Response.json(
      { error: "name, nameUrdu, gender, fatherName and motherName are required" },
      { status: 400 }
    );
  }

  const parsedDob = dob ? new Date(dob) : null;
  if (parsedDob && Number.isNaN(parsedDob.getTime())) {
    return Response.json({ error: "Invalid dob" }, { status: 400 });
  }

  const parsedDod = dod ? new Date(dod) : null;
  if (parsedDod && Number.isNaN(parsedDod.getTime())) {
    return Response.json({ error: "Invalid dod" }, { status: 400 });
  }

  if (parsedDob && parsedDod && parsedDod < parsedDob) {
    return Response.json({ error: "dod cannot be earlier than dob" }, { status: 400 });
  }

  const item = await prisma.pendingPerson.create({
    data: {
      displayId: await generatePersonDisplayId(),
      name,
      nameUrdu: nameUrdu || null,
      gender,
      dob: parsedDob,
      dod: isAliveBoolean ? null : parsedDod,
      fatherName: fatherName || null,
      motherName: motherName || null,
      caste: caste || null,
      isAlive: isAliveBoolean,
      submittedBy: auth.userId,
      status: "pending",
    },
  });

  return Response.json(item, { status: 201 });
}
