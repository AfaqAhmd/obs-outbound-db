import prisma from "@/lib/prisma";
import ClientsTable from "@/components/ClientsTable";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Clients</h2>
        <p className="text-sm text-slate-400">
          View clients and their outbound datasets. Admin access required to manage clients.
        </p>
      </div>
      <ClientsTable clients={clients} />
    </div>
  );
}

