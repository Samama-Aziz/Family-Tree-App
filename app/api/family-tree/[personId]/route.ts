import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

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
  id: string;
  name: string;
  nameUrdu: string | null;
  gender: string;
  isAlive: boolean;
  age: number | null;
}): PersonSnap {
  return {
    id: p.id,
    name: p.name,
    nameUrdu: p.nameUrdu,
    gender: p.gender,
    isAlive: p.isAlive,
    age: p.age,
  };
}

// ── Downward (descendants) ───────────────────────────────────────────────────
// Finds all Family records where person is husband or wife, collects sonIds +
// daughterIds as children, and recurses. Partner comes from the same Family row.

async function buildDownward(
  personId: string,
  visited: Set<string>,
  depth: number
): Promise<TreeNode | null> {
  if (depth > 8 || visited.has(personId)) return null;
  visited.add(personId);

  const person = await prisma.person.findUnique({ where: { id: personId } });
  if (!person) return null;

  const families = await prisma.family.findMany({
    where: { OR: [{ husbandId: personId }, { wifeId: personId }] },
    orderBy: { createdAt: "asc" },
  });

  let partner: PersonSnap | undefined;
  const childIds: string[] = [];

  for (const family of families) {
    // Collect children from every family this person belongs to
    childIds.push(...family.sonIds, ...family.daughterIds);

    // Use first family found to set the partner
    if (!partner) {
      const partnerId =
        family.husbandId === personId ? family.wifeId : family.husbandId;
      if (!visited.has(partnerId)) {
        visited.add(partnerId);
        const rec = await prisma.person.findUnique({ where: { id: partnerId } });
        if (rec) partner = toSnap(rec);
      }
    }
  }

  const uniqueChildIds = [...new Set(childIds)];
  const children: TreeNode[] = [];

  for (const childId of uniqueChildIds) {
    const node = await buildDownward(childId, new Set(visited), depth + 1);
    if (node) children.push(node);
  }

  return { ...toSnap(person), partner, children };
}

// ── Upward (ancestors) ───────────────────────────────────────────────────────
// Finds the Family record where this person is a son or daughter. The husband
// is the father (primary ancestor shown on the left); the wife is attached as
// partner on the same row. Recurses upward through the father's lineage.

async function buildUpward(
  personId: string,
  visited: Set<string>,
  depth: number
): Promise<TreeNode | null> {
  if (depth > 8 || visited.has(personId)) return null;
  visited.add(personId);

  const person = await prisma.person.findUnique({ where: { id: personId } });
  if (!person) return null;

  const parentFamily = await prisma.family.findFirst({
    where: {
      OR: [
        { sonIds: { has: personId } },
        { daughterIds: { has: personId } },
      ],
    },
  });

  const children: TreeNode[] = [];

  if (parentFamily) {
    const { husbandId: fatherId, wifeId: motherId } = parentFamily;

    // Build father's full ancestor chain (mutates visited in-place)
    if (!visited.has(fatherId)) {
      const fatherNode = await buildUpward(fatherId, visited, depth + 1);
      if (fatherNode) {
        fatherNode.relation = "Father";
        children.push(fatherNode);
      }
    }

    // Build mother's full ancestor chain (separate copy so her branch isn't
    // blocked by nodes already visited on the father's side)
    if (!visited.has(motherId)) {
      const motherNode = await buildUpward(motherId, new Set(visited), depth + 1);
      if (motherNode) {
        motherNode.relation = "Mother";
        children.push(motherNode);
      }
    }
  }

  return { ...toSnap(person), children };
}

// ── Route handler ────────────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/family-tree/[personId]">
) {
  const { personId } = await ctx.params;
  const direction = request.nextUrl.searchParams.get("direction") ?? "downward";

  const person = await prisma.person.findUnique({ where: { id: personId } });
  if (!person) return Response.json({ error: "Person not found" }, { status: 404 });

  const tree =
    direction === "upward"
      ? await buildUpward(personId, new Set(), 0)
      : await buildDownward(personId, new Set(), 0);

  return Response.json({ tree, direction });
}
