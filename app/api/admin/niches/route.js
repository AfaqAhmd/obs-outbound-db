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
  const authError = await checkAuth();
  if (authError) {
    return new Response(JSON.stringify({ error: authError.error }), {
      status: authError.status
    });
  }

  const niches = await prisma.niche.findMany({
    orderBy: { name: "asc" }
  });

  return new Response(JSON.stringify({ niches }), { status: 200 });
}

export async function POST(request) {
  const authError = await checkAuth();
  if (authError) {
    return new Response(JSON.stringify({ error: authError.error }), {
      status: authError.status
    });
  }

  try {
    const { name } = await request.json();

    if (!name || !name.trim()) {
      return new Response(
        JSON.stringify({ error: "Niche name is required" }),
        { status: 400 }
      );
    }

    const niche = await prisma.niche.create({
      data: { name: name.trim() }
    });

    return new Response(JSON.stringify({ niche }), { status: 201 });
  } catch (e) {
    if (e.code === "P2002") {
      return new Response(
        JSON.stringify({ error: "Niche already exists" }),
        { status: 400 }
      );
    }
    return new Response(
      JSON.stringify({ error: "Failed to create niche" }),
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
    const id = searchParams.get("id");

    if (!id) {
      return new Response(
        JSON.stringify({ error: "Niche ID is required" }),
        { status: 400 }
      );
    }

    await prisma.niche.delete({
      where: { id }
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Failed to delete niche" }),
      { status: 500 }
    );
  }
}
