"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { api } from "@/lib/api";

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
    return d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m`;
  }

  function getStatusColor(value: number, thresholds = { warn: 70, danger: 90 }) {
    if (value >= thresholds.danger) return "text-red-500";
    if (value >= thresholds.warn) return "text-yellow-500";
    return "text-green-500";
  }

  function ProgressBar({ value, label }: { value: number; label: string }) {
    const color =
      value >= 90 ? "bg-red-500" : value >= 70 ? "bg-yellow-500" : "bg-green-500";
    return (
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-400">{label}</span>
          <span className={getStatusColor(value)}>{value.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div
            className={`${color} rounded-full h-2 transition-all duration-500`}
            style={{ width: `${Math.min(100, value)}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-950 text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="System Health" />
        <main className="flex-1 overflow-auto p-6">
          {/* Controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full ${health ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
              <span className="text-sm text-gray-400">
                {health ? "System Online" : "Connecting..."}
              </span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-600"
              />
              <span className="text-sm text-gray-400">Auto-refresh (5s)</span>
            </label>
          </div>

          {loading && !health ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-orange-500" />
            </div>
          ) : health ? (
            <div className="space-y-6">
              {/* Resource Usage */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">System Resources</h3>
                  <div className="space-y-4">
                    <ProgressBar value={health.cpu_percent} label="CPU Usage" />
                    <ProgressBar value={health.memory_percent} label="Memory Usage" />
                    <ProgressBar value={health.disk_percent} label="Disk Usage" />
                  </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">GPU (Apple Neural Engine)</h3>
                  <div className="space-y-4">
                    <ProgressBar value={health.gpu_utilization} label="GPU Utilization" />
                    <ProgressBar value={health.gpu_memory_percent} label="GPU Memory" />
                    <div className="flex justify-between text-sm mt-2">
                      <span className="text-gray-400">Inference FPS</span>
                      <span className="text-green-400 font-mono">{health.inference_fps.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Status */}
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Service Status</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-3 bg-gray-800 rounded-lg p-4">
                    <span className={`w-3 h-3 rounded-full ${health.redis_connected ? "bg-green-500" : "bg-red-500"}`} />
                    <div>
                      <p className="text-sm font-medium">Redis</p>
                      <p className="text-xs text-gray-400">{health.redis_connected ? "Connected" : "Disconnected"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-800 rounded-lg p-4">
                    <span className={`w-3 h-3 rounded-full ${health.minio_connected ? "bg-green-500" : "bg-red-500"}`} />
                    <div>
                      <p className="text-sm font-medium">MinIO</p>
                      <p className="text-xs text-gray-400">{health.minio_connected ? "Connected" : "Disconnected"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-800 rounded-lg p-4">
                    <span className="w-3 h-3 rounded-full bg-green-500" />
                    <div>
                      <p className="text-sm font-medium">PostgreSQL</p>
                      <p className="text-xs text-gray-400">{health.db_connections} connections</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-800 rounded-lg p-4">
                    <span className="w-3 h-3 rounded-full bg-green-500" />
                    <div>
                      <p className="text-sm font-medium">Detection Engine</p>
                      <p className="text-xs text-gray-400">{health.active_streams} streams</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                  <p className="text-sm text-gray-400">Uptime</p>
                  <p className="text-xl font-semibold">{formatUptime(health.uptime_seconds)}</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                  <p className="text-sm text-gray-400">Active Streams</p>
                  <p className="text-xl font-semibold">{health.active_streams}</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                  <p className="text-sm text-gray-400">DB Connections</p>
                  <p className="text-xl font-semibold">{health.db_connections}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400 py-12">
              <p>Unable to connect to the system. Please check the backend service.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
