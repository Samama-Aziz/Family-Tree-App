import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/persons/[id]">
) {
  const { id } = await ctx.params;
  const person = await prisma.person.findUnique({ where: { id } });
  if (!person) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(person);
}

export async function PUT(
  request: NextRequest,
  ctx: RouteContext<"/api/persons/[id]">
) {
  const { id } = await ctx.params;
  const body = await request.json();
  const { name, nameUrdu, gender, age, dob, dod, fatherName, motherName, isAlive } = body;

  const person = await prisma.person.update({
    where: { id },
    data: {
      name,
      nameUrdu: nameUrdu || null,
      gender,
      age: age !== undefined ? Number(age) : undefined,
      dob: dob ? new Date(dob) : null,
      dod: dod ? new Date(dod) : null,
      fatherName: fatherName || null,
      motherName: motherName || null,
      isAlive,
    },
  });

  return Response.json(person);
}

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/persons/[id]">
) {
  const { id } = await ctx.params;
  await prisma.person.delete({ where: { id } });
  return Response.json({ success: true });
}
