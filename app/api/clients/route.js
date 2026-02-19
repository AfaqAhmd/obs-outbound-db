import prisma from "@/lib/prisma";
import { getAdminSession, getUserSession } from "@/lib/auth";

async function checkAuth() {
  const sessionId = await getAdminSession();
  if (!sessionId) {
    return { error: "Unauthorized", status: 401 };
  }
  return null;
}

export async function GET() {
  // Check for user session first (for regular users accessing /clients)
  // This endpoint is primarily for users, so prioritize user session
  const userSessionId = await getUserSession();
  
  if (userSessionId) {
    const user = await prisma.user.findUnique({
      where: { id: userSessionId },
      select: { accessAllClients: true, clientId: true }
    });

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Debug logging
    console.log("User access check:", {
      userId: userSessionId,
      accessAllClients: user.accessAllClients,
      clientId: user.clientId
    });

    // Filter clients based on user access
    let clients = [];
    
    // Explicitly check boolean value
    const hasAccessAll = Boolean(user.accessAllClients);
    const hasClientId = user.clientId && user.clientId.trim() !== "";
    
    if (hasAccessAll) {
      // User has access to all clients
      clients = await prisma.client.findMany({
        orderBy: { createdAt: "desc" }
      });
      console.log("User has access to all clients, returning", clients.length, "clients");
    } else if (hasClientId) {
      // User has access to only one specific client
      const client = await prisma.client.findUnique({
        where: { id: user.clientId }
      });
      if (client) {
        clients = [client];
        console.log("User has access to single client:", client.name);
      } else {
        console.log("User's assigned client not found:", user.clientId);
      }
    } else {
      console.log("User has no client access (accessAllClients=false, clientId=null)");
    }
    // If accessAllClients is false and clientId is null, return empty array

    return new Response(JSON.stringify({ clients }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Check for admin session (admins see all clients)
  // Only check admin if no user session exists
  const adminSessionId = await getAdminSession();
  
  if (adminSessionId) {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: "desc" }
    });

    return new Response(JSON.stringify({ clients }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  // If no session, return empty array (user needs to login)
  return new Response(JSON.stringify({ clients: [] }), {
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

