"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export default function AdminPanel() {
  const router = useRouter();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/admin/check");
        const json = await res.json();

        if (!json.authenticated) {
          router.push("/admin/login");
          return;
        }

        setAdmin(json.admin);
      } catch (e) {
        router.push("/admin/login");
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  async function handleLogout() {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      toast.success("Logged out");
      router.push("/admin/login");
    } catch (e) {
      toast.error("Failed to logout");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!admin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin Panel</h1>
          <p className="text-sm text-slate-400">
            Manage clients, their niches, and uploaders
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-300">Logged in as: {admin.username}</span>
          <button
            onClick={handleLogout}
            className="rounded border border-slate-700 px-3 py-1.5 text-xs hover:bg-slate-800"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/admin/clients"
          className="rounded-lg border border-slate-800 bg-slate-900/40 p-6 hover:bg-slate-900/60 transition"
        >
          <h3 className="text-lg font-semibold mb-2">Clients and Niches</h3>
          <p className="text-sm text-slate-400">
            Create and manage clients and assign niches
          </p>
        </Link>

        <Link
          href="/admin/uploaders"
          className="rounded-lg border border-slate-800 bg-slate-900/40 p-6 hover:bg-slate-900/60 transition"
        >
          <h3 className="text-lg font-semibold mb-2">Uploaders</h3>
          <p className="text-sm text-slate-400">
            Manage uploader accounts
          </p>
        </Link>
      </div>
    </div>
  );
}
