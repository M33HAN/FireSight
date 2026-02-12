"use client";

import SearchBar from "@/components/SearchBar";

export default function Header() {
  return (
    <header className="h-16 bg-dark-navy border-b border-white/5 flex items-center justify-between px-6">
      <SearchBar />

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
          <span className="text-xl">🔔</span>
          <span className="absolute top-0 right-0 w-2 h-2 bg-firesight-orange rounded-full"></span>
        </button>

        {/* Status indicator */}
        <div className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          <span className="text-gray-400">AI Active</span>
        </div>
      </div>
    </header>
  );
}
