"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16"
];

export default function AnalyticsPage() {
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadClients() {
      try {
        const res = await fetch("/api/clients");
        const json = await res.json();
        setClients(json.clients || []);
        if (json.clients && json.clients.length > 0) {
          setSelectedClientId(json.clients[0].id);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadClients();
  }, []);

  useEffect(() => {
    if (!selectedClientId) return;

    async function loadAnalytics() {
      setLoading(true);
      try {
        const res = await fetch(`/api/analytics?clientId=${selectedClientId}`);
        const json = await res.json();
        setAnalytics(json);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, [selectedClientId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-sm text-slate-400">
            View data insights by client, date, niche, and uploader
          </p>
        </div>
        <div className="w-64">
          <label className="block text-xs text-slate-300 mb-1">Client</label>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="text-center py-12 text-slate-400">Loading analytics...</div>
      )}

      {!loading && analytics && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
              <div className="text-xs text-slate-400 mb-1">Total Uploads</div>
              <div className="text-2xl font-semibold">
                {analytics.totals?.uploads || 0}
              </div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
              <div className="text-xs text-slate-400 mb-1">Raw Data Records</div>
              <div className="text-2xl font-semibold">
                {analytics.totals?.rowData || 0}
              </div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
              <div className="text-xs text-slate-400 mb-1">Enriched Records</div>
              <div className="text-2xl font-semibold">
                {analytics.totals?.enrichedData || 0}
              </div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
              <div className="text-xs text-slate-400 mb-1">Total Records</div>
              <div className="text-2xl font-semibold">
                {analytics.totals?.totalRows || 0}
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Uploads by Date */}
            <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
              <h3 className="text-sm font-semibold mb-4">Uploads Over Time</h3>
              {analytics.byDate && analytics.byDate.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.byDate}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="date"
                      stroke="#94a3b8"
                      style={{ fontSize: "11px" }}
                    />
                    <YAxis stroke="#94a3b8" style={{ fontSize: "11px" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: "4px"
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="uploads"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Uploads"
                    />
                    <Line
                      type="monotone"
                      dataKey="totalRows"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Total Rows"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-slate-400 text-sm">
                  No data available
                </div>
              )}
            </div>

            {/* Uploads by Niche */}
            <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
              <h3 className="text-sm font-semibold mb-4">Data by Niche</h3>
              {analytics.byNiche && analytics.byNiche.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.byNiche}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="niche"
                      stroke="#94a3b8"
                      style={{ fontSize: "11px" }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis stroke="#94a3b8" style={{ fontSize: "11px" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: "4px"
                      }}
                    />
                    <Legend />
                    <Bar dataKey="totalRows" fill="#3b82f6" name="Total Rows" />
                    <Bar dataKey="uploads" fill="#10b981" name="Uploads" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-slate-400 text-sm">
                  No data available
                </div>
              )}
            </div>

            {/* Uploads by Uploader */}
            <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
              <h3 className="text-sm font-semibold mb-4">Data by Uploader</h3>
              {analytics.byUploader && analytics.byUploader.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.byUploader}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="uploader"
                      stroke="#94a3b8"
                      style={{ fontSize: "11px" }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis stroke="#94a3b8" style={{ fontSize: "11px" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: "4px"
                      }}
                    />
                    <Legend />
                    <Bar dataKey="totalRows" fill="#8b5cf6" name="Total Rows" />
                    <Bar dataKey="uploads" fill="#ec4899" name="Uploads" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-slate-400 text-sm">
                  No data available
                </div>
              )}
            </div>

            {/* Data Type Distribution */}
            <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
              <h3 className="text-sm font-semibold mb-4">Data Type Distribution</h3>
              {analytics.totals && (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        {
                          name: "Raw Data",
                          value: analytics.totals.rowData || 0
                        },
                        {
                          name: "Enriched Data",
                          value: analytics.totals.enrichedData || 0
                        }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: "Raw Data", value: analytics.totals.rowData || 0 },
                        {
                          name: "Enriched Data",
                          value: analytics.totals.enrichedData || 0
                        }
                      ].map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: "4px"
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}

      {!loading && !analytics && selectedClientId && (
        <div className="text-center py-12 text-slate-400">
          No analytics data available for this client.
        </div>
      )}
    </div>
  );
}
