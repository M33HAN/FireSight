"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import CameraCard from "@/components/CameraCard";
import { api, Camera } from "@/lib/api";

export default function CamerasPage() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCamera, setNewCamera] = useState({
    name: "",
    rtsp_url: "",
    location: "",
  });

  useEffect(() => {
    loadCameras();
  }, []);

  async function loadCameras() {
    try {
      const data = await api.getCameras();
      setCameras(data);
    } catch (err) {
      console.error("Failed to load cameras:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddCamera(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.addCamera(newCamera);
      setNewCamera({ name: "", rtsp_url: "", location: "" });
      setShowAddForm(false);
      loadCameras();
    } catch (err) {
      console.error("Failed to add camera:", err);
    }
  }

  async function handleDeleteCamera(id: number) {
    if (!confirm("Are you sure you want to remove this camera?")) return;
    try {
      await api.deleteCamera(id);
      loadCameras();
    } catch (err) {
      console.error("Failed to delete camera:", err);
    }
  }

  const statusCounts = {
    total: cameras.length,
    active: cameras.filter((c) => c.status === "active").length,
    inactive: cameras.filter((c) => c.status === "inactive").length,
    error: cameras.filter((c) => c.status === "error").length,
  };

  return (
    <div className="flex h-screen bg-gray-950 text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Cameras" />
        <main className="flex-1 overflow-auto p-6">
          {/* Status Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{statusCounts.total}</p>
                <p className="text-xs text-gray-400">Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">{statusCounts.active}</p>
                <p className="text-xs text-gray-400">Active</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-500">{statusCounts.inactive}</p>
                <p className="text-xs text-gray-400">Inactive</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-500">{statusCounts.error}</p>
                <p className="text-xs text-gray-400">Error</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-sm font-medium transition flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Camera
            </button>
          </div>

          {/* Add Camera Form */}
          {showAddForm && (
            <form
              onSubmit={handleAddCamera}
              className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6"
            >
              <h3 className="text-lg font-semibold mb-4">Add New Camera</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Camera Name</label>
                  <input
                    type="text"
                    value={newCamera.name}
                    onChange={(e) => setNewCamera({ ...newCamera, name: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
                    placeholder="Front Entrance"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">RTSP URL</label>
                  <input
                    type="text"
                    value={newCamera.rtsp_url}
                    onChange={(e) => setNewCamera({ ...newCamera, rtsp_url: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
                    placeholder="rtsp://192.168.1.100:554/stream"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Location</label>
                  <input
                    type="text"
                    value={newCamera.location}
                    onChange={(e) => setNewCamera({ ...newCamera, location: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
                    placeholder="Building A - Main Entrance"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded text-sm font-medium"
                >
                  Add Camera
                </button>
              </div>
            </form>
          )}

          {/* Camera Grid */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-orange-500" />
            </div>
          ) : cameras.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p className="text-lg mb-2">No cameras configured</p>
              <p className="text-sm">Click &quot;Add Camera&quot; to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cameras.map((camera) => (
                <CameraCard
                  key={camera.id}
                  camera={camera}
                  onDelete={() => handleDeleteCamera(camera.id)}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
