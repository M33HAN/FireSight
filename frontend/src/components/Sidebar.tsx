"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Video,
  AlertTriangle,
  Camera,
  FileText,
  Map,
  HeartPulse,
  Settings,
  Flame,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/live", label: "Live Feed", icon: Video },
  { href: "/incidents", label: "Incidents", icon: AlertTriangle },
  { href: "/cameras", label: "Cameras", icon: Camera },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/heatmap", label: "Heatmaps", icon: Map },
  { href: "/health", label: "Health", icon: HeartPulse },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gray-950 border-r border-white/5 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/5">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">FireSight</h1>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest">AI Analytics</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={"flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all " +
                (isActive
                  ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                  : "text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent"
                )
              }
            >
              <Icon className={"w-[18px] h-[18px] " + (isActive ? "text-orange-400" : "text-gray-600")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-white/5">
        <p className="text-[10px] text-gray-700 text-center uppercase tracking-wider">
          Firewire Networks Ltd
        </p>
      </div>
    </aside>
  );
}
