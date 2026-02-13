"use client";

import { useEffect, useState } from "react";
import { BarChart3, AlertTriangle, Camera, Activity, TrendingUp } from "lucide-react";
import OnboardingWizard from "@/components/OnboardingWizard";

interface DashboardStats {
  total_incidents: number;
  incidents_today: number;
  active_cameras: number;
  detection_sessions: number;
  category_breakdown: Record<string, number>;
  severity_breakdown: Record<string, number>;
  hourly_data: any[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const hasCompleted = localStorage.getItem("firesight_onboarding_complete");
    if (!hasCompleted) setShowOnboarding(true);
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const res = await fetch(API_BASE + "/api/incidents/dashboard");
      if (!res.ok) throw new Error("API returned " + res.status);
      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      console.error("Failed to load dashboard:", err);
      setError(err.message);
      setStats({
        total_incidents: 0,
        incidents_today: 0,
        active_cameras: 0,
        detection_sessions: 0,
        category_breakdown: {},
        severity_breakdown: {},
        hourly_data: [],
      });
    } finally {
      setLoading(false);
    }
  }

  function handleOnboardingComplete() {
    localStorage.setItem("firesight_onboarding_complete", "true");
    setShowOnboarding(false);
    loadDashboard();
  }

  if (showOnboarding) {
    return <OnboardingWizard onComplete={handleOnboardingComplete} />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: "Total Incidents", value: stats?.total_incidents ?? 0, icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" },
    { label: "Today", value: stats?.incidents_today ?? 0, icon: TrendingUp, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
    { label: "Active Cameras", value: stats?.active_cameras ?? 0, icon: Camera, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
    { label: "Active Sessions", value: stats?.detection_sessions ?? 0, icon: Activity, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-gray-500 mt-1 text-sm">Real-time AI video analytics overview</p>
      </div>

      {error && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-amber-400 text-sm">
          Backend API not reachable — showing default values. Connect cameras to begin.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={"rounded-xl border p-5 backdrop-blur-sm transition-all hover:scale-[1.02] " + card.bg + " " + card.border}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 font-medium">{card.label}</p>
                  <p className={"text-3xl font-bold mt-1 " + card.color}>{card.value}</p>
                </div>
                <div className={"p-3 rounded-lg " + card.bg}>
                  <Icon className={"w-6 h-6 " + card.color} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {stats?.category_breakdown && Object.keys(stats.category_breakdown).length > 0 && (
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-white/5 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-orange-500" />
            Detection Categories
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(stats.category_breakdown).map(([category, count]) => (
              <div key={category} className="bg-white/5 rounded-lg p-4 text-center border border-white/5 hover:border-orange-500/30 transition-all">
                <div className="text-2xl font-bold text-orange-400">{count}</div>
                <div className="text-xs text-gray-500 capitalize mt-1">{category}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-white/5 p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          Recent Incidents
        </h2>
        <div className="text-center py-12 text-gray-600">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-700" />
          <p className="text-gray-500">No incidents detected yet</p>
          <p className="text-gray-600 text-sm mt-1">Connect a camera to start AI-powered monitoring</p>
        </div>
      </div>
    </div>
  );
}
