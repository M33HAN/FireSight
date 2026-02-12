"use client";

import { Incident } from "@/lib/api";

interface IncidentTableProps {
  incidents: Incident[];
}

const severityColors: Record<string, string> = {
  critical: "bg-red-600",
  high: "bg-orange-600",
  medium: "bg-yellow-600",
  low: "bg-blue-600",
};

export default function IncidentTable({ incidents }: IncidentTableProps) {
  if (incidents.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center text-gray-500">
        No incidents found.
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-800/50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">ID</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Category</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Severity</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Confidence</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Camera</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Time</th>
            </tr>
          </thead>
          <tbody>
            {incidents.map((incident) => (
              <tr
                key={incident.id}
                className="border-t border-gray-800 hover:bg-gray-800/30 cursor-pointer transition"
              >
                <td className="px-4 py-3 text-sm font-mono text-gray-400">
                  #{incident.id}
                </td>
                <td className="px-4 py-3 text-sm capitalize">{incident.category}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      severityColors[incident.severity] || "bg-gray-600"
                    }`}
                  >
                    {incident.severity}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  {(incident.confidence * 100).toFixed(1)}%
                </td>
                <td className="px-4 py-3 text-sm text-gray-400">
                  Camera {incident.camera_id}
                </td>
                <td className="px-4 py-3 text-sm text-gray-400">
                  {new Date(incident.detected_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
