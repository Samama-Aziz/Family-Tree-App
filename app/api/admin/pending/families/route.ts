import { prisma } from "@/lib/prisma";
import { requireAdmin, isResponse } from "@/lib/auth-helpers";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (isResponse(auth)) return auth;

  const items = await prisma.pendingFamily.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "asc" },
  });

  const userIds = [...new Set(items.map((i) => i.submittedBy))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true },
  });
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  return Response.json(
    items.map((item) => ({ ...item, submitter: userMap[item.submittedBy] ?? null }))
  );
}
