import { prisma } from "@/lib/prisma";
import { requireAuth, isResponse } from "@/lib/auth-helpers";
import { NextRequest } from "next/server";

function calculateAge(dob: Date | null, isAlive: boolean, dod: Date | null) {
  if (!dob) return null;
  const endDate = !isAlive && dod ? dod : new Date();
  let age = endDate.getFullYear() - dob.getFullYear();
  const monthDiff = endDate.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && endDate.getDate() < dob.getDate())) age -= 1;
  return age < 0 ? 0 : age;
}

function toPersonWithDerivedAge(person: {
  id: string; name: string; nameUrdu: string | null; gender: string;
  age: number | null; dob: Date | null; dod: Date | null;
  fatherName: string | null; motherName: string | null; caste: string | null; isAlive: boolean;
  submittedBy: string | null; createdAt: Date; updatedAt: Date;
}) {
  return { ...person, age: calculateAge(person.dob, person.isAlive, person.dod) };
}

export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/persons/[id]">
) {
  const auth = await requireAuth(request);
  if (isResponse(auth)) return auth;

  const { id } = await ctx.params;
  const person = await prisma.person.findUnique({ where: { id } });
  if (!person) return Response.json({ error: "Not found" }, { status: 404 });

  if (auth.role !== "admin" && person.submittedBy !== auth.userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  return Response.json(toPersonWithDerivedAge(person));
}

export async function PUT(
  request: NextRequest,
  ctx: RouteContext<"/api/persons/[id]">
) {
  const auth = await requireAuth(request);
  if (isResponse(auth)) return auth;

  if (auth.role !== "admin") {
    return Response.json({ error: "Only admins can edit approved persons" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const body = await request.json();
  const { name, nameUrdu, gender, dob, dod, fatherName, motherName, caste, isAlive } = body;

  if (!name || !nameUrdu || !gender || !fatherName || !motherName) {
    return Response.json({ error: "name, nameUrdu, gender, fatherName and motherName are required" }, { status: 400 });
  }

  if (typeof isAlive !== "boolean") return Response.json({ error: "isAlive must be boolean" }, { status: 400 });

  const parsedDob = dob ? new Date(dob) : null;
  if (parsedDob && Number.isNaN(parsedDob.getTime())) return Response.json({ error: "Invalid dob" }, { status: 400 });

  const parsedDod = dod ? new Date(dod) : null;
  if (parsedDod && Number.isNaN(parsedDod.getTime())) return Response.json({ error: "Invalid dod" }, { status: 400 });
  if (parsedDob && parsedDod && parsedDod < parsedDob) return Response.json({ error: "dod cannot be earlier than dob" }, { status: 400 });

  const person = await prisma.person.update({
    where: { id },
    data: {
      name, nameUrdu, gender, age: null,
      dob: parsedDob, dod: isAlive ? null : parsedDod,
      fatherName, motherName, caste: caste || null, isAlive,
    },
  });

  return Response.json(toPersonWithDerivedAge(person));
}

export async function DELETE(
  request: NextRequest,
  ctx: RouteContext<"/api/persons/[id]">
) {
  const auth = await requireAuth(request);
  if (isResponse(auth)) return auth;

  if (auth.role !== "admin") {
    return Response.json({ error: "Only admins can delete approved persons" }, { status: 403 });
  }

  const { id } = await ctx.params;
  await prisma.person.delete({ where: { id } });
  return Response.json({ success: true });
}
