"use client";

interface ConfidenceTunerProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export default function ConfidenceTuner({
  value,
  onChange,
  min = 0.1,
  max = 1.0,
  step = 0.05,
}: ConfidenceTunerProps) {
  const percentage = Math.round(value * 100);

  const getColor = () => {
    if (value < 0.3) return "text-red-400";
    if (value < 0.5) return "text-orange-400";
    if (value < 0.7) return "text-yellow-400";
    return "text-green-400";
  };

  const getLabel = () => {
    if (value < 0.3) return "Very Low — High false positive rate";
    if (value < 0.5) return "Low — More detections, some false positives";
    if (value < 0.7) return "Balanced — Recommended for most use cases";
    if (value < 0.85) return "High — Fewer detections, more accurate";
    return "Very High — Only high-confidence detections";
  };

  const getTrackColor = () => {
    if (value < 0.3) return "from-red-500 to-red-600";
    if (value < 0.5) return "from-orange-500 to-orange-600";
    if (value < 0.7) return "from-yellow-500 to-yellow-600";
    return "from-green-500 to-green-600";
  };

  return (
    <div className="space-y-4">
      {/* Value Display */}
      <div className="flex items-center justify-between">
        <div>
          <span className={`text-3xl font-bold ${getColor()}`}>{percentage}%</span>
          <p className="text-sm text-gray-400 mt-1">{getLabel()}</p>
        </div>
        <div className="text-right text-sm text-gray-500">
          <p>Min: {Math.round(min * 100)}%</p>
          <p>Max: {Math.round(max * 100)}%</p>
        </div>
      </div>

      {/* Slider */}
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
          style={{
            background: `linear-gradient(to right, #f97316 0%, #f97316 ${((value - min) / (max - min)) * 100}%, #1f2937 ${((value - min) / (max - min)) * 100}%, #1f2937 100%)`,
          }}
        />

        {/* Scale Markers */}
        <div className="flex justify-between mt-2 px-1">
          {[0.1, 0.25, 0.5, 0.75, 1.0].map((mark) => (
            <button
              key={mark}
              onClick={() => onChange(mark)}
              className={`text-xs ${
                Math.abs(value - mark) < 0.05
                  ? "text-orange-400 font-medium"
                  : "text-gray-600 hover:text-gray-400"
              } transition`}
            >
              {Math.round(mark * 100)}%
            </button>
          ))}
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="flex gap-2">
        {[
          { label: "Sensitive", value: 0.25, desc: "Catch everything" },
          { label: "Balanced", value: 0.5, desc: "Recommended" },
          { label: "Accurate", value: 0.75, desc: "Fewer false positives" },
          { label: "Strict", value: 0.9, desc: "High confidence only" },
        ].map((preset) => (
          <button
            key={preset.label}
            onClick={() => onChange(preset.value)}
            className={`flex-1 p-2 rounded-lg border text-center transition ${
              Math.abs(value - preset.value) < 0.05
                ? "border-orange-500 bg-orange-500/10 text-orange-400"
                : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"
            }`}
          >
            <p className="text-xs font-medium">{preset.label}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{preset.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
