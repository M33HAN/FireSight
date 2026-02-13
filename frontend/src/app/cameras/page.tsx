"use client";

import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-gray-500 mt-1 text-sm">Configure FireSight platform preferences</p>
      </div>

      <div className="space-y-4">
        {[
          { title: "Detection Models", desc: "Configure YOLO model paths and confidence thresholds" },
          { title: "Alert Notifications", desc: "Set up email, Slack, and Teams alert integrations" },
          { title: "Storage", desc: "Manage clip storage, thumbnails, and retention policies" },
          { title: "CORS & Security", desc: "Configure allowed origins and API security settings" },
        ].map((item) => (
          <div key={item.title} className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-white/5 p-5 flex items-center justify-between hover:border-orange-500/20 transition cursor-pointer">
            <div>
              <h3 className="text-sm font-medium text-gray-300">{item.title}</h3>
              <p className="text-xs text-gray-600 mt-0.5">{item.desc}</p>
            </div>
            <Settings className="w-4 h-4 text-gray-600" />
          </div>
        ))}
      </div>
    </div>
  );
}
