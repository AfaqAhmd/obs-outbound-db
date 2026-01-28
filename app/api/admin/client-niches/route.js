import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

async function checkAuth() {
  const sessionId = await getAdminSession();
  if (!sessionId) {
    return { error: "Unauthorized", status: 401 };
  }
  return null;
}

export async function GET(request) {
  const authError = await checkAuth();
  if (authError) {
    return new Response(JSON.stringify({ error: authError.error }), {
      status: authError.status
    });
  }

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");

  if (!clientId) {
    return new Response(
      JSON.stringify({ error: "clientId is required" }),
      { status: 400 }
    );
  }

  const assignments = await prisma.clientNiche.findMany({
    where: { clientId },
    include: {
      niche: true
    }
  });

  return new Response(
    JSON.stringify({ assignments: assignments.map((a) => a.niche) }),
    { status: 200 }
  );
}

export async function POST(request) {
  const authError = await checkAuth();
  if (authError) {
    return new Response(JSON.stringify({ error: authError.error }), {
      status: authError.status
    });
  }

  try {
    const { clientId, nicheId, nicheName } = await request.json();

    if (!clientId) {
      return new Response(
        JSON.stringify({ error: "clientId is required" }),
        { status: 400 }
      );
    }

    let finalNicheId = nicheId;

    // If nicheName is provided but nicheId is not, find or create the niche
    if (nicheName && !nicheId) {
      const trimmedName = nicheName.trim();
      if (!trimmedName) {
        return new Response(
          JSON.stringify({ error: "Niche name cannot be empty" }),
          { status: 400 }
        );
      }

      // Try to find existing niche (case-insensitive)
      let niche = await prisma.niche.findFirst({
        where: {
          name: {
            equals: trimmedName,
            mode: "insensitive"
          }
        }
      });

      // Create if doesn't exist
      if (!niche) {
        niche = await prisma.niche.create({
          data: { name: trimmedName }
        });
      }

      finalNicheId = niche.id;
    }

    if (!finalNicheId) {
      return new Response(
        JSON.stringify({ error: "nicheId or nicheName is required" }),
        { status: 400 }
      );
    }

    const assignment = await prisma.clientNiche.create({
      data: {
        clientId,
        nicheId: finalNicheId
      },
      include: {
        niche: true
      }
    });

    return new Response(JSON.stringify({ assignment }), { status: 201 });
  } catch (e) {
    if (e.code === "P2002") {
      return new Response(
        JSON.stringify({ error: "Niche already assigned to this client" }),
        { status: 400 }
      );
    }
    return new Response(
      JSON.stringify({ error: "Failed to assign niche" }),
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  const authError = await checkAuth();
  if (authError) {
    return new Response(JSON.stringify({ error: authError.error }), {
      status: authError.status
    });
  }

  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const nicheId = searchParams.get("nicheId");

    if (!clientId || !nicheId) {
      return new Response(
        JSON.stringify({ error: "clientId and nicheId are required" }),
        { status: 400 }
      );
    }

    await prisma.clientNiche.delete({
      where: {
        clientId_nicheId: {
          clientId,
          nicheId
        }
      }
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Failed to remove niche assignment" }),
      { status: 500 }
    );
  }
}
