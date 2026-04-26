import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    // Wipe existing data
    await prisma.family.deleteMany();
    await prisma.person.deleteMany();

    // ── Generation 1: Grandparents ─────────────────────────────────
    const ahmad = await prisma.person.create({
      data: {
        name: "Ahmad Khan",
        gender: "Male",
        age: 84,
        dob: new Date("1940-01-15"),
        dod: new Date("2015-06-20"),
        isAlive: false,
        fatherName: null,
        motherName: null,
      },
    });

    const fatima = await prisma.person.create({
      data: {
        name: "Fatima Begum",
        gender: "Female",
        age: 78,
        dob: new Date("1946-03-10"),
        isAlive: true,
        fatherName: null,
        motherName: null,
      },
    });

    // ── Generation 2: Children of Ahmad & Fatima ──────────────────
    const hassan = await prisma.person.create({
      data: {
        name: "Hassan Khan",
        gender: "Male",
        age: 53,
        dob: new Date("1972-07-25"),
        isAlive: true,
        fatherName: "Ahmad Khan",
        motherName: "Fatima Begum",
      },
    });

    const zara = await prisma.person.create({
      data: {
        name: "Zara Malik",
        gender: "Female",
        age: 48,
        dob: new Date("1976-04-17"),
        isAlive: true,
        fatherName: "Ahmad Khan",
        motherName: "Fatima Begum",
      },
    });

    // ── Generation 2: Spouses ──────────────────────────────────────
    const sara = await prisma.person.create({
      data: {
        name: "Sara Ahmed",
        gender: "Female",
        age: 50,
        dob: new Date("1974-11-08"),
        isAlive: true,
        fatherName: null,
        motherName: null,
      },
    });

    const khalid = await prisma.person.create({
      data: {
        name: "Khalid Malik",
        gender: "Male",
        age: 50,
        dob: new Date("1974-09-30"),
        isAlive: true,
        fatherName: null,
        motherName: null,
      },
    });

    // ── Generation 3: Children of Hassan & Sara ────────────────────
    const imran = await prisma.person.create({
      data: {
        name: "Imran Hassan",
        gender: "Male",
        age: 27,
        dob: new Date("1997-02-14"),
        isAlive: true,
        fatherName: "Hassan Khan",
        motherName: "Sara Ahmed",
      },
    });

    const nadia = await prisma.person.create({
      data: {
        name: "Nadia Hassan",
        gender: "Female",
        age: 24,
        dob: new Date("2000-08-22"),
        isAlive: true,
        fatherName: "Hassan Khan",
        motherName: "Sara Ahmed",
      },
    });

    const omar = await prisma.person.create({
      data: {
        name: "Omar Hassan",
        gender: "Male",
        age: 22,
        dob: new Date("2002-12-05"),
        isAlive: true,
        fatherName: "Hassan Khan",
        motherName: "Sara Ahmed",
      },
    });

    // ── Generation 3: Child of Khalid & Zara ──────────────────────
    const aisha = await prisma.person.create({
      data: {
        name: "Aisha Khalid",
        gender: "Female",
        age: 21,
        dob: new Date("2003-05-11"),
        isAlive: true,
        fatherName: "Khalid Malik",
        motherName: "Zara Malik",
      },
    });

    // ── Family Records ─────────────────────────────────────────────
    await prisma.family.create({
      data: {
        husbandId: ahmad.id,
        husbandName: ahmad.name,
        wifeId: fatima.id,
        wifeName: fatima.name,
        sonIds: [hassan.id],
        daughterIds: [zara.id],
        remarks: "Founding generation",
      },
    });

    await prisma.family.create({
      data: {
        husbandId: hassan.id,
        husbandName: hassan.name,
        wifeId: sara.id,
        wifeName: sara.name,
        sonIds: [imran.id, omar.id],
        daughterIds: [nadia.id],
      },
    });

    await prisma.family.create({
      data: {
        husbandId: khalid.id,
        husbandName: khalid.name,
        wifeId: zara.id,
        wifeName: zara.name,
        sonIds: [],
        daughterIds: [aisha.id],
      },
    });

    return Response.json({
      message: "Seeded successfully",
      persons: 10,
      families: 3,
    });
  } catch (error) {
    console.error("Seed error:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
