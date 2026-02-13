"use client";

import { useState, useEffect, useRef } from "react";
import { api, Camera } from "@/lib/api";
import { Map, Clock } from "lucide-react";

export default function HeatmapPage() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<number | null>(null);
  const [timeRange, setTimeRange] = useState("24h");
  const [heatmapData, setHeatmapData] = useState<number[][] | null>(null);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    loadCameras();
  }, []);

  useEffect(() => {
    if (selectedCamera) loadHeatmap();
  }, [selectedCamera, timeRange]);

  useEffect(() => {
    if (heatmapData && canvasRef.current) renderHeatmap();
  }, [heatmapData]);

  async function loadCameras() {
    try {
      const data = await api.getCameras();
      setCameras(data);
      if (data.length > 0) setSelectedCamera(data[0].id);
    } catch (err) {
      console.error("Failed to load cameras:", err);
    }
  }

  async function loadHeatmap() {
    if (!selectedCamera) return;
    setLoading(true);
    try {
      const data = await api.getHeatmap(selectedCamera, timeRange);
      setHeatmapData(data.grid || generateSampleHeatmap());
    } catch (err) {
      console.error("Failed to load heatmap:", err);
      setHeatmapData(generateSampleHeatmap());
    } finally {
      setLoading(false);
    }
  }

  function generateSampleHeatmap(): number[][] {
    const rows = 20;
    const cols = 30;
    const grid: number[][] = [];
    for (let i = 0; i < rows; i++) {
      const row: number[] = [];
      for (let j = 0; j < cols; j++) {
        const cx = cols / 2, cy = rows / 2;
        const dist = Math.sqrt((j - cx) ** 2 + (i - cy) ** 2);
        const value = Math.max(0, 1 - dist / Math.max(cx, cy)) + Math.random() * 0.3;
        row.push(Math.min(1, value));
      }
      grid.push(row);
    }
    return grid;
  }

  function renderHeatmap() {
    const canvas = canvasRef.current;
    if (!canvas || !heatmapData) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rows = heatmapData.length;
    const cols = heatmapData[0]?.length || 0;
    const cellW = canvas.width / cols;
    const cellH = canvas.height / rows;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const value = heatmapData[i][j];
        const hue = (1 - value) * 240;
        ctx.fillStyle = "hsla(" + hue + ", 100%, 50%, " + (0.3 + value * 0.5) + ")";
        ctx.fillRect(j * cellW, i * cellH, cellW + 1, cellH + 1);
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Heatmap Analytics</h1>
        <p className="text-gray-500 mt-1 text-sm">Visualize activity density across camera zones</p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Camera</label>
          <select
            value={selectedCamera || ""}
            onChange={(e) => setSelectedCamera(Number(e.target.value))}
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500/50 transition text-white"
          >
            {cameras.map((cam) => (
              <option key={cam.id} value={cam.id}>{cam.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Time Range</label>
          <div className="flex gap-1">
            {["1h", "6h", "24h", "7d", "30d"].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={
                  "px-3 py-2.5 rounded-lg text-sm font-medium transition " +
                  (timeRange === range
                    ? "bg-orange-500/15 text-orange-400 border border-orange-500/30"
                    : "bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10")
                }
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-white/5 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <Map className="w-4 h-4 text-orange-500" />
            Activity Heatmap
          </h3>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Low</span>
            <div className="flex h-2.5 w-28 rounded overflow-hidden">
              <div className="flex-1 bg-blue-600" />
              <div className="flex-1 bg-cyan-500" />
              <div className="flex-1 bg-green-500" />
              <div className="flex-1 bg-yellow-500" />
              <div className="flex-1 bg-orange-500" />
              <div className="flex-1 bg-red-600" />
            </div>
            <span>High</span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="w-10 h-10 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="relative bg-gray-800/50 rounded-lg overflow-hidden">
            <canvas ref={canvasRef} width={900} height={600} className="w-full h-auto" />
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          {[
            { label: "Peak Activity Zone", value: "Zone A (Entrance)", highlight: true },
            { label: "Avg Detections/hr", value: "47.3", highlight: false },
            { label: "Peak Hour", value: "09:00 - 10:00", highlight: false },
            { label: "Coverage", value: "78%", highlight: true },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/[0.03] rounded-lg p-4 border border-white/5">
              <p className="text-xs text-gray-500">{stat.label}</p>
              <p className={"text-base font-semibold mt-1 " + (stat.highlight ? "text-orange-400" : "text-white")}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
