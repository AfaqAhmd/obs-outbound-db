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

  const uploaders = await prisma.uploader.findMany({
    orderBy: { name: "asc" }
  });

  return new Response(JSON.stringify({ uploaders }), { status: 200 });
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
        JSON.stringify({ error: "Uploader name is required" }),
        { status: 400 }
      );
    }

    const uploader = await prisma.uploader.create({
      data: { name: name.trim() }
    });

    return new Response(JSON.stringify({ uploader }), { status: 201 });
  } catch (e) {
    if (e.code === "P2002") {
      return new Response(
        JSON.stringify({ error: "Uploader already exists" }),
        { status: 400 }
      );
    }
    return new Response(
      JSON.stringify({ error: "Failed to create uploader" }),
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
        JSON.stringify({ error: "Uploader ID is required" }),
        { status: 400 }
      );
    }

    await prisma.uploader.delete({
      where: { id }
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Failed to delete uploader" }),
      { status: 500 }
    );
  }
}
