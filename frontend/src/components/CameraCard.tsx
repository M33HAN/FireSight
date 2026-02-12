"use client";

import { useState } from "react";
import { Camera } from "@/lib/api";

interface CameraCardProps {
  camera: Camera;
  onDelete: () => void;
}

export default function CameraCard({ camera, onDelete }: CameraCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
    active: { bg: "bg-green-900/30", text: "text-green-400", dot: "bg-green-500" },
    inactive: { bg: "bg-gray-900/30", text: "text-gray-400", dot: "bg-gray-500" },
    error: { bg: "bg-red-900/30", text: "text-red-400", dot: "bg-red-500" },
  };

  const status = statusColors[camera.status] || statusColors.inactive;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden hover:border-gray-700 transition">
      {/* Camera Preview */}
      <div className="aspect-video bg-gray-800 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>

        {/* Status Badge */}
        <div className="absolute top-2 left-2">
          <span className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${status.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot} ${camera.status === "active" ? "animate-pulse" : ""}`} />
            <span className={status.text}>{camera.status}</span>
          </span>
        </div>

        {/* Quick Actions */}
        <div className="absolute top-2 right-2 flex gap-1">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-1.5 bg-black/50 hover:bg-black/70 rounded-full transition"
            title="Details"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Camera Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-medium text-sm">{camera.name}</h3>
            <p className="text-xs text-gray-500">{camera.location || "No location set"}</p>
          </div>
          <button
            onClick={onDelete}
            className="p-1 text-gray-500 hover:text-red-400 transition"
            title="Delete camera"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        {/* Expandable Details */}
        {showDetails && (
          <div className="mt-3 pt-3 border-t border-gray-800 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">RTSP URL</span>
              <span className="text-gray-300 truncate max-w-[180px]" title={camera.rtsp_url}>
                {camera.rtsp_url}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Status</span>
              <span className={status.text}>{camera.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Camera ID</span>
              <span className="text-gray-300">#{camera.id}</span>
            </div>
            {camera.created_at && (
              <div className="flex justify-between">
                <span className="text-gray-400">Added</span>
                <span className="text-gray-300">
                  {new Date(camera.created_at).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 mt-3">
          <a
            href={`/live?camera=${camera.id}`}
            className="flex-1 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 rounded text-xs font-medium text-center transition"
          >
            View Live
          </a>
          <a
            href={`/incidents?camera=${camera.id}`}
            className="flex-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-xs font-medium text-center transition"
          >
            Incidents
          </a>
        </div>
      </div>
    </div>
  );
}
