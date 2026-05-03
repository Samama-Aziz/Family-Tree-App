import { prisma } from "@/lib/prisma";
import { createSessionToken, sessionCookieOptions } from "@/lib/session";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return Response.json({ error: "name, email and password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return Response.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return Response.json({ error: "Email already in use" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const role = email === process.env.ADMIN_EMAIL ? "admin" : "user";

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role },
    });

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const response = Response.json(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      { status: 201 }
    );
    response.headers.set(
      "Set-Cookie",
      `${sessionCookieOptions(token).name}=${sessionCookieOptions(token).value}; HttpOnly; Path=/; Max-Age=${sessionCookieOptions(token).maxAge}; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`
    );
    return response;
  } catch (error) {
    console.error("POST /api/auth/register error:", error);
    return Response.json({ error: "Registration failed" }, { status: 500 });
  }
}
