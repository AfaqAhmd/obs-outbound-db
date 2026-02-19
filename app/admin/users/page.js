"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { formatDateTimeGMT5 } from "@/lib/formatDate";

export default function AdminUsersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accessMode, setAccessMode] = useState("all"); // "all" or "single"
  const [clientId, setClientId] = useState("");

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/api/admin/check");
        const json = await res.json();
        if (!json.authenticated) {
          router.push("/admin/login");
          return;
        }
        await Promise.all([loadUsers(), loadClients()]);
      } catch (e) {
        router.push("/admin/login");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router]);

  async function loadUsers() {
    try {
      const res = await fetch("/api/admin/users");
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Failed to load users");
        return;
      }
      setUsers(json.users || []);
    } catch (e) {
      toast.error("Failed to load users");
    }
  }

  async function loadClients() {
    try {
      const res = await fetch("/api/clients");
      const json = await res.json();
      setClients(json.clients || []);
    } catch (e) {
      toast.error("Failed to load clients");
    }
  }

  async function handleCreate(e) {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      toast.error("Username and password are required");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Password and confirmation do not match");
      return;
    }

    const accessAllClients = accessMode === "all";
    const payload = {
      username: username.trim(),
      password,
      accessAllClients,
      clientId: accessAllClients ? "all" : clientId || null
    };

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Failed to create user");
        return;
      }
      toast.success("User created");
      setShowModal(false);
      setUsername("");
      setPassword("");
      setConfirmPassword("");
      setAccessMode("all");
      setClientId("");
      await loadUsers();
    } catch (e) {
      toast.error("Failed to create user");
    }
  }

  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE"
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Failed to delete user");
        return;
      }
      toast.success("User deleted");
      await loadUsers();
    } catch (e) {
      toast.error("Failed to delete user");
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-slate-400">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Users</h2>
        <button
          onClick={() => setShowModal(true)}
          className="rounded bg-sky-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-600"
        >
          Add User
        </button>
      </div>

      <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/40">
        <table className="min-w-full text-xs">
          <thead className="bg-slate-900/60 border-b border-slate-800">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-slate-300">
                Username
              </th>
              <th className="px-3 py-2 text-left font-medium text-slate-300">
                Client Access
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
            {users.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-4 text-center text-slate-400"
                >
                  No users yet
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  className="border-t border-slate-800 hover:bg-slate-900/40"
                >
                  <td className="px-3 py-2 text-slate-100">{user.username}</td>
                  <td className="px-3 py-2 text-slate-400">
                    {user.accessAllClients
                      ? "All clients"
                      : user.client
                      ? user.client.name
                      : "No client assigned"}
                  </td>
                  <td className="px-3 py-2 text-slate-400">
                    {formatDateTimeGMT5(user.createdAt)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => handleDelete(user.id)}
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
            <h3 className="text-lg font-semibold mb-4">Add User</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Enter username"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Enter password"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Confirm password *
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Re-enter password"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Client access *
                </label>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-2 text-xs text-slate-200">
                      <input
                        type="radio"
                        className="h-3 w-3"
                        value="all"
                        checked={accessMode === "all"}
                        onChange={() => setAccessMode("all")}
                      />
                      <span>All clients</span>
                    </label>
                    <label className="inline-flex items-center gap-2 text-xs text-slate-200">
                      <input
                        type="radio"
                        className="h-3 w-3"
                        value="single"
                        checked={accessMode === "single"}
                        onChange={() => setAccessMode("single")}
                      />
                      <span>Specific client</span>
                    </label>
                  </div>
                  {accessMode === "single" && (
                    <select
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      required
                      className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="">Select client</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setUsername("");
                    setPassword("");
                    setConfirmPassword("");
                    setAccessMode("all");
                    setClientId("");
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

