"use client";

import { useEffect, useState } from "react";
import StatsCards from "@/components/StatsCards";
import IncidentTable from "@/components/IncidentTable";
import { api } from "@/lib/api";

interface DashboardStats {
  total_incidents: number;
  incidents_today: number;
  active_cameras: number;
  detection_sessions: number;
  category_breakdown: Record<string, number>;
  severity_breakdown: Record<string, number>;
  hourly_data: any[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const data = await api.get("/incidents/dashboard");
      setStats(data);
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-firesight-orange text-xl">Loading FireSight Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-400 mt-1">Real-time AI video analytics overview</p>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Category Breakdown */}
      {stats?.category_breakdown && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Detection Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(stats.category_breakdown).map(([category, count]) => (
              <div
                key={category}
                className="bg-dark-panel rounded-lg p-4 text-center"
              >
                <div className="text-2xl font-bold text-firesight-orange">{count}</div>
                <div className="text-sm text-gray-400 capitalize mt-1">{category}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Incidents */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Recent Incidents</h2>
        <IncidentTable />
      </div>
    </div>
  );
}
