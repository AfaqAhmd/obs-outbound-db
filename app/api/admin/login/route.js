import prisma from "@/lib/prisma";
import { setAdminSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: "Username and password are required" }),
        { status: 400 }
      );
    }

    const admin = await prisma.admin.findUnique({
      where: { username }
    });

    if (!admin) {
      return new Response(
        JSON.stringify({ error: "Invalid credentials" }),
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, admin.password);

    if (!isValid) {
      return new Response(
        JSON.stringify({ error: "Invalid credentials" }),
        { status: 401 }
      );
    }

    await setAdminSession(admin.id);

    return new Response(
      JSON.stringify({ success: true, admin: { id: admin.id, username: admin.username } }),
      { status: 200 }
    );
  } catch (e) {
    console.error("Login error:", e);
    return new Response(
      JSON.stringify({ error: "Failed to login" }),
      { status: 500 }
    );
  }
}
