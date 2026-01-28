import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

async function checkAuth() {
  const sessionId = await getAdminSession();
  if (!sessionId) {
    return { error: "Unauthorized", status: 401 };
  }
  return null;
}

export async function GET() {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" }
  });
  return new Response(JSON.stringify({ clients }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
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
    const name = (body.name || "").trim();
    if (!name) {
      return new Response(
        JSON.stringify({ error: "Client name is required" }),
        { status: 400 }
      );
    }

    const exists = await prisma.client.findFirst({
      where: { name: name }
    });
    if (exists) {
      return new Response(
        JSON.stringify({ error: "Client name must be unique" }),
        { status: 400 }
      );
    }

    const client = await prisma.client.create({
      data: { name }
    });
    return new Response(JSON.stringify({ client }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500
    });
  }
}

