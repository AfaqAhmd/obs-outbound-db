import { getUserSession } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const sessionId = await getUserSession();
  
  if (!sessionId) {
    return new Response(JSON.stringify({ authenticated: false }), { status: 200 });
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionId },
    select: { 
      id: true, 
      username: true,
      accessAllClients: true,
      clientId: true,
      client: {
        select: { name: true }
      }
    }
  });

  if (!user) {
    return new Response(JSON.stringify({ authenticated: false }), { status: 200 });
  }

  return new Response(
    JSON.stringify({ authenticated: true, user }),
    { status: 200 }
  );
}
