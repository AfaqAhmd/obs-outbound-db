import ClientDetail from "@/components/ClientDetail";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({ params }) {
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

  return <ClientDetail client={client} />;
}

