"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import ConfidenceTuner from "@/components/ConfidenceTuner";
import { api } from "@/lib/api";

interface Settings {
  detection: {
    confidence_threshold: number;
    categories: Record<string, boolean>;
    model_variant: string;
  };
  alerts: {
    email_enabled: boolean;
    slack_enabled: boolean;
    teams_enabled: boolean;
    webhook_enabled: boolean;
    slack_webhook_url: string;
    teams_webhook_url: string;
    webhook_url: string;
    email_recipients: string;
  };
  storage: {
    retention_days: number;
    clip_duration: number;
    max_storage_gb: number;
  };
  general: {
    site_name: string;
    timezone: string;
    dark_mode: boolean;
  };
}

const CATEGORIES = [
  "human", "vehicle", "fire", "smoke", "bicycle",
  "plant", "ppe", "accident", "intrusion", "fall"
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("detection");
  const [settings, setSettings] = useState<Settings>({
    detection: {
      confidence_threshold: 0.5,
      categories: Object.fromEntries(CATEGORIES.map((c) => [c, true])),
      model_variant: "yolov8n",
    },
    alerts: {
      email_enabled: false,
      slack_enabled: false,
      teams_enabled: false,
      webhook_enabled: false,
      slack_webhook_url: "",
      teams_webhook_url: "",
      webhook_url: "",
      email_recipients: "",
    },
    storage: {
      retention_days: 30,
      clip_duration: 30,
      max_storage_gb: 100,
    },
    general: {
      site_name: "FireSight",
      timezone: "Europe/London",
      dark_mode: true,
    },
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const data = await api.getSettings();
      if (data) setSettings((prev) => ({ ...prev, ...data }));
    } catch (err) {
      console.error("Failed to load settings:", err);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await api.updateSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setSaving(false);
    }
  }

  const tabs = [
    { id: "detection", label: "Detection" },
    { id: "alerts", label: "Alerts & Notifications" },
    { id: "storage", label: "Storage" },
    { id: "general", label: "General" },
  ];

  return (
    <div className="flex h-screen bg-gray-950 text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Settings" />
        <main className="flex-1 overflow-auto p-6">
          {/* Tab Navigation */}
          <div className="flex gap-1 mb-6 border-b border-gray-800">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                  activeTab === tab.id
                    ? "border-orange-500 text-orange-400"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="max-w-3xl">
            {/* Detection Settings */}
            {activeTab === "detection" && (
              <div className="space-y-6">
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Confidence Threshold</h3>
                  <ConfidenceTuner
                    value={settings.detection.confidence_threshold}
                    onChange={(val) =>
                      setSettings({
                        ...settings,
                        detection: { ...settings.detection, confidence_threshold: val },
                      })
                    }
                  />
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Detection Categories</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {CATEGORIES.map((cat) => (
                      <label key={cat} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.detection.categories[cat] ?? true}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              detection: {
                                ...settings.detection,
                                categories: {
                                  ...settings.detection.categories,
                                  [cat]: e.target.checked,
                                },
                              },
                            })
                          }
                          className="rounded border-gray-600"
                        />
                        <span className="text-sm capitalize">{cat}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Model</h3>
                  <select
                    value={settings.detection.model_variant}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        detection: { ...settings.detection, model_variant: e.target.value },
                      })
                    }
                    className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
                  >
                    <option value="yolov8n">YOLOv8 Nano (Fastest)</option>
                    <option value="yolov8s">YOLOv8 Small</option>
                    <option value="yolov8m">YOLOv8 Medium</option>
                    <option value="yolov8l">YOLOv8 Large</option>
                    <option value="yolov11n">YOLOv11 Nano</option>
                    <option value="yolov11s">YOLOv11 Small</option>
                  </select>
                </div>
              </div>
            )}

            {/* Alert Settings */}
            {activeTab === "alerts" && (
              <div className="space-y-6">
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Notification Channels</h3>
                  <div className="space-y-4">
                    {[
                      { key: "email_enabled", label: "Email Notifications" },
                      { key: "slack_enabled", label: "Slack" },
                      { key: "teams_enabled", label: "Microsoft Teams" },
                      { key: "webhook_enabled", label: "Custom Webhook" },
                    ].map(({ key, label }) => (
                      <label key={key} className="flex items-center justify-between">
                        <span className="text-sm">{label}</span>
                        <input
                          type="checkbox"
                          checked={settings.alerts[key as keyof typeof settings.alerts] as boolean}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              alerts: { ...settings.alerts, [key]: e.target.checked },
                            })
                          }
                          className="rounded border-gray-600"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Storage Settings */}
            {activeTab === "storage" && (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-semibold mb-4">Storage Configuration</h3>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Retention Period (days)</label>
                  <input
                    type="number"
                    value={settings.storage.retention_days}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        storage: { ...settings.storage, retention_days: Number(e.target.value) },
                      })
                    }
                    className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm w-32 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Clip Duration (seconds)</label>
                  <input
                    type="number"
                    value={settings.storage.clip_duration}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        storage: { ...settings.storage, clip_duration: Number(e.target.value) },
                      })
                    }
                    className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm w-32 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Max Storage (GB)</label>
                  <input
                    type="number"
                    value={settings.storage.max_storage_gb}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        storage: { ...settings.storage, max_storage_gb: Number(e.target.value) },
                      })
                    }
                    className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm w-32 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            )}

            {/* General Settings */}
            {activeTab === "general" && (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-semibold mb-4">General</h3>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Site Name</label>
                  <input
                    type="text"
                    value={settings.general.site_name}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        general: { ...settings.general, site_name: e.target.value },
                      })
                    }
                    className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm w-64 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Timezone</label>
                  <select
                    value={settings.general.timezone}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        general: { ...settings.general, timezone: e.target.value },
                      })
                    }
                    className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
                  >
                    <option value="Europe/London">Europe/London (GMT)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                    <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="flex items-center gap-4 mt-6">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 rounded-lg text-sm font-medium transition"
              >
                {saving ? "Saving..." : "Save Settings"}
              </button>
              {saved && (
                <span className="text-sm text-green-400">Settings saved successfully!</span>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
