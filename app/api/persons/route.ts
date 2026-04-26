import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

function calculateAge(dob: Date | null, isAlive: boolean, dod: Date | null) {
  if (!dob) return null;

  const endDate = !isAlive && dod ? dod : new Date();
  let age = endDate.getFullYear() - dob.getFullYear();
  const monthDiff = endDate.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && endDate.getDate() < dob.getDate())) {
    age -= 1;
  }

  return age < 0 ? 0 : age;
}

function toPersonWithDerivedAge(person: {
  id: string;
  name: string;
  nameUrdu: string | null;
  gender: string;
  age: number | null;
  dob: Date | null;
  dod: Date | null;
  fatherName: string | null;
  motherName: string | null;
  isAlive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...person,
    age: calculateAge(person.dob, person.isAlive, person.dod),
  };
}

export async function GET() {
  try {
    const persons = await prisma.person.findMany({
      orderBy: { createdAt: "desc" },
    });
    return Response.json(persons.map(toPersonWithDerivedAge));
  } catch (error) {
    console.error("GET /api/persons error:", error);
    return Response.json(
      { error: "Failed to fetch persons", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, nameUrdu, gender, dob, dod, fatherName, motherName, isAlive } = body;

    const isAliveBoolean = typeof isAlive === "boolean" ? isAlive : true;

    if (!name || !nameUrdu || !gender || !dob || !fatherName || !motherName) {
      return Response.json(
        { error: "name, nameUrdu, gender, dob, fatherName and motherName are required" },
        { status: 400 }
      );
    }

    if (!isAliveBoolean && !dod) {
      return Response.json({ error: "dod is required when isAlive is false" }, { status: 400 });
    }

    const parsedDob = new Date(dob);
    if (Number.isNaN(parsedDob.getTime())) {
      return Response.json({ error: "Invalid dob" }, { status: 400 });
    }

    const parsedDod = dod ? new Date(dod) : null;
    if (parsedDod && Number.isNaN(parsedDod.getTime())) {
      return Response.json({ error: "Invalid dod" }, { status: 400 });
    }

    if (parsedDod && parsedDod < parsedDob) {
      return Response.json({ error: "dod cannot be earlier than dob" }, { status: 400 });
    }

    const person = await prisma.person.create({
      data: {
        name,
        nameUrdu,
        gender,
        age: null,
        dob: parsedDob,
        dod: isAliveBoolean ? null : parsedDod,
        fatherName,
        motherName,
        isAlive: isAliveBoolean,
      },
    });

    return Response.json(toPersonWithDerivedAge(person), { status: 201 });
  } catch (error) {
    console.error("POST /api/persons error:", error);
    return Response.json(
      { error: "Failed to create person", details: String(error) },
      { status: 500 }
    );
  }
}
