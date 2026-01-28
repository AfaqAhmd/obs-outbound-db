"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export default function AdminPanel() {
  const router = useRouter();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

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
            onClick={() => setShowPasswordModal(true)}
            className="rounded border border-slate-700 px-3 py-1.5 text-xs hover:bg-slate-800"
          >
            Change password
          </button>
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

      {showPasswordModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-sm rounded-lg border border-slate-800 bg-slate-950 p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-3">Change password</h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter your current password and a new password.
              You will be logged out after changing the password.
            </p>
            <form
              className="space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!currentPassword || !newPassword || !confirmPassword) {
                  toast.error("All fields are required");
                  return;
                }
                if (newPassword !== confirmPassword) {
                  toast.error("New password and confirmation do not match");
                  return;
                }
                setChangingPassword(true);
                try {
                  const res = await fetch("/api/admin/change-password", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      currentPassword,
                      newPassword
                    })
                  });
                  const json = await res.json();
                  if (!res.ok) {
                    toast.error(json.error || "Failed to change password");
                    return;
                  }
                  toast.success("Password updated. Please log in again.");
                  setShowPasswordModal(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                  router.push("/admin/login");
                } catch (err) {
                  console.error(err);
                  toast.error("Failed to change password");
                } finally {
                  setChangingPassword(false);
                }
              }}
            >
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Current password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  New password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Confirm new password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (changingPassword) return;
                    setShowPasswordModal(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  className="rounded border border-slate-700 px-3 py-1.5 text-xs hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="rounded bg-sky-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-600 disabled:opacity-50"
                >
                  {changingPassword ? "Updating..." : "Update password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
