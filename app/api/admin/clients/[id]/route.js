import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

async function checkAuth() {
  const sessionId = await getAdminSession();
  if (!sessionId) {
    return { error: "Unauthorized", status: 401 };
  }
  return null;
}

export async function DELETE(request, { params }) {
  const authError = await checkAuth();
  if (authError) {
    return new Response(JSON.stringify({ error: authError.error }), {
      status: authError.status
    });
  }

  try {
    await prisma.client.delete({
      where: { id: params.id }
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e) {
    if (e.code === "P2025") {
      return new Response(
        JSON.stringify({ error: "Client not found" }),
        { status: 404 }
      );
    }
    return new Response(
      JSON.stringify({ error: "Failed to delete client" }),
      { status: 500 }
    );
  }
}
