"use client";

import { useState } from "react";
import { api } from "@/lib/api";

interface OnboardingWizardProps {
  onComplete: () => void;
}

const STEPS = [
  { id: "welcome", title: "Welcome to FireSight" },
  { id: "camera", title: "Add Your First Camera" },
  { id: "detection", title: "Configure Detection" },
  { id: "alerts", title: "Set Up Alerts" },
  { id: "done", title: "You're All Set!" },
];

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [cameraData, setCameraData] = useState({
    name: "",
    rtsp_url: "",
    location: "",
  });
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.5);
  const [enabledCategories, setEnabledCategories] = useState<string[]>([
    "human", "vehicle", "fire", "smoke", "intrusion",
  ]);
  const [alertEmail, setAlertEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const currentStep = STEPS[step];
  const isLastStep = step === STEPS.length - 1;

  async function handleNext() {
    if (step === 1 && cameraData.name && cameraData.rtsp_url) {
      setLoading(true);
      try {
        await api.addCamera(cameraData);
      } catch (err) {
        console.error("Failed to add camera:", err);
      } finally {
        setLoading(false);
      }
    }

    if (step === 2) {
      try {
        await api.updateSettings({
          detection: {
            confidence_threshold: confidenceThreshold,
            categories: Object.fromEntries(
              ["human", "vehicle", "fire", "smoke", "bicycle", "plant", "ppe", "accident", "intrusion", "fall"].map(
                (c) => [c, enabledCategories.includes(c)]
              )
            ),
          },
        });
      } catch (err) {
        console.error("Failed to save detection settings:", err);
      }
    }

    if (isLastStep) {
      onComplete();
      return;
    }

    setStep((s) => s + 1);
  }

  const categories = [
    { id: "human", label: "People", icon: "👤" },
    { id: "vehicle", label: "Vehicles", icon: "🚗" },
    { id: "fire", label: "Fire", icon: "🔥" },
    { id: "smoke", label: "Smoke", icon: "💨" },
    { id: "bicycle", label: "Bicycles", icon: "🚲" },
    { id: "plant", label: "Plants", icon: "🌿" },
    { id: "ppe", label: "PPE/Safety", icon: "🦺" },
    { id: "accident", label: "Accidents", icon: "⚠️" },
    { id: "intrusion", label: "Intrusion", icon: "🚨" },
    { id: "fall", label: "Falls", icon: "🤸" },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Progress Bar */}
        <div className="h-1 bg-gray-800">
          <div
            className="h-full bg-orange-500 transition-all duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Step Indicators */}
        <div className="flex justify-center gap-2 pt-6 pb-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition ${
                i === step ? "bg-orange-500" : i < step ? "bg-orange-700" : "bg-gray-700"
              }`}
            />
          ))}
        </div>

        <div className="p-8">
          <h2 className="text-xl font-bold text-center mb-6">{currentStep.title}</h2>

          {/* Step Content */}
          {step === 0 && (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-orange-600 rounded-2xl flex items-center justify-center mx-auto">
                <span className="text-3xl font-bold">FS</span>
              </div>
              <p className="text-gray-400">
                FireSight is your AI-powered CCTV analytics platform. Let&apos;s get
                you set up in a few quick steps.
              </p>
              <div className="grid grid-cols-3 gap-3 text-center mt-6">
                <div className="p-3 bg-gray-800 rounded-lg">
                  <p className="text-2xl mb-1">📹</p>
                  <p className="text-xs text-gray-400">Add Cameras</p>
                </div>
                <div className="p-3 bg-gray-800 rounded-lg">
                  <p className="text-2xl mb-1">🤖</p>
                  <p className="text-xs text-gray-400">AI Detection</p>
                </div>
                <div className="p-3 bg-gray-800 rounded-lg">
                  <p className="text-2xl mb-1">🔔</p>
                  <p className="text-xs text-gray-400">Smart Alerts</p>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Camera Name</label>
                <input
                  type="text"
                  value={cameraData.name}
                  onChange={(e) => setCameraData({ ...cameraData, name: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500"
                  placeholder="e.g., Front Entrance"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">RTSP Stream URL</label>
                <input
                  type="text"
                  value={cameraData.rtsp_url}
                  onChange={(e) => setCameraData({ ...cameraData, rtsp_url: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500"
                  placeholder="rtsp://192.168.1.100:554/stream1"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Location (optional)</label>
                <input
                  type="text"
                  value={cameraData.location}
                  onChange={(e) => setCameraData({ ...cameraData, location: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500"
                  placeholder="Building A - Main Entrance"
                />
              </div>
              <p className="text-xs text-gray-500">
                You can add more cameras later from the Cameras page.
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Confidence Threshold: {Math.round(confidenceThreshold * 100)}%
                </label>
                <input
                  type="range"
                  min={0.1}
                  max={1.0}
                  step={0.05}
                  value={confidenceThreshold}
                  onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                  className="w-full accent-orange-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>More detections</span>
                  <span>Higher accuracy</span>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Detection Categories</label>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() =>
                        setEnabledCategories((prev) =>
                          prev.includes(cat.id)
                            ? prev.filter((c) => c !== cat.id)
                            : [...prev, cat.id]
                        )
                      }
                      className={`flex items-center gap-2 p-2.5 rounded-lg border text-sm transition ${
                        enabledCategories.includes(cat.id)
                          ? "border-orange-500 bg-orange-500/10 text-white"
                          : "border-gray-700 bg-gray-800 text-gray-400"
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-400">
                Get notified when critical events are detected. You can configure
                more channels later in Settings.
              </p>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email Address</label>
                <input
                  type="email"
                  value={alertEmail}
                  onChange={(e) => setAlertEmail(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500"
                  placeholder="you@company.com"
                />
              </div>
              <p className="text-xs text-gray-500">
                Skip this step if you want to set up alerts later.
              </p>
            </div>
          )}

          {step === 4 && (
            <div className="text-center space-y-4">
              <div className="text-5xl mb-4">🎉</div>
              <p className="text-gray-400">
                FireSight is ready to protect your premises. Your cameras will start
                analyzing feeds immediately.
              </p>
              <div className="bg-gray-800 rounded-lg p-4 text-sm text-left">
                <p className="text-gray-300 font-medium mb-2">What happens next:</p>
                <ul className="space-y-1 text-gray-400">
                  <li>• AI detection begins processing camera feeds</li>
                  <li>• Incidents appear on your dashboard in real-time</li>
                  <li>• Alerts are sent based on your configured channels</li>
                  <li>• Visit Settings anytime to fine-tune your setup</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between p-6 pt-0">
          {step > 0 && !isLastStep ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition"
            >
              Back
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={handleNext}
            disabled={loading}
            className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 rounded-lg text-sm font-medium transition"
          >
            {loading ? "Saving..." : isLastStep ? "Go to Dashboard" : step === 0 ? "Get Started" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
