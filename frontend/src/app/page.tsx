"use client";

import { useEffect, useState } from "react";
import { BarChart3, AlertTriangle, Camera, Activity, TrendingUp } from "lucide-react";
import OnboardingWizard from "@/components/OnboardingWizard";

interface DashboardStats {
    total_incidents: number; incidents_today: number; active_cameras: number;
    detection_sessions: number; category_breakdown: Record<string, number>;
    severity_breakdown: Record<string, number>; hourly_data: any[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function Dashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
        loadDashboard();
        if (typeof window !== "undefined" && !localStorage.getItem("firesight_onboarded")) { setShowWizard(true); }
  }, []);

  async function loadDashboard() {
        try { const res = await fetch(API_BASE + "/api/incidents/dashboard"); if (!res.ok) throw new Error("API returned " + res.status); const data = await res.json(); setStats(data);
            } catch (err: any) { console.error("Failed to load dashboard:", err); setError(err.message);
                               } finally { setLoading(false); }
  }

  function handleWizardComplete() { localStorage.setItem("firesight_onboarded", "true"); setShowWizard(false); }

  if (showWizard) { return <OnboardingWizard onComplete={handleWizardComplete} />; }

  const statCards = stats ? [
    { label: "Total Incidents", value: stats.total_incidents, icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10" },
    { label: "Today", value: stats.incidents_today, icon: Activity, color: "text-orange-400", bg: "bg-orange-500/10" },
    { label: "Active Cameras", value: stats.active_cameras, icon: Camera, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Detection Sessions", value: stats.detection_sessions, icon: TrendingUp, color: "text-blue-400", bg: "bg-blue-500/10" },
      ] : [];

  return (
        <div className="space-y-6">
              <div className="flex items-center justify-between">
                      <div><h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>h1><p className="text-gray-500 mt-1 text-sm">Overview of your FireSight analytics platform</p>p></div>div>
                      <button onClick={() => setShowWizard(true)} className="text-xs text-gray-500 hover:text-orange-400 transition-colors">Setup Wizard</button>button>
              </div>div>
        
          {loading ? (<div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" /></div>div>
                            ) : error ? (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center"><AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-400" /><p className="text-red-400 text-sm">{error}</p>p><button onClick={loadDashboard} className="mt-3 text-xs text-orange-400 hover:text-orange-300">Retry</button>button></div>div>
                ) : stats ? (<>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{statCards.map(card => (
                    <div key={card.label} className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-white/5 p-5"><div className="flex items-center justify-between"><div><p className="text-xs text-gray-500">{card.label}</p>p><p className="text-2xl font-bold mt-1">{card.value}</p>p></div>div><div className={`${card.bg} rounded-lg p-2.5`}><card.icon className={`w-5 h-5 ${card.color}`} /></div>div></div>div></div>div>
                  ))}</div>div>
                
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                  <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-white/5 p-6"><h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-orange-500" /> Category Breakdown</h3>h3>
                                              <div className="space-y-3">{Object.entries(stats.category_breakdown).map(([cat, count]) => (<div key={cat}><div className="flex justify-between text-sm mb-1"><span className="text-gray-400 capitalize">{cat.replace(/_/g, " ")}</span>span><span className="text-gray-300 font-mono text-xs">{count}</span>span></div>div><div className="w-full bg-white/5 rounded-full h-1.5"><div className="bg-orange-500 rounded-full h-1.5 transition-all" style={{ width: `${Math.min(100, (count / Math.max(...Object.values(stats.category_breakdown))) * 100)}%` }} /></div>div></div>div>))}</div>div>
                                  </div>div>
                                  <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-white/5 p-6"><h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-orange-500" /> Severity Distribution</h3>h3>
                                              <div className="space-y-3">{Object.entries(stats.severity_breakdown).map(([sev, count]) => { const colors: Record<string, string> = { critical: "bg-red-500", high: "bg-orange-500", medium: "bg-amber-500", low: "bg-emerald-500" }; return (<div key={sev}><div className="flex justify-between text-sm mb-1"><span className="text-gray-400 capitalize">{sev}</span>span><span className="text-gray-300 font-mono text-xs">{count}</span>span></div>div><div className="w-full bg-white/5 rounded-full h-1.5"><div className={`${colors[sev] || "bg-gray-500"} rounded-full h-1.5 transition-all`} style={{ width: `${Math.min(100, (count / Math.max(...Object.values(stats.severity_breakdown))) * 100)}%` }} /></div>div></div>div>); })}</div>div>
                                  </div>div>
                        </div>div>
                </>>) : null}
        </div>div>
      );
}</></div>
