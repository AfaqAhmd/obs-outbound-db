"use client";

import { useEffect, useState } from "react";
import RowDetailModal from "./RowDetailModal";

const PAGE_SIZE = 20;

function TabButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-medium rounded ${
        active
          ? "bg-sky-600 text-white"
          : "text-slate-300 hover:bg-slate-800"
      }`}
    >
      {children}
    </button>
  );
}

export default function ClientDetail({ client }) {
  const [activeTab, setActiveTab] = useState("row");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("createdAt");
  const [direction, setDirection] = useState("desc");
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [downloadType, setDownloadType] = useState("row");
  const [downloadFrom, setDownloadFrom] = useState("");
  const [downloadTo, setDownloadTo] = useState("");
  const [uploaders, setUploaders] = useState([]);
  const [downloadUploader, setDownloadUploader] = useState("");
  const [niches, setNiches] = useState([]);
  const [downloadNiche, setDownloadNiche] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const url = new URL(
          `/api/clients/${client.id}/${activeTab === "row" ? "row-data" : activeTab === "enriched" ? "enriched-data" : "uploads"}`,
          window.location.origin
        );
        url.searchParams.set("page", String(page));
        url.searchParams.set("pageSize", String(PAGE_SIZE));
        url.searchParams.set("sort", sort);
        url.searchParams.set("direction", direction);
        if (search.trim()) {
          url.searchParams.set("search", search.trim());
        }
        const res = await fetch(url.toString());
        const json = await res.json();
        setData(json.items || []);
        setTotal(json.total || 0);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [client.id, activeTab, search, page, sort, direction]);

  useEffect(() => {
    async function loadUploaders() {
      try {
        const res = await fetch(`/api/clients/${client.id}/uploaders`);
        const json = await res.json();
        setUploaders(json.uploaders || []);
      } catch (e) {
        console.error(e);
      }
    }
    loadUploaders();
  }, [client.id]);

  useEffect(() => {
    async function loadNiches() {
      try {
        const res = await fetch(`/api/clients/${client.id}/niches`);
        const json = await res.json();
        setNiches(json.niches || []);
      } catch (e) {
        console.error(e);
      }
    }
    loadNiches();
  }, [client.id]);

  function handleSort(column) {
    if (sort === column) {
      setDirection(direction === "asc" ? "desc" : "asc");
    } else {
      setSort(column);
      setDirection("asc");
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            {client.name}
          </h2>
          <p className="text-xs text-slate-400">
            Created {new Date(client.createdAt).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="border border-slate-800 rounded-lg bg-slate-950/40 p-3 flex flex-wrap gap-3 items-end text-xs">
        <div className="space-y-1">
          <label className="text-[11px] text-slate-300">Download type</label>
          <select
            value={downloadType}
            onChange={(e) => setDownloadType(e.target.value)}
            className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs"
          >
            <option value="row">Raw data</option>
            <option value="enriched">Enriched data</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[11px] text-slate-300">From date</label>
          <input
            type="date"
            value={downloadFrom}
            onChange={(e) => setDownloadFrom(e.target.value)}
            className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] text-slate-300">To date</label>
          <input
            type="date"
            value={downloadTo}
            onChange={(e) => setDownloadTo(e.target.value)}
            className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] text-slate-300">Uploader</label>
          <select
            value={downloadUploader}
            onChange={(e) => setDownloadUploader(e.target.value)}
            className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs min-w-[140px]"
          >
            <option value="">All uploaders</option>
            {uploaders.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[11px] text-slate-300">Niche</label>
          <select
            value={downloadNiche}
            onChange={(e) => setDownloadNiche(e.target.value)}
            className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs min-w-[140px]"
          >
            <option value="">All niches</option>
            {niches.map((niche) => (
              <option key={niche.id} value={niche.name}>
                {niche.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => {
            const url = new URL(
              `/api/clients/${client.id}/download`,
              window.location.origin
            );
            url.searchParams.set("dataType", downloadType);
            if (downloadFrom) {
              url.searchParams.set("from", downloadFrom);
            }
            if (downloadTo) {
              url.searchParams.set("to", downloadTo);
            }
            if (downloadUploader) {
              url.searchParams.set("uploader", downloadUploader);
            }
            if (downloadNiche) {
              url.searchParams.set("niche", downloadNiche);
            }
            window.location.href = url.toString();
          }}
          className="ml-auto rounded bg-sky-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-600"
        >
          Download CSV
        </button>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2">
          <TabButton
            active={activeTab === "row"}
            onClick={() => {
              setActiveTab("row");
              setPage(1);
            }}
          >
            Raw data
          </TabButton>
          <TabButton
            active={activeTab === "enriched"}
            onClick={() => {
              setActiveTab("enriched");
              setPage(1);
            }}
          >
            Enriched data
          </TabButton>
          <TabButton
            active={activeTab === "uploads"}
            onClick={() => {
              setActiveTab("uploads");
              setPage(1);
            }}
          >
            Uploads
          </TabButton>
        </div>

        <input
          placeholder="Search..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-56 rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>

      <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/40">
        {activeTab === "row" && (
          <RowDataTable
            items={data}
            loading={loading}
            sort={sort}
            direction={direction}
            onSort={handleSort}
            onViewDetails={setSelectedRow}
          />
        )}
        {activeTab === "enriched" && (
          <EnrichedDataTable
            items={data}
            loading={loading}
            sort={sort}
            direction={direction}
            onSort={handleSort}
            onViewDetails={setSelectedRow}
          />
        )}
        {activeTab === "uploads" && (
          <UploadsTable
            items={data}
            loading={loading}
            sort={sort}
            direction={direction}
            onSort={handleSort}
          />
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>
          Page {page} of {totalPages} ({total} records)
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded border border-slate-700 px-2 py-1 disabled:opacity-40"
          >
            Prev
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded border border-slate-700 px-2 py-1 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {selectedRow && (
        <RowDetailModal row={selectedRow} onClose={() => setSelectedRow(null)} />
      )}
    </div>
  );
}

function HeaderCell({ label, column, sort, direction, onSort }) {
  const active = sort === column;
  return (
    <th
      className="px-3 py-2 text-left font-medium text-xs text-slate-300 cursor-pointer select-none"
      onClick={() => onSort(column)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active && (
          <span className="text-[10px] text-slate-400">
            {direction === "asc" ? "▲" : "▼"}
          </span>
        )}
      </span>
    </th>
  );
}

function RowDataTable({ items, loading, sort, direction, onSort, onViewDetails }) {
  return (
    <table className="min-w-full text-xs">
      <thead className="bg-slate-900/60 border-b border-slate-800">
        <tr>
          <HeaderCell
            label="Company Name"
            column="companyName"
            sort={sort}
            direction={direction}
            onSort={onSort}
          />
          <HeaderCell
            label="Website"
            column="normalizedWebsite"
            sort={sort}
            direction={direction}
            onSort={onSort}
          />
          <HeaderCell
            label="Category"
            column="category"
            sort={sort}
            direction={direction}
            onSort={onSort}
          />
          <HeaderCell
            label="Rating"
            column="rating"
            sort={sort}
            direction={direction}
            onSort={onSort}
          />
          <th className="px-3 py-2 text-left font-medium text-xs text-slate-300">
            Niche
          </th>
          <th className="px-3 py-2 text-left font-medium text-xs text-slate-300">
            Uploader
          </th>
          <HeaderCell
            label="Created"
            column="createdAt"
            sort={sort}
            direction={direction}
            onSort={onSort}
          />
          <th className="px-3 py-2 text-right font-medium text-xs text-slate-300">
            Actions
          </th>
        </tr>
      </thead>
      <tbody>
        {loading && (
          <tr>
            <td
              colSpan={8}
              className="px-3 py-4 text-center text-slate-400"
            >
              Loading...
            </td>
          </tr>
        )}
        {!loading && !items.length && (
          <tr>
            <td
              colSpan={8}
              className="px-3 py-4 text-center text-slate-400"
            >
              No raw data.
            </td>
          </tr>
        )}
        {!loading &&
          items.map((row) => (
            <tr
              key={row.id}
              className="border-t border-slate-800 hover:bg-slate-900/40"
            >
              <td className="px-3 py-2 text-slate-100">{row.companyName || "-"}</td>
              <td className="px-3 py-2 text-slate-300">
                {row.normalizedWebsite || row.website || "-"}
              </td>
              <td className="px-3 py-2 text-slate-200">{row.category || "-"}</td>
              <td className="px-3 py-2 text-slate-200">{row.rating || "-"}</td>
              <td className="px-3 py-2 text-slate-200">{row.upload?.niche?.name || "-"}</td>
              <td className="px-3 py-2 text-slate-200">{row.upload?.uploader?.name || "-"}</td>
              <td className="px-3 py-2 text-slate-400">
                {new Date(row.createdAt).toLocaleString()}
              </td>
              <td className="px-3 py-2 text-right">
                <button
                  type="button"
                  className="text-sky-400 hover:text-sky-300"
                  onClick={() => onViewDetails(row)}
                >
                  View
                </button>
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}

function EnrichedDataTable({
  items,
  loading,
  sort,
  direction,
  onSort,
  onViewDetails
}) {
  return (
    <table className="min-w-full text-xs">
      <thead className="bg-slate-900/60 border-b border-slate-800">
        <tr>
          <HeaderCell
            label="Business"
            column="businessName"
            sort={sort}
            direction={direction}
            onSort={onSort}
          />
          <HeaderCell
            label="Full name"
            column="fullName"
            sort={sort}
            direction={direction}
            onSort={onSort}
          />
          <HeaderCell
            label="Job title"
            column="jobTitle"
            sort={sort}
            direction={direction}
            onSort={onSort}
          />
          <HeaderCell
            label="Website"
            column="normalizedWebsite"
            sort={sort}
            direction={direction}
            onSort={onSort}
          />
          <th className="px-3 py-2 text-left font-medium text-xs text-slate-300">
            Niche
          </th>
          <th className="px-3 py-2 text-left font-medium text-xs text-slate-300">
            Uploader
          </th>
          <HeaderCell
            label="Created"
            column="createdAt"
            sort={sort}
            direction={direction}
            onSort={onSort}
          />
          <th className="px-3 py-2 text-right font-medium text-xs text-slate-300">
            Actions
          </th>
        </tr>
      </thead>
      <tbody>
        {loading && (
          <tr>
            <td colSpan={8} className="px-3 py-4 text-center text-slate-400">
              Loading...
            </td>
          </tr>
        )}
        {!loading && !items.length && (
          <tr>
            <td colSpan={8} className="px-3 py-4 text-center text-slate-400">
              No enriched data.
            </td>
          </tr>
        )}
        {!loading &&
          items.map((row) => (
            <tr
              key={row.id}
              className="border-t border-slate-800 hover:bg-slate-900/40"
            >
              <td className="px-3 py-2 text-slate-100">
                {row.businessName}
              </td>
              <td className="px-3 py-2 text-slate-200">
                {row.fullName || row.firstName}
              </td>
              <td className="px-3 py-2 text-slate-300">
                {row.jobTitle || "-"}
              </td>
              <td className="px-3 py-2 text-slate-300">
                {row.normalizedWebsite || "-"}
              </td>
              <td className="px-3 py-2 text-slate-200">
                {row.upload?.niche?.name || "-"}
              </td>
              <td className="px-3 py-2 text-slate-200">
                {row.upload?.uploader?.name || "-"}
              </td>
              <td className="px-3 py-2 text-slate-400">
                {new Date(row.createdAt).toLocaleString()}
              </td>
              <td className="px-3 py-2 text-right">
                <button
                  type="button"
                  className="text-sky-400 hover:text-sky-300"
                  onClick={() => onViewDetails(row)}
                >
                  View
                </button>
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}

function UploadsTable({ items, loading, sort, direction, onSort }) {
  return (
    <table className="min-w-full text-xs">
      <thead className="bg-slate-900/60 border-b border-slate-800">
        <tr>
          <HeaderCell
            label="Date"
            column="uploadDate"
            sort={sort}
            direction={direction}
            onSort={onSort}
          />
          <HeaderCell
            label="Type"
            column="dataType"
            sort={sort}
            direction={direction}
            onSort={onSort}
          />
          <HeaderCell
            label="Niche"
            column="niche"
            sort={sort}
            direction={direction}
            onSort={onSort}
          />
          <HeaderCell
            label="Uploader"
            column="uploaderName"
            sort={sort}
            direction={direction}
            onSort={onSort}
          />
          <HeaderCell
            label="Rows"
            column="rowCount"
            sort={sort}
            direction={direction}
            onSort={onSort}
          />
          <HeaderCell
            label="Status"
            column="status"
            sort={sort}
            direction={direction}
            onSort={onSort}
          />
        </tr>
      </thead>
      <tbody>
        {loading && (
          <tr>
            <td colSpan={6} className="px-3 py-4 text-center text-slate-400">
              Loading...
            </td>
          </tr>
        )}
        {!loading && !items.length && (
          <tr>
            <td colSpan={6} className="px-3 py-4 text-center text-slate-400">
              No uploads yet.
            </td>
          </tr>
        )}
        {!loading &&
          items.map((u) => (
            <tr
              key={u.id}
              className="border-t border-slate-800 hover:bg-slate-900/40"
            >
              <td className="px-3 py-2 text-slate-100">
                {new Date(u.uploadDate).toLocaleString()}
              </td>
              <td className="px-3 py-2 capitalize text-slate-200">
                {u.dataType}
              </td>
              <td className="px-3 py-2 text-slate-200">{u.niche?.name || "-"}</td>
              <td className="px-3 py-2 text-slate-200">{u.uploader?.name || "-"}</td>
              <td className="px-3 py-2 text-slate-200">
                {u.rowCount ?? "-"}
              </td>
              <td className="px-3 py-2">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    u.status === "success"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/40"
                      : "bg-red-500/10 text-red-400 border border-red-500/40"
                  }`}
                >
                  {u.status}
                </span>
                {u.errorMessage && (
                  <span className="ml-2 text-[10px] text-red-400">
                    {u.errorMessage}
                  </span>
                )}
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}

