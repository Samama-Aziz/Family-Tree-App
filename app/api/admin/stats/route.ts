import { prisma } from "@/lib/prisma";
import { requireAdmin, isResponse } from "@/lib/auth-helpers";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (isResponse(auth)) return auth;

  const [pendingPersons, pendingFamilies, totalPersons, totalFamilies, totalUsers] =
    await Promise.all([
      prisma.pendingPerson.count({ where: { status: "pending" } }),
      prisma.pendingFamily.count({ where: { status: "pending" } }),
      prisma.person.count(),
      prisma.family.count(),
      prisma.user.count(),
    ]);

  return Response.json({
    pendingPersons,
    pendingFamilies,
    totalPersons,
    totalFamilies,
    totalUsers,
  });
}
