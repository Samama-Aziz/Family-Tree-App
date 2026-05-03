import { prisma } from "@/lib/prisma";
import { createSessionToken, sessionCookieOptions } from "@/lib/session";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return Response.json({ error: "email and password are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return Response.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return Response.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const opts = sessionCookieOptions(token);
    const response = Response.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
    response.headers.set(
      "Set-Cookie",
      `${opts.name}=${opts.value}; HttpOnly; Path=/; Max-Age=${opts.maxAge}; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`
    );
    return response;
  } catch (error) {
    console.error("POST /api/auth/login error:", error);
    return Response.json({ error: "Login failed" }, { status: 500 });
  }
}
