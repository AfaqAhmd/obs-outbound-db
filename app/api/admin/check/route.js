import { getAdminSession } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const sessionId = await getAdminSession();
  
  if (!sessionId) {
    return new Response(JSON.stringify({ authenticated: false }), { status: 200 });
  }

  const admin = await prisma.admin.findUnique({
    where: { id: sessionId },
    select: { id: true, username: true }
  });

  if (!admin) {
    return new Response(JSON.stringify({ authenticated: false }), { status: 200 });
  }

  return new Response(
    JSON.stringify({ authenticated: true, admin }),
    { status: 200 }
  );
}
