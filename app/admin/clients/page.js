"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export default function AdminClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState([]);
  const [expandedClient, setExpandedClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newNicheNames, setNewNicheNames] = useState({});

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/admin/check");
        const json = await res.json();
        if (!json.authenticated) {
          router.push("/admin/login");
          return;
        }
        loadClients();
      } catch (e) {
        router.push("/admin/login");
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  async function loadClients() {
    try {
      const res = await fetch("/api/clients");
      const json = await res.json();
      const clientsData = json.clients || [];

      // Load niches for each client
      const clientsWithNiches = await Promise.all(
        clientsData.map(async (client) => {
          const nichesRes = await fetch(
            `/api/admin/client-niches?clientId=${client.id}`
          );
          const nichesData = await nichesRes.json();
          return {
            ...client,
            niches: nichesData.assignments || []
          };
        })
      );

      setClients(clientsWithNiches);
    } catch (e) {
      toast.error("Failed to load clients");
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newClientName })
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Failed to create client");
        return;
      }

      toast.success("Client created");
      setShowModal(false);
      setNewClientName("");
      loadClients();
    } catch (e) {
      toast.error("Failed to create client");
    }
  }

  async function handleDelete(id, name) {
    if (
      !confirm(
        `Are you sure you want to delete client "${name}"? This will also delete all associated data.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/clients/${id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        toast.error("Failed to delete client");
        return;
      }

      toast.success("Client deleted");
      loadClients();
    } catch (e) {
      toast.error("Failed to delete client");
    }
  }

  async function handleAddNiche(clientId, nicheName) {
    if (!nicheName || !nicheName.trim()) {
      toast.error("Niche name is required");
      return;
    }

    try {
      // API will create niche if it doesn't exist and assign it
      const assignRes = await fetch("/api/admin/client-niches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          nicheName: nicheName.trim()
        })
      });

      const assignData = await assignRes.json();

      if (!assignRes.ok) {
        toast.error(assignData.error || "Failed to assign niche");
        return;
      }

      toast.success("Niche assigned");
      setNewNicheNames({ ...newNicheNames, [clientId]: "" });
      loadClients();
    } catch (e) {
      toast.error("Failed to add niche");
    }
  }

  async function handleRemoveNiche(clientId, nicheId, nicheName) {
    if (!confirm(`Remove niche "${nicheName}" from this client?`)) {
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
        toast.error("Failed to remove niche");
        return;
      }

      toast.success("Niche removed");
      loadClients();
    } catch (e) {
      toast.error("Failed to remove niche");
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-slate-400">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Clients and Their Niches</h2>
        <button
          onClick={() => setShowModal(true)}
          className="rounded bg-sky-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-600"
        >
          Add Client
        </button>
      </div>

      <div className="space-y-2">
        {clients.length === 0 ? (
          <div className="border border-slate-800 rounded-lg p-8 text-center text-slate-400">
            No clients yet
          </div>
        ) : (
          clients.map((client) => (
            <div
              key={client.id}
              className="border border-slate-800 rounded-lg bg-slate-950/40 overflow-hidden"
            >
              <div className="flex items-center justify-between p-3 hover:bg-slate-900/40">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold text-slate-100">
                      {client.name}
                    </h3>
                    <span className="text-xs text-slate-400">
                      ({client.niches?.length || 0} niches)
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Created {new Date(client.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setExpandedClient(
                        expandedClient === client.id ? null : client.id
                      )
                    }
                    className="text-xs text-sky-400 hover:text-sky-300"
                  >
                    {expandedClient === client.id ? "Hide" : "Show"} Niches
                  </button>
                  <Link
                    href={`/admin/clients/${client.id}/delete-data`}
                    className="text-xs text-amber-400 hover:text-amber-300"
                  >
                    Delete data
                  </Link>
                  <button
                    onClick={() => handleDelete(client.id, client.name)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {expandedClient === client.id && (
                <div className="border-t border-slate-800 p-3 space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newNicheNames[client.id] || ""}
                      onChange={(e) =>
                        setNewNicheNames({
                          ...newNicheNames,
                          [client.id]: e.target.value
                        })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddNiche(client.id, newNicheNames[client.id]);
                        }
                      }}
                      placeholder="Enter niche name and press Enter"
                      className="flex-1 rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    <button
                      onClick={() =>
                        handleAddNiche(client.id, newNicheNames[client.id])
                      }
                      className="rounded bg-sky-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-600"
                    >
                      Add
                    </button>
                  </div>

                  {client.niches && client.niches.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {client.niches.map((niche) => (
                        <span
                          key={niche.id}
                          className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-1 text-xs"
                        >
                          <span className="text-slate-200">{niche.name}</span>
                          <button
                            onClick={() =>
                              handleRemoveNiche(client.id, niche.id, niche.name)
                            }
                            className="text-red-400 hover:text-red-300"
                            title="Remove niche"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">
                      No niches assigned yet. Add one above.
                    </p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-950 p-6">
            <h3 className="text-lg font-semibold mb-4">Add Client</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Client Name *
                </label>
                <input
                  type="text"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  required
                  className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Enter client name"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setNewClientName("");
                  }}
                  className="rounded border border-slate-700 px-3 py-1.5 text-xs hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-sky-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-600"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
