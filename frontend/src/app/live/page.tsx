"use client";

import { Video } from "lucide-react";

export default function LivePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Live Feed</h1>
        <p className="text-gray-500 mt-1 text-sm">Real-time camera monitoring with AI detection</p>
      </div>

      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-white/5 p-12 text-center">
        <Video className="w-16 h-16 mx-auto mb-4 text-gray-700" />
        <h3 className="text-lg font-medium text-gray-400 mb-2">No Active Cameras</h3>
        <p className="text-gray-600 text-sm max-w-md mx-auto">
          Add cameras in the Cameras section to start live monitoring with AI-powered detection overlays.
        </p>
      </div>
    </div>
  );
}
