"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Camera, Plus, Trash2, Edit2, Video, X } from "lucide-react";

interface CameraDevice {
  id: string;
  name: string;
  rtsp_url: string;
  location: string;
  status: string;
  resolution?: string;
  fps?: number;
}

export default function CamerasPage() {
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", rtsp_url: "", location: "", resolution: "1920x1080", fps: 15 });

  useEffect(() => { loadCameras(); }, []);

  async function loadCameras() {
    try { const d = await api.getCameras(); setCameras(d); }
    catch (e) { console.error("Failed:", e); }
    finally { setLoading(false); }
  }

  async function handleSave() {
    try {
      if (editId) { await api.updateCamera(editId, form); } else { await api.addCamera(form); }
      await loadCameras();
      setShowAdd(false);
      setEditId(null);
      setForm({ name: "", rtsp_url: "", location: "", resolution: "1920x1080", fps: 15 });
    } catch (e) { console.error("Failed:", e); }
  }

  async function handleDelete(id: string) {
    try { await api.deleteCamera(id); setCameras((prev) => prev.filter((c) => c.id !== id)); }
    catch (e) { console.error("Failed:", e); }
  }

  function startEdit(cam: CameraDevice) {
    setEditId(cam.id);
    setForm({ name: cam.name, rtsp_url: cam.rtsp_url, location: cam.location, resolution: cam.resolution || "1920x1080", fps: cam.fps || 15 });
    setShowAdd(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cameras</h1>
          <p className="text-gray-500 mt-1 text-sm">Manage RTSP camera feeds and connections</p>
        </div>
        <button
          onClick={() => { setEditId(null); setForm({ name: "", rtsp_url: "", location: "", resolution: "1920x1080", fps: 15 }); setShowAdd(true); }}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Camera
        </button>
      </div>

      {showAdd && (
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-white/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-300">{editId ? "Edit Camera" : "Add New Camera"}</h3>
            <button onClick={() => setShowAdd(false)} className="text-gray-500 hover:text-gray-300"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Camera Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Front Entrance" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-orange-500/50" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Location</label>
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Building A" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-orange-500/50" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-500 mb-1.5">RTSP URL</label>
              <input value={form.rtsp_url} onChange={(e) => setForm({ ...form, rtsp_url: e.target.value })} placeholder="rtsp://user:pass@192.168.1.100:554/stream1" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-200 font-mono text-xs focus:outline-none focus:border-orange-500/50" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Resolution</label>
              <input value={form.resolution} onChange={(e) => setForm({ ...form, resolution: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-orange-500/50" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">FPS</label>
              <input type="number" value={form.fps} onChange={(e) => setForm({ ...form, fps: Number(e.target.value) })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-orange-500/50" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors">Cancel</button>
            <button onClick={handleSave} className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors">{editId ? "Update" : "Add Camera"}</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
        </div>
      ) : cameras.length === 0 ? (
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-white/5 p-12 text-center">
          <Camera className="w-12 h-12 mx-auto mb-3 text-gray-700" />
          <p className="text-gray-500">No cameras configured</p>
          <p className="text-sm text-gray-600 mt-1">Add your first RTSP camera to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cameras.map((cam) => (
            <div key={cam.id} className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-white/5 overflow-hidden group">
              <div className="aspect-video bg-black/50 flex items-center justify-center relative">
                <Video className="w-8 h-8 text-gray-700" />
                <div className="absolute top-2 right-2 flex items-center gap-1">
                  {cam.status === "active" ? (
                    <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /><span className="text-[10px] text-emerald-400">Live</span></>
                  ) : (
                    <><span className="w-1.5 h-1.5 rounded-full bg-red-500" /><span className="text-[10px] text-red-400">Offline</span></>
                  )}
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-200">{cam.name}</h3>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(cam)} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"><Edit2 className="w-3.5 h-3.5 text-gray-400" /></button>
                    <button onClick={() => handleDelete(cam.id)} className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{cam.location}</p>
                <p className="text-[10px] text-gray-600 font-mono mt-2 truncate">{cam.rtsp_url}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
