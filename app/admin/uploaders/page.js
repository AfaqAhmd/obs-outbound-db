"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function AdminUploadersPage() {
  const router = useRouter();
  const [uploaders, setUploaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newUploaderName, setNewUploaderName] = useState("");

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/admin/check");
        const json = await res.json();
        if (!json.authenticated) {
          router.push("/admin/login");
          return;
        }
        loadUploaders();
      } catch (e) {
        router.push("/admin/login");
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  async function loadUploaders() {
    try {
      const res = await fetch("/api/admin/uploaders");
      const json = await res.json();
      setUploaders(json.uploaders || []);
    } catch (e) {
      toast.error("Failed to load uploaders");
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/uploaders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newUploaderName })
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Failed to create uploader");
        return;
      }

      toast.success("Uploader created");
      setShowModal(false);
      setNewUploaderName("");
      loadUploaders();
    } catch (e) {
      toast.error("Failed to create uploader");
    }
  }

  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this uploader?")) return;

    try {
      const res = await fetch(`/api/admin/uploaders?id=${id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        toast.error("Failed to delete uploader");
        return;
      }

      toast.success("Uploader deleted");
      loadUploaders();
    } catch (e) {
      toast.error("Failed to delete uploader");
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-slate-400">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Uploaders</h2>
        <button
          onClick={() => setShowModal(true)}
          className="rounded bg-sky-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-600"
        >
          Add Uploader
        </button>
      </div>

      <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/40">
        <table className="min-w-full text-xs">
          <thead className="bg-slate-900/60 border-b border-slate-800">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-slate-300">
                Name
              </th>
              <th className="px-3 py-2 text-left font-medium text-slate-300">
                Created
              </th>
              <th className="px-3 py-2 text-right font-medium text-slate-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {uploaders.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-3 py-4 text-center text-slate-400">
                  No uploaders yet
                </td>
              </tr>
            ) : (
              uploaders.map((uploader) => (
                <tr
                  key={uploader.id}
                  className="border-t border-slate-800 hover:bg-slate-900/40"
                >
                  <td className="px-3 py-2 text-slate-100">{uploader.name}</td>
                  <td className="px-3 py-2 text-slate-400">
                    {new Date(uploader.createdAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => handleDelete(uploader.id)}
                      className="text-red-400 hover:text-red-300 text-xs"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-950 p-6">
            <h3 className="text-lg font-semibold mb-4">Add Uploader</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Uploader Name *
                </label>
                <input
                  type="text"
                  value={newUploaderName}
                  onChange={(e) => setNewUploaderName(e.target.value)}
                  required
                  className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Enter uploader name"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setNewUploaderName("");
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
