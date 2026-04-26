import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET() {
  try {
    const families = await prisma.family.findMany({
      orderBy: { createdAt: "desc" },
    });
    
    // Enrich families with person details
    const enrichedFamilies = await Promise.all(
      families.map(async (family) => {
        const husband = await prisma.person.findUnique({ where: { id: family.husbandId } });
        const wife = await prisma.person.findUnique({ where: { id: family.wifeId } });
        const sons = await prisma.person.findMany({ where: { id: { in: family.sonIds } } });
        const daughters = await prisma.person.findMany({ where: { id: { in: family.daughterIds } } });
        
        return {
          ...family,
          husband,
          wife,
          sons,
          daughters,
        };
      })
    );
    
    return Response.json(enrichedFamilies);
  } catch (error) {
    console.error("GET /api/families error:", error);
    return Response.json(
      { error: "Failed to fetch families", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { husbandId, wifeId, sonIds, daughterIds, remarks } = body;

    if (!husbandId || !wifeId) {
      return Response.json(
        { error: "husbandId and wifeId are required" },
        { status: 400 }
      );
    }

    // Get husband and wife names for display
    const husband = await prisma.person.findUnique({ where: { id: husbandId } });
    const wife = await prisma.person.findUnique({ where: { id: wifeId } });

    if (!husband || !wife) {
      return Response.json(
        { error: "Invalid person IDs" },
        { status: 400 }
      );
    }

    const family = await prisma.family.create({
      data: {
        husbandId,
        husbandName: husband.name,
        wifeId,
        wifeName: wife.name,
        sonIds: Array.isArray(sonIds) ? sonIds : [],
        daughterIds: Array.isArray(daughterIds) ? daughterIds : [],
        remarks: remarks || null,
      },
    });

    return Response.json(family, { status: 201 });
  } catch (error) {
    console.error("POST /api/families error:", error);
    return Response.json(
      { error: "Failed to create family", details: String(error) },
      { status: 500 }
    );
  }
}
