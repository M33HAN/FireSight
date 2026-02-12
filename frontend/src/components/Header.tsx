"use client";

import { useState } from "react";
import SearchBar from "./SearchBar";

interface HeaderProps {
  title?: string;
}

export default function Header({ title = "Dashboard" }: HeaderProps) {
  const [notifications] = useState(3);

  return (
    <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-white">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        <SearchBar
          value=""
          onChange={() => {}}
          placeholder="Search incidents, cameras..."
        />

        {/* Notifications */}
        <button className="relative p-2 text-gray-400 hover:text-white transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          {notifications > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-orange-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold">
              {notifications}
            </span>
          )}
        </button>

        {/* User Avatar */}
        <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-sm font-bold cursor-pointer">
          FS
        </div>
      </div>
    </header>
  );
}
