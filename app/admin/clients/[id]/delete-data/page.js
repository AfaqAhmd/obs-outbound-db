"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";

export default function AdminDeleteDataPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id;

  const [client, setClient] = useState(null);
  const [uploaders, setUploaders] = useState([]);
  const [niches, setNiches] = useState([]);

  const [dataType, setDataType] = useState("both");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [uploader, setUploader] = useState("");
  const [niche, setNiche] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function checkAuthAndLoad() {
      try {
        const res = await fetch("/api/admin/check");
        const json = await res.json();
        if (!json.authenticated) {
          router.push("/admin/login");
          return;
        }
        await loadData();
      } catch (e) {
        router.push("/admin/login");
      } finally {
        setLoading(false);
      }
    }
    checkAuthAndLoad();
  }, [router, clientId]);

  async function loadData() {
    try {
      const [clientsRes, uploadersRes, nichesRes] = await Promise.all([
        fetch("/api/clients"),
        fetch(`/api/clients/${clientId}/uploaders`),
        fetch(`/api/clients/${clientId}/niches`)
      ]);

      const clientsData = await clientsRes.json();
      const uploadersData = await uploadersRes.json();
      const nichesData = await nichesRes.json();

      const foundClient = (clientsData.clients || []).find(
        (c) => c.id === clientId
      );
      setClient(foundClient || null);
      setUploaders(uploadersData.uploaders || []);
      setNiches(nichesData.niches || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load client data");
    }
  }

  async function handleDelete() {
    if (!client) return;

    const summary = [
      `Client: ${client.name}`,
      `Data type: ${dataType}`,
      from && `From: ${from}`,
      to && `To: ${to}`,
      uploader && `Uploader: ${uploader}`,
      niche && `Niche: ${niche}`
    ]
      .filter(Boolean)
      .join("\n");

    const confirmed = confirm(
      `This will permanently delete matching records.\n\n${summary}\n\nAre you sure?`
    );

    if (!confirmed) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/delete-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataType,
          from: from || null,
          to: to || null,
          uploader: uploader || null,
          niche: niche || null
        })
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Failed to delete data");
        return;
      }

      toast.success(
        `Deleted raw: ${json.deletedRow}, enriched: ${json.deletedEnriched}`
      );
      router.push("/admin/clients");
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete data");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-slate-400">Loading...</div>;
  }

  if (!client) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Client not found</h2>
          <button
            onClick={() => router.push("/admin/clients")}
            className="rounded border border-slate-700 px-3 py-1.5 text-xs hover:bg-slate-800"
          >
            Back to Clients
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            Delete Data: {client.name}
          </h2>
          <p className="text-sm text-slate-400">
            Delete records for this client by data type, date range, uploader,
            niche, or any combination.
          </p>
        </div>
        <button
          onClick={() => router.push("/admin/clients")}
          className="rounded border border-slate-700 px-3 py-1.5 text-xs hover:bg-slate-800"
        >
          Back to Clients
        </button>
      </div>

      <div className="border border-red-800 rounded-lg bg-red-950/20 p-4 text-xs text-red-200">
        <p className="font-semibold mb-1">Danger zone</p>
        <p>
          This action is irreversible. Deleted data cannot be recovered. Make
          sure your filters are correct before proceeding.
        </p>
      </div>

      <div className="border border-slate-800 rounded-lg bg-slate-950/40 p-4 space-y-3 text-xs">
        <div className="space-y-1">
          <label className="text-[11px] text-slate-300">Data type</label>
          <select
            value={dataType}
            onChange={(e) => setDataType(e.target.value)}
            className="w-48 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs"
          >
            <option value="both">Raw + Enriched</option>
            <option value="row">Raw only</option>
            <option value="enriched">Enriched only</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="space-y-1">
            <label className="text-[11px] text-slate-300">From date</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-slate-300">To date</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs"
            />
          </div>
          <div className="space-y-1 min-w-[160px]">
            <label className="text-[11px] text-slate-300">Uploader</label>
            <select
              value={uploader}
              onChange={(e) => setUploader(e.target.value)}
              className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs"
            >
              <option value="">All uploaders</option>
              {uploaders.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1 min-w-[160px]">
            <label className="text-[11px] text-slate-300">Niche</label>
            <select
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs"
            >
              <option value="">All niches</option>
              {niches.map((n) => (
                <option key={n.id} value={n.name}>
                  {n.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
          >
            {deleting ? "Deleting..." : "Delete records"}
          </button>
        </div>
      </div>
    </div>
  );
}

