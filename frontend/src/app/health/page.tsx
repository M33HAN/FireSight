"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Activity, Server, Database, Cpu, HardDrive, Zap } from "lucide-react";

interface SystemHealth {
  cpu_percent: number;
  memory_percent: number;
  disk_percent: number;
  gpu_utilization: number;
  gpu_memory_percent: number;
  uptime_seconds: number;
  active_streams: number;
  inference_fps: number;
  db_connections: number;
  redis_connected: boolean;
  minio_connected: boolean;
}

export default function HealthPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadHealth();
    if (autoRefresh) {
      const interval = setInterval(loadHealth, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  async function loadHealth() {
    try {
      const data = await api.getHealth();
      setHealth(data);
    } catch (err) {
      console.error("Failed to load health:", err);
    } finally {
      setLoading(false);
    }
  }

  function formatUptime(seconds: number): string {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return d > 0 ? d + "d " + h + "h " + m + "m" : h + "h " + m + "m";
  }

  function getBarColor(value: number) {
    if (value >= 90) return "bg-red-500";
    if (value >= 70) return "bg-yellow-500";
    return "bg-emerald-500";
  }

  function getTextColor(value: number) {
    if (value >= 90) return "text-red-400";
    if (value >= 70) return "text-yellow-400";
    return "text-emerald-400";
  }

  function ProgressBar({ value, label }: { value: number; label: string }) {
    return (
      <div>
        <div className="flex justify-between text-sm mb-1.5">
          <span className="text-gray-400">{label}</span>
          <span className={getTextColor(value)}>{value.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-white/5 rounded-full h-2">
          <div
            className={getBarColor(value) + " rounded-full h-2 transition-all duration-500"}
            style={{ width: Math.min(100, value) + "%" }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Health</h1>
          <p className="text-gray-500 mt-1 text-sm">Monitor system resources and service status</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className={"w-2.5 h-2.5 rounded-full " + (health ? "bg-emerald-500 animate-pulse" : "bg-red-500")} />
            <span className="text-sm text-gray-400">{health ? "Online" : "Connecting..."}</span>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-gray-700 peer-checked:bg-orange-500 rounded-full transition-colors relative">
              <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full peer-checked:translate-x-4 transition-transform" />
            </div>
            <span className="text-sm text-gray-400">Auto-refresh</span>
          </label>
        </div>
      </div>

      {loading && !health ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
        </div>
      ) : health ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-white/5 p-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-orange-500" />
                System Resources
              </h3>
              <div className="space-y-4">
                <ProgressBar value={health.cpu_percent} label="CPU Usage" />
                <ProgressBar value={health.memory_percent} label="Memory Usage" />
                <ProgressBar value={health.disk_percent} label="Disk Usage" />
              </div>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-white/5 p-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-500" />
                GPU (Apple Neural Engine)
              </h3>
              <div className="space-y-4">
                <ProgressBar value={health.gpu_utilization} label="GPU Utilization" />
                <ProgressBar value={health.gpu_memory_percent} label="GPU Memory" />
                <div className="flex justify-between text-sm mt-3 pt-3 border-t border-white/5">
                  <span className="text-gray-400">Inference FPS</span>
                  <span className="text-emerald-400 font-mono">{health.inference_fps.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-white/5 p-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
              <Server className="w-4 h-4 text-orange-500" />
              Service Status
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { name: "Redis", ok: health.redis_connected, detail: health.redis_connected ? "Connected" : "Disconnected" },
                { name: "MinIO", ok: health.minio_connected, detail: health.minio_connected ? "Connected" : "Disconnected" },
                { name: "PostgreSQL", ok: true, detail: health.db_connections + " connections" },
                { name: "Detection", ok: true, detail: health.active_streams + " streams" },
              ].map((svc) => (
                <div key={svc.name} className="flex items-center gap-3 bg-white/[0.03] rounded-lg p-4 border border-white/5">
                  <span className={"w-2.5 h-2.5 rounded-full " + (svc.ok ? "bg-emerald-500" : "bg-red-500")} />
                  <div>
                    <p className="text-sm font-medium text-gray-300">{svc.name}</p>
                    <p className="text-xs text-gray-500">{svc.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: "Uptime", value: formatUptime(health.uptime_seconds), icon: Activity },
              { label: "Active Streams", value: String(health.active_streams), icon: Server },
              { label: "DB Connections", value: String(health.db_connections), icon: Database },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-white/5 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-gray-500" />
                    <p className="text-sm text-gray-400">{stat.label}</p>
                  </div>
                  <p className="text-xl font-semibold">{stat.value}</p>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-white/5 p-12 text-center">
          <Server className="w-12 h-12 mx-auto mb-3 text-gray-700" />
          <p className="text-gray-500">Unable to connect to the system</p>
          <p className="text-gray-600 text-sm mt-1">Please check the backend service is running</p>
        </div>
      )}
    </div>
  );
}
