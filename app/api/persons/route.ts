import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET() {
  try {
    const persons = await prisma.person.findMany({
      orderBy: { createdAt: "desc" },
    });
    return Response.json(persons);
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
    const { name, nameUrdu, gender, age, dob, dod, fatherName, motherName, isAlive } = body;

    if (!name || !gender) {
      return Response.json({ error: "name and gender are required" }, { status: 400 });
    }

    const person = await prisma.person.create({
      data: {
        name,
        nameUrdu: nameUrdu || null,
        gender,
        age: age ? Number(age) : null,
        dob: dob ? new Date(dob) : null,
        dod: dod ? new Date(dod) : null,
        fatherName: fatherName || null,
        motherName: motherName || null,
        isAlive: isAlive ?? true,
      },
    });

    return Response.json(person, { status: 201 });
  } catch (error) {
    console.error("POST /api/persons error:", error);
    return Response.json(
      { error: "Failed to create person", details: String(error) },
      { status: 500 }
    );
  }
}
