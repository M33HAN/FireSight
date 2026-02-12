"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface SharedIncident {
  id: number;
  category: string;
  severity: string;
  confidence: number;
  camera_name: string;
  detected_at: string;
  thumbnail_path?: string;
  clip_path?: string;
  description?: string;
}

export default function SharedIncidentPage() {
  const params = useParams();
  const token = params.token as string;
  const [incident, setIncident] = useState<SharedIncident | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      loadSharedIncident();
    }
  }, [token]);

  async function loadSharedIncident() {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const resp = await fetch(`${apiBase}/api/share/${token}`);
      if (!resp.ok) {
        if (resp.status === 404) {
          setError("This shared link has expired or does not exist.");
        } else {
          setError("Failed to load shared incident.");
        }
        return;
      }
      const data = await resp.json();
      setIncident(data);
    } catch (err) {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  const severityColors: Record<string, string> = {
    critical: "bg-red-600",
    high: "bg-orange-600",
    medium: "bg-yellow-600",
    low: "bg-blue-600",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-orange-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="text-6xl mb-4">🔗</div>
          <h1 className="text-2xl font-bold mb-2">Link Unavailable</h1>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!incident) return null;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
              <span className="text-sm font-bold">FS</span>
            </div>
            <span className="font-semibold">FireSight</span>
            <span className="text-gray-500 text-sm">Shared Incident</span>
          </div>
          <span className="text-xs text-gray-500">
            Powered by Firewire Networks Ltd
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          {/* Incident Header */}
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold capitalize mb-1">
                  {incident.category} Detection
                </h1>
                <p className="text-gray-400">
                  {incident.camera_name} &middot;{" "}
                  {new Date(incident.detected_at).toLocaleString()}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  severityColors[incident.severity] || "bg-gray-600"
                }`}
              >
                {incident.severity.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Thumbnail / Clip */}
          {incident.thumbnail_path && (
            <div className="bg-black">
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/clips/${incident.thumbnail_path}`}
                alt="Incident thumbnail"
                className="w-full max-h-96 object-contain"
              />
            </div>
          )}

          {incident.clip_path && (
            <div className="p-6 border-t border-gray-800">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Video Clip</h3>
              <video
                controls
                className="w-full rounded-lg"
                src={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/clips/${incident.clip_path}`}
              />
            </div>
          )}

          {/* Details */}
          <div className="p-6 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400">Category</p>
              <p className="font-medium capitalize">{incident.category}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Confidence</p>
              <p className="font-medium">{(incident.confidence * 100).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Camera</p>
              <p className="font-medium">{incident.camera_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Detected At</p>
              <p className="font-medium">
                {new Date(incident.detected_at).toLocaleString()}
              </p>
            </div>
          </div>

          {incident.description && (
            <div className="px-6 pb-6">
              <p className="text-sm text-gray-400 mb-1">Description</p>
              <p className="text-sm">{incident.description}</p>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-600 mt-8">
          This incident was shared via FireSight by Firewire Networks Ltd.
          Shared links expire after the configured retention period.
        </p>
      </div>
    </div>
  );
}
