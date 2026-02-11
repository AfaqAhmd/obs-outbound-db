import Link from "next/link";
import { formatDateTimeGMT5 } from "@/lib/formatDate";

export default function ClientsTable({ clients }) {
  if (!clients.length) {
    return (
      <div className="border border-dashed border-slate-700 rounded-lg p-6 text-sm text-slate-400">
        No clients yet. Create your first client to start uploading data.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950/40">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-900/60 border-b border-slate-800">
          <tr>
            <th className="px-4 py-2 text-left font-medium text-slate-300">
              Client
            </th>
            <th className="px-4 py-2 text-left font-medium text-slate-300">
              Created
            </th>
            <th className="px-4 py-2 text-right font-medium text-slate-300">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr
              key={client.id}
              className="border-t border-slate-800 hover:bg-slate-900/40"
            >
              <td className="px-4 py-2 text-slate-100">{client.name}</td>
              <td className="px-4 py-2 text-slate-400">
                {formatDateTimeGMT5(client.createdAt)}
              </td>
              <td className="px-4 py-2 text-right">
                <Link
                  href={`/clients/${client.id}`}
                  className="text-sky-400 hover:text-sky-300 text-xs font-medium"
                >
                  View details
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

