import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export type PersonSnap = {
  id: string;
  name: string;
  nameUrdu: string | null;
  gender: string;
  isAlive: boolean;
  age: number | null;
};

export type TreeNode = PersonSnap & {
  relation?: string;
  partner?: PersonSnap;
  children?: TreeNode[];
};

function toSnap(p: {
  id: string; name: string; nameUrdu: string | null; gender: string;
  isAlive: boolean; dob: Date | null; dod: Date | null;
}): PersonSnap {
  let age: number | null = null;
  if (p.dob) {
    const endDate = !p.isAlive && p.dod ? p.dod : new Date();
    let years = endDate.getFullYear() - p.dob.getFullYear();
    const monthDiff = endDate.getMonth() - p.dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && endDate.getDate() < p.dob.getDate())) years -= 1;
    age = years < 0 ? 0 : years;
  }
  return { id: p.id, name: p.name, nameUrdu: p.nameUrdu, gender: p.gender, isAlive: p.isAlive, age };
}

async function buildDownward(
  personId: string,
  visited: Set<string>,
  depth: number,
  userId: string | undefined,
  isAdmin: boolean
): Promise<TreeNode | null> {
  if (depth > 8 || visited.has(personId)) return null;
  visited.add(personId);

  const personWhere = (isAdmin || !userId) ? { id: personId } : { id: personId, submittedBy: userId };
  const person = await prisma.person.findFirst({ where: personWhere });
  if (!person) return null;

  const familyWhere = (isAdmin || !userId)
    ? { OR: [{ husbandId: personId }, { wifeId: personId }] }
    : { OR: [{ husbandId: personId }, { wifeId: personId }], submittedBy: userId };

  const families = await prisma.family.findMany({
    where: familyWhere,
    orderBy: { createdAt: "asc" },
  });

  let partner: PersonSnap | undefined;
  const childIds: string[] = [];

  for (const family of families) {
    childIds.push(...family.sonIds, ...family.daughterIds);
    if (!partner) {
      const partnerId = family.husbandId === personId ? family.wifeId : family.husbandId;
      if (!visited.has(partnerId)) {
        visited.add(partnerId);
        const partnerWhere = (isAdmin || !userId) ? { id: partnerId } : { id: partnerId, submittedBy: userId };
        const rec = await prisma.person.findFirst({ where: partnerWhere });
        if (rec) partner = toSnap(rec);
      }
    }
  }

  const uniqueChildIds = [...new Set(childIds)];
  const children: TreeNode[] = [];
  for (const childId of uniqueChildIds) {
    const node = await buildDownward(childId, new Set(visited), depth + 1, userId, isAdmin);
    if (node) children.push(node);
  }

  return { ...toSnap(person), partner, children };
}

async function buildUpward(
  personId: string,
  visited: Set<string>,
  depth: number,
  userId: string | undefined,
  isAdmin: boolean
): Promise<TreeNode | null> {
  if (depth > 8 || visited.has(personId)) return null;
  visited.add(personId);

  const personWhere = (isAdmin || !userId) ? { id: personId } : { id: personId, submittedBy: userId };
  const person = await prisma.person.findFirst({ where: personWhere });
  if (!person) return null;

  const familyWhere = (isAdmin || !userId)
    ? { OR: [{ sonIds: { has: personId } }, { daughterIds: { has: personId } }] }
    : {
        AND: [
          { OR: [{ sonIds: { has: personId } }, { daughterIds: { has: personId } }] },
          { submittedBy: userId },
        ],
      };

  const parentFamily = await prisma.family.findFirst({ where: familyWhere });
  const children: TreeNode[] = [];

  if (parentFamily) {
    const { husbandId: fatherId, wifeId: motherId } = parentFamily;

    if (!visited.has(fatherId)) {
      const fatherNode = await buildUpward(fatherId, visited, depth + 1, userId, isAdmin);
      if (fatherNode) { fatherNode.relation = "Father"; children.push(fatherNode); }
    }

    if (!visited.has(motherId)) {
      const motherNode = await buildUpward(motherId, new Set(visited), depth + 1, userId, isAdmin);
      if (motherNode) { motherNode.relation = "Mother"; children.push(motherNode); }
    }
  }

  return { ...toSnap(person), children };
}

export async function GET(
  request: NextRequest,
  ctx: any
) {
  const session = await getSessionFromRequest(request);
  const { personId } = await ctx.params;
  const direction = request.nextUrl.searchParams.get("direction") ?? "downward";
  const isAdmin = session?.role === "admin";
  const userId = session?.userId;

  const personWhere = (isAdmin || !userId) ? { id: personId } : { id: personId, submittedBy: userId };
  const person = await prisma.person.findFirst({ where: personWhere });
  if (!person) return Response.json({ error: "Person not found" }, { status: 404 });

  const tree =
    direction === "upward"
      ? await buildUpward(personId, new Set(), 0, userId, isAdmin)
      : await buildDownward(personId, new Set(), 0, userId, isAdmin);

  return Response.json({ tree, direction });
}
