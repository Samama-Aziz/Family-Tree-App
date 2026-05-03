import { prisma } from "./prisma";

/**
 * Generate sequential display IDs for Persons and Families
 * Format: P_00001 (Person), F_00001 (Family)
 */

export async function generatePersonDisplayId(): Promise<string> {
  // Get the highest existing person displayId
  const lastPerson = await prisma.person.findFirst({
    orderBy: { displayId: "desc" },
    select: { displayId: true },
  });

  let nextNumber = 1;
  if (lastPerson && lastPerson.displayId) {
    const match = lastPerson.displayId.match(/P_(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  return `P_${String(nextNumber).padStart(5, "0")}`;
}

export async function generateFamilyDisplayId(): Promise<string> {
  // Get the highest existing family displayId
  const lastFamily = await prisma.family.findFirst({
    orderBy: { displayId: "desc" },
    select: { displayId: true },
  });

  let nextNumber = 1;
  if (lastFamily && lastFamily.displayId) {
    const match = lastFamily.displayId.match(/F_(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  return `F_${String(nextNumber).padStart(5, "0")}`;
}
