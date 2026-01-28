"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";

export default function ClientNichesPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id;
  const [client, setClient] = useState(null);
  const [allNiches, setAllNiches] = useState([]);
  const [assignedNiches, setAssignedNiches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNicheId, setSelectedNicheId] = useState("");

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/admin/check");
        const json = await res.json();
        if (!json.authenticated) {
          router.push("/admin/login");
          return;
        }
        loadData();
      } catch (e) {
        router.push("/admin/login");
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [router, clientId]);

  async function loadData() {
    try {
      const [clientsRes, nichesRes, assignmentsRes] = await Promise.all([
        fetch("/api/clients"),
        fetch("/api/admin/niches"),
        fetch(`/api/admin/client-niches?clientId=${clientId}`)
      ]);

      const clientsData = await clientsRes.json();
      const nichesData = await nichesRes.json();
      const assignmentsData = await assignmentsRes.json();

      const foundClient = clientsData.clients.find((c) => c.id === clientId);
      setClient(foundClient);
      setAllNiches(nichesData.niches || []);
      setAssignedNiches(assignmentsData.assignments || []);
    } catch (e) {
      toast.error("Failed to load data");
    }
  }

  async function handleAssign() {
    if (!selectedNicheId) {
      toast.error("Please select a niche");
      return;
    }

    try {
      const res = await fetch("/api/admin/client-niches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          nicheId: selectedNicheId
        })
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Failed to assign niche");
        return;
      }

      toast.success("Niche assigned");
      setSelectedNicheId("");
      loadData();
    } catch (e) {
      toast.error("Failed to assign niche");
    }
  }

  async function handleRemove(nicheId) {
    if (!confirm("Are you sure you want to remove this niche assignment?")) {
      return;
    }

    try {
      const res = await fetch(
        `/api/admin/client-niches?clientId=${clientId}&nicheId=${nicheId}`,
        {
          method: "DELETE"
        }
      );

      if (!res.ok) {
        toast.error("Failed to remove niche assignment");
        return;
      }

      toast.success("Niche assignment removed");
      loadData();
    } catch (e) {
      toast.error("Failed to remove niche assignment");
    }
  }

  const availableNiches = allNiches.filter(
    (n) => !assignedNiches.some((an) => an.id === n.id)
  );

  if (loading) {
    return <div className="text-center py-12 text-slate-400">Loading...</div>;
  }

  if (!client) {
    return (
      <div className="text-center py-12 text-slate-400">Client not found</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            Assign Niches: {client.name}
          </h2>
          <p className="text-sm text-slate-400">
            Manage which niches are available for this client
          </p>
        </div>
        <button
          onClick={() => router.push("/admin/clients")}
          className="rounded border border-slate-700 px-3 py-1.5 text-xs hover:bg-slate-800"
        >
          Back to Clients
        </button>
      </div>

      <div className="border border-slate-800 rounded-lg p-4 bg-slate-950/40">
        <h3 className="text-sm font-semibold mb-3">Assign New Niche</h3>
        <div className="flex gap-2">
          <select
            value={selectedNicheId}
            onChange={(e) => setSelectedNicheId(e.target.value)}
            className="flex-1 rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">Select a niche</option>
            {availableNiches.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleAssign}
            disabled={!selectedNicheId}
            className="rounded bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-50"
          >
            Assign
          </button>
        </div>
        {availableNiches.length === 0 && (
          <p className="text-xs text-slate-400 mt-2">
            All niches are already assigned to this client
          </p>
        )}
      </div>

      <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/40">
        <table className="min-w-full text-xs">
          <thead className="bg-slate-900/60 border-b border-slate-800">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-slate-300">
                Assigned Niches
              </th>
              <th className="px-3 py-2 text-right font-medium text-slate-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {assignedNiches.length === 0 ? (
              <tr>
                <td
                  colSpan={2}
                  className="px-3 py-4 text-center text-slate-400"
                >
                  No niches assigned yet
                </td>
              </tr>
            ) : (
              assignedNiches.map((niche) => (
                <tr
                  key={niche.id}
                  className="border-t border-slate-800 hover:bg-slate-900/40"
                >
                  <td className="px-3 py-2 text-slate-100">{niche.name}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => handleRemove(niche.id)}
                      className="text-red-400 hover:text-red-300 text-xs"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
