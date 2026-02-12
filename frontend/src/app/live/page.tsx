"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import LiveFeed from "@/components/LiveFeed";
import { api, Camera } from "@/lib/api";

export default function LivePage() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [layout, setLayout] = useState<"single" | "grid-2x2" | "grid-3x3">("grid-2x2");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCameras();
  }, []);

  async function loadCameras() {
    try {
      const data = await api.getCameras();
      setCameras(data);
      if (data.length > 0) setSelectedCamera(data[0]);
    } catch (err) {
      console.error("Failed to load cameras:", err);
    } finally {
      setLoading(false);
    }
  }

  const activeCameras = cameras.filter((c) => c.status === "active");

  const gridCols = {
    single: "grid-cols-1",
    "grid-2x2": "grid-cols-1 md:grid-cols-2",
    "grid-3x3": "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  };

  return (
    <div className="flex h-screen bg-gray-950 text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Live View" />
        <main className="flex-1 overflow-auto p-6">
          {/* Controls Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold">
                {activeCameras.length} Active Camera{activeCameras.length !== 1 ? "s" : ""}
              </h2>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm text-gray-400">Live</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLayout("single")}
                className={`px-3 py-1.5 rounded text-sm ${layout === "single" ? "bg-orange-600" : "bg-gray-800 hover:bg-gray-700"}`}
              >
                Single
              </button>
              <button
                onClick={() => setLayout("grid-2x2")}
                className={`px-3 py-1.5 rounded text-sm ${layout === "grid-2x2" ? "bg-orange-600" : "bg-gray-800 hover:bg-gray-700"}`}
              >
                2x2
              </button>
              <button
                onClick={() => setLayout("grid-3x3")}
                className={`px-3 py-1.5 rounded text-sm ${layout === "grid-3x3" ? "bg-orange-600" : "bg-gray-800 hover:bg-gray-700"}`}
              >
                3x3
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-orange-500" />
            </div>
          ) : activeCameras.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 text-gray-400">
              <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p className="text-lg mb-2">No active cameras</p>
              <p className="text-sm">Add cameras in the Cameras section to start monitoring.</p>
            </div>
          ) : layout === "single" && selectedCamera ? (
            <div className="space-y-4">
              <LiveFeed camera={selectedCamera} large />
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {activeCameras.map((cam) => (
                  <button
                    key={cam.id}
                    onClick={() => setSelectedCamera(cam)}
                    className={`p-2 rounded border text-sm text-left ${
                      selectedCamera?.id === cam.id
                        ? "border-orange-500 bg-orange-500/10"
                        : "border-gray-700 bg-gray-800 hover:border-gray-600"
                    }`}
                  >
                    <div className="font-medium truncate">{cam.name}</div>
                    <div className="text-xs text-gray-400">{cam.location}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className={`grid ${gridCols[layout]} gap-4`}>
              {activeCameras.map((cam) => (
                <LiveFeed
                  key={cam.id}
                  camera={cam}
                  onClick={() => {
                    setSelectedCamera(cam);
                    setLayout("single");
                  }}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
