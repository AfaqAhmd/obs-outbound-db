import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import bcrypt from "bcrypt";

async function checkAuth() {
  const sessionId = await getAdminSession();
  if (!sessionId) {
    return { error: "Unauthorized", status: 401 };
  }
  return null;
}

export async function GET() {
  const authError = await checkAuth();
  if (authError) {
    return new Response(JSON.stringify({ error: authError.error }), {
      status: authError.status
    });
  }

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { client: true }
    });

    return new Response(JSON.stringify({ users }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    console.error("Error fetching users:", e);
    return new Response(
      JSON.stringify({ 
        error: "Failed to fetch users", 
        details: e.message,
        stack: process.env.NODE_ENV === "development" ? e.stack : undefined
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function POST(request) {
  const authError = await checkAuth();
  if (authError) {
    return new Response(JSON.stringify({ error: authError.error }), {
      status: authError.status
    });
  }

  try {
    const body = await request.json();
    const username = (body.username || "").trim();
    const password = (body.password || "").trim();
    const accessAllClients = !!body.accessAllClients;
    const clientId =
      !accessAllClients && body.clientId && body.clientId !== "all"
        ? String(body.clientId)
        : null;

    if (!username) {
      return new Response(
        JSON.stringify({ error: "Username is required" }),
        { status: 400 }
      );
    }

    if (!password) {
      return new Response(
        JSON.stringify({ error: "Password is required" }),
        { status: 400 }
      );
    }

    if (!accessAllClients && !clientId) {
      return new Response(
        JSON.stringify({
          error: "Client is required when 'All clients' is not selected"
        }),
        { status: 400 }
      );
    }

    const existing = await prisma.user.findFirst({
      where: { username }
    });
    if (existing) {
      return new Response(
        JSON.stringify({ error: "Username must be unique" }),
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        accessAllClients,
        clientId
      },
      include: { client: true }
    });

    return new Response(JSON.stringify({ user }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    console.error("Failed to create user", e);
    return new Response(
      JSON.stringify({ error: "Failed to create user" }),
      { status: 500 }
    );
  }
}

