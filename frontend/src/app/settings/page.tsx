"use client";

import { useState, useEffect } from "react";
import ConfidenceTuner from "@/components/ConfidenceTuner";
import { api } from "@/lib/api";
import { Save, CheckCircle, Shield, Bell, Database, Cog } from "lucide-react";

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
  "plant", "ppe", "accident", "intrusion", "fall",
];

const CATEGORY_ICONS: Record<string, string> = {
  human: "\\u{1F464}", vehicle: "\\u{1F697}", fire: "\\u{1F525}", smoke: "\\u{1F4A8}",
  bicycle: "\\u{1F6B2}", plant: "\\u{1F3D7}\\u{FE0F}", ppe: "\\u{1F9BA}", accident: "\\u{1F4A5}",
  intrusion: "\\u{1F6A8}", fall: "\\u{2B07}\\u{FE0F}",
};

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
    { id: "detection", label: "Detection", icon: Shield },
    { id: "alerts", label: "Alerts", icon: Bell },
    { id: "storage", label: "Storage", icon: Database },
    { id: "general", label: "General", icon: Cog },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-gray-500 mt-1 text-sm">Configure FireSight platform preferences</p>
      </div>

      <div className="flex gap-1 bg-gray-900/50 backdrop-blur-sm rounded-xl border border-white/5 p-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all " +
                (activeTab === tab.id
                  ? "bg-orange-500/15 text-orange-400 shadow-sm"
                  : "text-gray-500 hover:text-gray-300 hover:bg-white/5")
              }
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="max-w-3xl">
        {activeTab === "detection" && (
          <div className="space-y-4">
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-white/5 p-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">Confidence Threshold</h3>
              <ConfidenceTuner
                value={settings.detection.confidence_threshold}
                onChange={(val) =>
                  setSettings({ ...settings, detection: { ...settings.detection, confidence_threshold: val } })
                }
              />
            </div>

            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-white/5 p-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">Detection Categories</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => (
                  <label
                    key={cat}
                    className={
                      "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all " +
                      (settings.detection.categories[cat]
                        ? "border-orange-500/30 bg-orange-500/5 text-white"
                        : "border-white/5 bg-white/[0.02] text-gray-500 hover:border-white/10")
                    }
                  >
                    <input
                      type="checkbox"
                      checked={settings.detection.categories[cat] ?? true}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          detection: {
                            ...settings.detection,
                            categories: { ...settings.detection.categories, [cat]: e.target.checked },
                          },
                        })
                      }
                      className="sr-only"
                    />
                    <span className="text-base">{CATEGORY_ICONS[cat]}</span>
                    <span className="text-sm capitalize">{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-white/5 p-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">Model Variant</h3>
              <select
                value={settings.detection.model_variant}
                onChange={(e) =>
                  setSettings({ ...settings, detection: { ...settings.detection, model_variant: e.target.value } })
                }
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50 transition"
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

        {activeTab === "alerts" && (
          <div className="space-y-4">
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-white/5 p-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">Notification Channels</h3>
              <div className="space-y-3">
                {[
                  { key: "email_enabled", label: "Email Notifications", desc: "Send alerts to email addresses" },
                  { key: "slack_enabled", label: "Slack", desc: "Post alerts to Slack channels" },
                  { key: "teams_enabled", label: "Microsoft Teams", desc: "Send alerts via Teams webhooks" },
                  { key: "webhook_enabled", label: "Custom Webhook", desc: "POST alerts to a custom URL" },
                ].map(({ key, label, desc }) => (
                  <label
                    key={key}
                    className="flex items-center justify-between p-4 rounded-lg border border-white/5 bg-white/[0.02] hover:border-white/10 cursor-pointer transition-all"
                  >
                    <div>
                      <span className="text-sm font-medium text-gray-300">{label}</span>
                      <p className="text-xs text-gray-600 mt-0.5">{desc}</p>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={settings.alerts[key as keyof typeof settings.alerts] as boolean}
                        onChange={(e) =>
                          setSettings({ ...settings, alerts: { ...settings.alerts, [key]: e.target.checked } })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-10 h-6 bg-gray-700 peer-checked:bg-orange-500 rounded-full transition-colors" />
                      <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-4 transition-transform" />
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "storage" && (
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-white/5 p-6 space-y-5">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Storage Configuration</h3>
            {[
              { key: "retention_days", label: "Retention Period (days)", value: settings.storage.retention_days },
              { key: "clip_duration", label: "Clip Duration (seconds)", value: settings.storage.clip_duration },
              { key: "max_storage_gb", label: "Max Storage (GB)", value: settings.storage.max_storage_gb },
            ].map(({ key, label, value }) => (
              <div key={key}>
                <label className="block text-sm text-gray-400 mb-1.5">{label}</label>
                <input
                  type="number"
                  value={value}
                  onChange={(e) =>
                    setSettings({ ...settings, storage: { ...settings.storage, [key]: Number(e.target.value) } })
                  }
                  className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm w-40 focus:outline-none focus:border-orange-500/50 transition text-white"
                />
              </div>
            ))}
          </div>
        )}

        {activeTab === "general" && (
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-white/5 p-6 space-y-5">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">General</h3>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Site Name</label>
              <input
                type="text"
                value={settings.general.site_name}
                onChange={(e) =>
                  setSettings({ ...settings, general: { ...settings.general, site_name: e.target.value } })
                }
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm w-64 focus:outline-none focus:border-orange-500/50 transition text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Timezone</label>
              <select
                value={settings.general.timezone}
                onChange={(e) =>
                  setSettings({ ...settings, general: { ...settings.general, timezone: e.target.value } })
                }
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500/50 transition text-white"
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

        <div className="flex items-center gap-4 mt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 rounded-lg text-sm font-medium transition-all shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Settings"}
          </button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-400">
              <CheckCircle className="w-4 h-4" />
              Settings saved successfully!
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
