"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Incident {
  id: number;
  camera_id: number;
  category: string;
  severity: string;
  status: string;
  confidence: number;
  description: string;
  detected_at: string;
}

const categoryIcons: Record<string, string> = {
  human: "👤", vehicle: "🚗", plant: "🏗️",
  bicycle: "🚲", ppe: "🦺", fire: "🔥",
  smoke: "💨", accident: "💥", intrusion: "🚨", fall: "⬇️",
};

const severityClasses: Record<string, string> = {
  critical: "badge-critical", high: "badge-high",
  medium: "badge-medium", low: "badge-low",
};

const statusClasses: Record<string, string> = {
  new: "bg-blue-600/20 text-blue-400",
  reviewing: "bg-yellow-600/20 text-yellow-400",
  confirmed: "bg-red-600/20 text-red-400",
  resolved: "bg-green-600/20 text-green-400",
  false_alarm: "bg-gray-600/20 text-gray-400",
};

export default function IncidentTable() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIncidents();
  }, []);

  async function loadIncidents() {
    try {
      const data = await api.get("/incidents?limit=20");
      setIncidents(data);
    } catch (error) {
      console.error("Failed to load incidents:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-gray-400">Loading incidents...</div>;
  }

  if (incidents.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-4xl mb-4">🔥</p>
        <p>No incidents detected yet.</p>
        <p className="text-sm mt-2">Start a detection session to begin monitoring.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-gray-400">
            <th className="text-left py-3 px-4">Category</th>
            <th className="text-left py-3 px-4">Severity</th>
            <th className="text-left py-3 px-4">Status</th>
            <th className="text-left py-3 px-4">Confidence</th>
            <th className="text-left py-3 px-4">Camera</th>
            <th className="text-left py-3 px-4">Time</th>
          </tr>
        </thead>
        <tbody>
          {incidents.map((incident) => (
            <tr
              key={incident.id}
              className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
            >
              <td className="py-3 px-4">
                <span className="mr-2">{categoryIcons[incident.category] || "❓"}</span>
                <span className="capitalize">{incident.category}</span>
              </td>
              <td className="py-3 px-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${severityClasses[incident.severity] || ""}`}>
                  {incident.severity}
                </span>
              </td>
              <td className="py-3 px-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[incident.status] || ""}`}>
                  {incident.status.replace("_", " ")}
                </span>
              </td>
              <td className="py-3 px-4 font-mono">
                {(incident.confidence * 100).toFixed(1)}%
              </td>
              <td className="py-3 px-4 text-gray-400">
                Camera {incident.camera_id}
              </td>
              <td className="py-3 px-4 text-gray-400">
                {new Date(incident.detected_at).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
