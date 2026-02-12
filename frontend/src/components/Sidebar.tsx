"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/live", label: "Live Feed", icon: "📹" },
  { href: "/incidents", label: "Incidents", icon: "🚨" },
  { href: "/cameras", label: "Cameras", icon: "🎥" },
  { href: "/reports", label: "Reports", icon: "📝" },
  { href: "/heatmap", label: "Heatmaps", icon: "🗺️" },
  { href: "/health", label: "Health", icon: "🟢" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-dark-navy border-r border-white/5 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <Link href="/" className="flex items-center gap-3">
          <span className="text-3xl">🔥</span>
          <div>
            <h1 className="text-xl font-bold text-firesight-orange">FireSight</h1>
            <p className="text-xs text-gray-500">AI Video Analytics</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? "bg-firesight-orange/10 text-firesight-orange border border-firesight-orange/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/5">
        <p className="text-xs text-gray-600 text-center">
          by Firewire Networks Ltd
        </p>
      </div>
    </aside>
  );
}
