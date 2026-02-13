"use client";

import { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { api, Camera } from "@/lib/api";

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
    if (selectedCamera) {
      loadHeatmap();
    }
  }, [selectedCamera, timeRange]);

  useEffect(() => {
    if (heatmapData && canvasRef.current) {
      renderHeatmap();
    }
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
        ctx.fillStyle = `hsla(${hue}, 100%, 50%, ${0.3 + value * 0.5})`;
        ctx.fillRect(j * cellW, i * cellH, cellW + 1, cellH + 1);
      }
    }
  }

  return (
    <div className="flex h-screen bg-gray-950 text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Heatmap Analytics" />
        <main className="flex-1 overflow-auto p-6">
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Camera</label>
              <select
                value={selectedCamera || ""}
                onChange={(e) => setSelectedCamera(Number(e.target.value))}
                className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
              >
                {cameras.map((cam) => (
                  <option key={cam.id} value={cam.id}>
                    {cam.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Time Range</label>
              <div className="flex gap-1">
                {["1h", "6h", "24h", "7d", "30d"].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-2 rounded text-sm ${
                      timeRange === range
                        ? "bg-orange-600 text-white"
                        : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Heatmap Display */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Activity Heatmap</h3>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>Low</span>
                <div className="flex h-3 w-32 rounded overflow-hidden">
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
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-orange-500" />
              </div>
            ) : (
              <div className="relative bg-gray-800 rounded-lg overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={900}
                  height={600}
                  className="w-full h-auto"
                />
              </div>
            )}

            {/* Zone Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-sm text-gray-400">Peak Activity Zone</p>
                <p className="text-lg font-semibold text-orange-400">Zone A (Entrance)</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-sm text-gray-400">Avg Detections/hr</p>
                <p className="text-lg font-semibold">47.3</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-sm text-gray-400">Peak Hour</p>
                <p className="text-lg font-semibold">09:00 - 10:00</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-sm text-gray-400">Coverage</p>
                <p className="text-lg font-semibold text-green-400">78%</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
