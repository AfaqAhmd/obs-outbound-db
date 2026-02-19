"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function UploadPage() {
  const router = useRouter();
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [niches, setNiches] = useState([]);
  const [uploaders, setUploaders] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingUploaders, setLoadingUploaders] = useState(true);
  const [loadingNiches, setLoadingNiches] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAuthAndLoadClients() {
      try {
        // Check if admin is authenticated first
        const adminCheckRes = await fetch("/api/admin/check");
        const adminCheckData = await adminCheckRes.json();

        if (adminCheckData.authenticated) {
          setAdmin(adminCheckData.admin);
          setIsAdmin(true);
          
          // Load clients (admins see all clients)
          const res = await fetch("/api/clients");
          const data = await res.json();
          setClients(data.clients || []);
          setLoadingClients(false);
          setAuthLoading(false);
          return;
        }

        // Check if user is authenticated
        const checkRes = await fetch("/api/user/check");
        const checkData = await checkRes.json();

        if (!checkData.authenticated) {
          router.push("/login");
          return;
        }

        setUser(checkData.user);
        setIsAdmin(false);

        // Load clients (API will filter based on user access)
        const res = await fetch("/api/clients");
        const data = await res.json();
        setClients(data.clients || []);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load clients");
        router.push("/login");
      } finally {
        setLoadingClients(false);
        setAuthLoading(false);
      }
    }
    checkAuthAndLoadClients();
  }, [router]);

  async function handleLogout() {
    try {
      if (isAdmin) {
        await fetch("/api/admin/logout", { method: "POST" });
        toast.success("Logged out");
        router.push("/admin/login");
      } else {
        await fetch("/api/user/logout", { method: "POST" });
        toast.success("Logged out");
        router.push("/login");
      }
    } catch (e) {
      toast.error("Failed to logout");
    }
  }

  useEffect(() => {
    async function loadUploaders() {
      try {
        const uploadersRes = await fetch("/api/uploaders");
        const uploadersData = await uploadersRes.json();
        setUploaders(uploadersData.uploaders || []);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load uploaders");
      } finally {
        setLoadingUploaders(false);
      }
    }
    loadUploaders();
  }, []);

  useEffect(() => {
    async function loadNiches() {
      if (!selectedClientId) {
        setNiches([]);
        return;
      }

      setLoadingNiches(true);
      try {
        const nichesRes = await fetch(`/api/clients/${selectedClientId}/niches`);
        const nichesData = await nichesRes.json();
        setNiches(nichesData.niches || []);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load niches");
        setNiches([]);
      } finally {
        setLoadingNiches(false);
      }
    }
    loadNiches();
  }, [selectedClientId]);

  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const file = form.file.files[0];
    if (!file) {
      toast.error("Please select a CSV file");
      return;
    }
    const clientId = form.clientId.value;
    const nicheId = form.nicheId.value;
    const uploaderId = form.uploaderId.value;
    const dataType = form.dataType.value;

    if (!clientId || !nicheId || !uploaderId || !dataType) {
      toast.error("Please fill all required fields");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("clientId", clientId);
    formData.append("nicheId", nicheId);
    formData.append("uploaderId", uploaderId);
    formData.append("dataType", dataType);

    setSubmitting(true);
    const toastId = toast.loading("Uploading and processing CSV...");
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }
      toast.success(`Upload succeeded (${data.rowCount} rows)`, {
        id: toastId
      });
      form.reset();
    } catch (e) {
      console.error(e);
      toast.error(e.message || "Upload failed", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) {
    return (
      <div className="text-center py-12 text-slate-400">Loading...</div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Upload data</h2>
          <p className="text-sm text-slate-400">
            Upload row or enriched CSV data per client.
            {admin && (
              <span className="ml-2">
                Logged in as: {admin.username} (Admin)
              </span>
            )}
            {user && (
              <span className="ml-2">
                Logged in as: {user.username}
                {user.accessAllClients ? " (All clients)" : user.client ? ` (${user.client.name})` : ""}
              </span>
            )}
          </p>
        </div>
        {(admin || user) && (
          <button
            onClick={handleLogout}
            className="rounded border border-slate-700 px-3 py-1.5 text-xs hover:bg-slate-800"
          >
            Logout
          </button>
        )}
      </div>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 border border-slate-800 rounded-lg p-4 bg-slate-900/40"
      >
        <div className="space-y-1">
          <label className="text-sm font-medium">
            Client <span className="text-red-500">*</span>
          </label>
          <select
            name="clientId"
            value={selectedClientId}
            onChange={(e) => {
              setSelectedClientId(e.target.value);
              // Reset niche selection when client changes
              const form = e.target.closest("form");
              if (form) {
                form.nicheId.value = "";
              }
            }}
            className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            disabled={loadingClients}
          >
            <option value="">Select a client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">
            Niche <span className="text-red-500">*</span>
          </label>
          <select
            name="nicheId"
            className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            disabled={!selectedClientId || loadingNiches}
          >
            <option value="">
              {!selectedClientId
                ? "Select a client first"
                : loadingNiches
                ? "Loading niches..."
                : niches.length === 0
                ? "No niches assigned to this client"
                : "Select a niche"}
            </option>
            {niches.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
          </select>
          {selectedClientId && niches.length === 0 && !loadingNiches && (
            <p className="text-xs text-slate-400">
              This client has no niches assigned. Please assign niches in the admin panel.
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">
            Uploader <span className="text-red-500">*</span>
          </label>
          <select
            name="uploaderId"
            className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            disabled={loadingUploaders}
          >
            <option value="">Select an uploader</option>
            {uploaders.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">
            Type of data <span className="text-red-500">*</span>
          </label>
          <select
            name="dataType"
            className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">Select type</option>
            <option value="row">Raw</option>
            <option value="enriched">Enriched</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">
            CSV file <span className="text-red-500">*</span>
          </label>
          <input
            type="file"
            name="file"
            accept=".csv,text/csv"
            className="block w-full text-sm text-slate-300 file:mr-4 file:rounded file:border-0 file:bg-sky-500 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-sky-600"
          />
          <p className="text-xs text-slate-500">
            CSV with required headers depending on data type (Raw vs Enriched).
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center rounded bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-50"
        >
          {submitting ? "Processing..." : "Upload"}
        </button>
      </form>
    </div>
  );
}

