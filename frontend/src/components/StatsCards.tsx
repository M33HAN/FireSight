interface StatsProps {
  stats: {
    total_incidents: number;
    incidents_today: number;
    active_cameras: number;
    detection_sessions: number;
  } | null;
}

const statCards = [
  { key: "total_incidents", label: "Total Incidents", icon: "🚨", color: "text-firesight-orange" },
  { key: "incidents_today", label: "Today", icon: "📅", color: "text-firesight-gold" },
  { key: "active_cameras", label: "Active Cameras", icon: "🎥", color: "text-green-400" },
  { key: "detection_sessions", label: "Active Sessions", icon: "⚡", color: "text-blue-400" },
];

export default function StatsCards({ stats }: StatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((card) => (
        <div key={card.key} className="card flex items-center gap-4">
          <span className="text-3xl">{card.icon}</span>
          <div>
            <p className={`text-2xl font-bold ${card.color}`}>
              {stats ? (stats as any)[card.key] : 0}
            </p>
            <p className="text-sm text-gray-400">{card.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
