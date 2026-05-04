import { prisma } from "@/lib/prisma";
import { requireAuth, isResponse } from "@/lib/auth-helpers";
import { generateFamilyDisplayId } from "@/lib/id-generator";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isResponse(auth)) return auth;

  try {
    const where = auth.role === "admin" ? {} : { submittedBy: auth.userId };
    const families = await prisma.family.findMany({ where, orderBy: { husbandName: "asc" } });

    const enrichedFamilies = await Promise.all(
      families.map(async (family) => {
        const husband = await prisma.person.findUnique({ where: { id: family.husbandId } });
        const wife = await prisma.person.findUnique({ where: { id: family.wifeId } });
        const sons = await prisma.person.findMany({ where: { id: { in: family.sonIds } } });
        const daughters = await prisma.person.findMany({ where: { id: { in: family.daughterIds } } });
        return { ...family, husband, wife, sons, daughters };
      })
    );

    return Response.json(enrichedFamilies);
  } catch (error) {
    console.error("GET /api/families error:", error);
    return Response.json({ error: "Failed to fetch families" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isResponse(auth)) return auth;

  if (auth.role !== "admin") {
    return Response.json({ error: "Use /api/pending/families to submit families for approval" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { husbandId, wifeId, sonIds, daughterIds, remarks } = body;

    if (!husbandId || !wifeId) {
      return Response.json({ error: "husbandId and wifeId are required" }, { status: 400 });
    }

    const husband = await prisma.person.findUnique({ where: { id: husbandId } });
    const wife = await prisma.person.findUnique({ where: { id: wifeId } });

    if (!husband || !wife) {
      return Response.json({ error: "Invalid person IDs" }, { status: 400 });
    }

    const family = await prisma.family.create({
      data: {
        displayId: await generateFamilyDisplayId(),
        husbandId, husbandName: husband.name,
        wifeId, wifeName: wife.name,
        sonIds: Array.isArray(sonIds) ? sonIds : [],
        daughterIds: Array.isArray(daughterIds) ? daughterIds : [],
        remarks: remarks || null,
        submittedBy: auth.userId,
      },
    });


    return Response.json(family, { status: 201 });
  } catch (error) {
    console.error("POST /api/families error:", error);
    return Response.json({ error: "Failed to create family" }, { status: 500 });
  }
}
