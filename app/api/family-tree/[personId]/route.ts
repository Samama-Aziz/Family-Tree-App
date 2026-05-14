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

// Batch load all descendants and build tree in memory
async function buildDownwardOptimized(
  startPersonId: string,
  visited: Set<string>,
  userId: string | undefined,
  isAdmin: boolean
): Promise<TreeNode | null> {
  const personWhere = (isAdmin || !userId) ? { id: startPersonId } : { id: startPersonId, submittedBy: userId };
  const rootPerson = await prisma.person.findFirst({ where: personWhere });
  if (!rootPerson) return null;

  // Batch load all families at once
  const familyWhere = (isAdmin || !userId)
    ? { OR: [{ husbandId: startPersonId }, { wifeId: startPersonId }] }
    : { OR: [{ husbandId: startPersonId }, { wifeId: startPersonId }], submittedBy: userId };

  const families = await prisma.family.findMany({
    where: familyWhere,
    orderBy: { createdAt: "asc" },
  });

  let partner: PersonSnap | undefined;
  const allChildIds = new Set<string>();

  for (const family of families) {
    // Properly add children IDs to set
    family.sonIds.forEach(id => allChildIds.add(id));
    family.daughterIds.forEach(id => allChildIds.add(id));
    
    if (!partner) {
      const partnerId = family.husbandId === startPersonId ? family.wifeId : family.husbandId;
      const partnerPerson = await prisma.person.findFirst({ where: { id: partnerId } });
      if (partnerPerson) partner = toSnap(partnerPerson);
    }
  }

  // Recursively load children with depth limit (max 10 levels)
  const loadChildrenBatch = async (
    childIds: string[],
    depth: number
  ): Promise<TreeNode[]> => {
    if (depth > 10 || childIds.length === 0) return [];

    // Batch fetch all children (no submittedBy filter - if they're in the family, include them)
    const childrenPersons = await prisma.person.findMany({
      where: { id: { in: childIds } },
    });

    const childMap = new Map(childrenPersons.map((p) => [p.id, p]));
    const children: TreeNode[] = [];

    for (const childId of childIds) {
      const childPerson = childMap.get(childId);
      if (!childPerson) continue;

      // Batch fetch families for this child
      const childFamilies = await prisma.family.findMany({
        where: { OR: [{ husbandId: childId }, { wifeId: childId }] },
      });

      let childPartner: PersonSnap | undefined;
      const nextChildIds: string[] = [];

      for (const fam of childFamilies) {
        fam.sonIds.forEach(id => nextChildIds.push(id));
        fam.daughterIds.forEach(id => nextChildIds.push(id));
        
        if (!childPartner) {
          const childPartnerId = fam.husbandId === childId ? fam.wifeId : fam.husbandId;
          const childPartnerPerson = await prisma.person.findFirst({ where: { id: childPartnerId } });
          if (childPartnerPerson) childPartner = toSnap(childPartnerPerson);
        }
      }

      const grandchildren = await loadChildrenBatch([...new Set(nextChildIds)], depth + 1);
      children.push({ ...toSnap(childPerson), partner: childPartner, children: grandchildren });
    }

    return children;
  };

  const children = await loadChildrenBatch([...allChildIds], 1);
  return { ...toSnap(rootPerson), partner, children };
}

async function buildDownward(
  personId: string,
  visited: Set<string>,
  depth: number,
  userId: string | undefined,
  isAdmin: boolean
): Promise<TreeNode | null> {
  return buildDownwardOptimized(personId, visited, userId, isAdmin);
}

async function buildUpwardOptimized(
  startPersonId: string,
  userId: string | undefined,
  isAdmin: boolean
): Promise<TreeNode | null> {
  const personWhere = (isAdmin || !userId) ? { id: startPersonId } : { id: startPersonId, submittedBy: userId };
  const rootPerson = await prisma.person.findFirst({ where: personWhere });
  if (!rootPerson) return null;

  // Recursively load ancestors with depth limit (max 10 levels)
  const loadAncestorsBatch = async (
    personId: string,
    depth: number
  ): Promise<TreeNode> => {
    if (depth > 10) return { ...toSnap(rootPerson) };

    const person = await prisma.person.findFirst({ where: { id: personId } });
    if (!person) return { ...toSnap(rootPerson) };

    const familyWhere = (isAdmin || !userId)
      ? { OR: [{ sonIds: { has: personId } }, { daughterIds: { has: personId } }] }
      : {
          AND: [
            { OR: [{ sonIds: { has: personId } }, { daughterIds: { has: personId } }] },
            { submittedBy: userId },
          ],
        };

    const parentFamily = await prisma.family.findFirst({
      where: familyWhere,
    });

    const children: TreeNode[] = [];

    if (parentFamily) {
      // Fetch husband (no submittedBy filter - if in family, include them)
      const husband = await prisma.person.findFirst({ where: { id: parentFamily.husbandId } });
      if (husband) {
        const fatherNode = await loadAncestorsBatch(parentFamily.husbandId, depth + 1);
        fatherNode.relation = "Father";
        children.push(fatherNode);
      }

      // Fetch wife (no submittedBy filter - if in family, include them)
      const wife = await prisma.person.findFirst({ where: { id: parentFamily.wifeId } });
      if (wife) {
        const motherNode = await loadAncestorsBatch(parentFamily.wifeId, depth + 1);
        motherNode.relation = "Mother";
        children.push(motherNode);
      }
    }

    return { ...toSnap(person), children };
  };

  return loadAncestorsBatch(startPersonId, 0);
}

async function buildUpward(
  personId: string,
  visited: Set<string>,
  depth: number,
  userId: string | undefined,
  isAdmin: boolean
): Promise<TreeNode | null> {
  return buildUpwardOptimized(personId, userId, isAdmin);
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

  const response = Response.json({ tree, direction });
  
  // Cache for 1 hour (3600 seconds) - revalidate if user is not admin
  response.headers.set("Cache-Control", `public, max-age=${isAdmin ? 300 : 3600}`);
  
  return response;
}
