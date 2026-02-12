"use client";

import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import IncidentTable from "@/components/IncidentTable";
import SearchBar from "@/components/SearchBar";
import { api, Incident } from "@/lib/api";

const CATEGORIES = [
  "all", "human", "vehicle", "fire", "smoke", "bicycle",
  "plant", "ppe", "accident", "intrusion", "fall"
];

const SEVERITIES = ["all", "critical", "high", "medium", "low"];

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 25;

  const loadIncidents = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        skip: (page - 1) * pageSize,
        limit: pageSize,
      };
      if (category !== "all") params.category = category;
      if (severity !== "all") params.severity = severity;

      const data = await api.getIncidents(params);
      setIncidents(data);
      setTotalPages(Math.max(1, Math.ceil(data.length / pageSize)));
    } catch (err) {
      console.error("Failed to load incidents:", err);
    } finally {
      setLoading(false);
    }
  }, [page, category, severity]);

  useEffect(() => {
    loadIncidents();
  }, [loadIncidents]);

  const filteredIncidents = searchQuery
    ? incidents.filter(
        (inc) =>
          inc.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          String(inc.camera_id).includes(searchQuery)
      )
    : incidents;

  return (
    <div className="flex h-screen bg-gray-950 text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Incidents" />
        <main className="flex-1 overflow-auto p-6">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search incidents..."
            />

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-400">Category:</label>
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-orange-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-400">Severity:</label>
              <select
                value={severity}
                onChange={(e) => { setSeverity(e.target.value); setPage(1); }}
                className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-orange-500"
              >
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={loadIncidents}
              className="ml-auto px-4 py-1.5 bg-orange-600 hover:bg-orange-700 rounded text-sm font-medium transition"
            >
              Refresh
            </button>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400">Total</p>
              <p className="text-2xl font-bold">{filteredIncidents.length}</p>
            </div>
            <div className="bg-gray-900 border border-red-900/50 rounded-lg p-4">
              <p className="text-sm text-red-400">Critical</p>
              <p className="text-2xl font-bold text-red-500">
                {filteredIncidents.filter((i) => i.severity === "critical").length}
              </p>
            </div>
            <div className="bg-gray-900 border border-orange-900/50 rounded-lg p-4">
              <p className="text-sm text-orange-400">High</p>
              <p className="text-2xl font-bold text-orange-500">
                {filteredIncidents.filter((i) => i.severity === "high").length}
              </p>
            </div>
            <div className="bg-gray-900 border border-yellow-900/50 rounded-lg p-4">
              <p className="text-sm text-yellow-400">Medium</p>
              <p className="text-2xl font-bold text-yellow-500">
                {filteredIncidents.filter((i) => i.severity === "medium").length}
              </p>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-orange-500" />
            </div>
          ) : (
            <>
              <IncidentTable incidents={filteredIncidents} />

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-400">
                  Showing {filteredIncidents.length} incidents
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 bg-gray-800 rounded text-sm disabled:opacity-50 hover:bg-gray-700"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-400">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 bg-gray-800 rounded text-sm disabled:opacity-50 hover:bg-gray-700"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
