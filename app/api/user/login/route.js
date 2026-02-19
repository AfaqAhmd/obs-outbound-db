import prisma from "@/lib/prisma";
import { setUserSession } from "@/lib/auth";
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

    // Check if prisma.user exists (for debugging)
    if (!prisma.user) {
      console.error("Prisma Client error: prisma.user is undefined");
      return new Response(
        JSON.stringify({ 
          error: "Database configuration error",
          details: "User model not available in Prisma Client"
        }),
        { status: 500 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Invalid credentials" }),
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return new Response(
        JSON.stringify({ error: "Invalid credentials" }),
        { status: 401 }
      );
    }

    // Clear admin session if exists (only one session type at a time)
    const { clearAdminSession } = await import("@/lib/auth");
    await clearAdminSession();
    
    await setUserSession(user.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: { 
          id: user.id, 
          username: user.username,
          accessAllClients: user.accessAllClients,
          clientId: user.clientId
        } 
      }),
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
