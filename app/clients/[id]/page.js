import ClientDetail from "@/components/ClientDetail";
import prisma from "@/lib/prisma";
import { getUserSession, getAdminSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({ params }) {
  const userSessionId = await getUserSession();
  const adminSessionId = await getAdminSession();

  // If no session, redirect to login
  if (!userSessionId && !adminSessionId) {
    redirect("/login");
  }

  const client = await prisma.client.findUnique({
    where: { id: params.id }
  });

  if (!client) {
    return (
      <div>
        <h2 className="text-xl font-semibold">Client not found</h2>
      </div>
    );
  }

  // If user (not admin), check if they have access to this client
  if (userSessionId && !adminSessionId) {
    const user = await prisma.user.findUnique({
      where: { id: userSessionId },
      select: { accessAllClients: true, clientId: true }
    });

    if (!user) {
      redirect("/login");
    }

    // Check if user has access to this client
    if (!user.accessAllClients && user.clientId !== client.id) {
      redirect("/clients");
    }
  }

  return <ClientDetail client={client} />;
}

