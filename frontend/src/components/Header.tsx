"use client";

import { useState } from "react";
import { Bell, Search, User } from "lucide-react";

interface HeaderProps {
  title?: string;
}

export default function Header({ title }: HeaderProps) {
  const [notifications] = useState(3);

  return (
    <header className="h-14 bg-gray-950/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6">
      <div />

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
          <input
            type="text"
            placeholder="Search..."
            className="w-56 bg-white/5 border border-white/5 rounded-lg pl-9 pr-4 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50 transition"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-gray-500 hover:text-white transition rounded-lg hover:bg-white/5">
          <Bell className="w-[18px] h-[18px]" />
          {notifications > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />
          )}
        </button>

        {/* User Avatar */}
        <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center text-xs font-bold cursor-pointer text-white">
          FS
        </div>
      </div>
    </header>
  );
}
