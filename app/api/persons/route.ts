import { prisma } from "@/lib/prisma";
import { requireAuth, isResponse } from "@/lib/auth-helpers";
import { generatePersonDisplayId } from "@/lib/id-generator";
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
  id: string; displayId: string; name: string; nameUrdu: string | null; gender: string;
  age: number | null; dob: Date | null; dod: Date | null;
  fatherName: string | null; motherName: string | null; caste: string | null; isAlive: boolean;
  submittedBy: string | null; createdAt: Date; updatedAt: Date;
}) {
  return { ...person, age: calculateAge(person.dob, person.isAlive, person.dod) };
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isResponse(auth)) return auth;

  try {
    const where = auth.role === "admin" ? {} : { submittedBy: auth.userId };
    const persons = await prisma.person.findMany({ where, orderBy: { createdAt: "desc" } });

    const userIds = [...new Set(persons.map((p) => p.submittedBy).filter(Boolean))] as string[];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    });
    const userMap = Object.fromEntries(users.map((u) => [u.id, u.name]));

    return Response.json(
      persons.map((p) => ({
        ...toPersonWithDerivedAge(p),
        submittedByName: p.submittedBy ? (userMap[p.submittedBy] ?? null) : null,
      }))
    );
  } catch (error) {
    console.error("GET /api/persons error:", error);
    return Response.json({ error: "Failed to fetch persons" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isResponse(auth)) return auth;

  // Only admins can directly add to Person table; regular users use /api/pending/persons
  if (auth.role !== "admin") {
    return Response.json({ error: "Use /api/pending/persons to submit persons for approval" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, nameUrdu, gender, dob, dod, fatherName, motherName, caste, isAlive } = body;
    const isAliveBoolean = typeof isAlive === "boolean" ? isAlive : true;

    if (!name || !nameUrdu || !gender || !fatherName || !motherName) {
      return Response.json({ error: "name, nameUrdu, gender, fatherName and motherName are required" }, { status: 400 });
    }

    const parsedDob = dob ? new Date(dob) : null;
    if (parsedDob && Number.isNaN(parsedDob.getTime())) return Response.json({ error: "Invalid dob" }, { status: 400 });

    const parsedDod = dod ? new Date(dod) : null;
    if (parsedDod && Number.isNaN(parsedDod.getTime())) return Response.json({ error: "Invalid dod" }, { status: 400 });
    if (parsedDob && parsedDod && parsedDod < parsedDob) return Response.json({ error: "dod cannot be earlier than dob" }, { status: 400 });

    const person = await prisma.person.create({
      data: {
        displayId: await generatePersonDisplayId(),
        name, nameUrdu: nameUrdu || null, gender, age: null,
        dob: parsedDob, dod: isAliveBoolean ? null : parsedDod,
        fatherName, motherName, caste: caste || null, isAlive: isAliveBoolean,
        submittedBy: auth.userId,
      },
    });

    return Response.json(toPersonWithDerivedAge(person), { status: 201 });
  } catch (error) {
    console.error("POST /api/persons error:", error);
    return Response.json({ error: "Failed to create person" }, { status: 500 });
  }
}
