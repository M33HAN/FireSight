"use client";

import { AlertTriangle } from "lucide-react";
import IncidentTable from "@/components/IncidentTable";

export default function IncidentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Incidents</h1>
        <p className="text-gray-500 mt-1 text-sm">AI-detected security and safety incidents</p>
      </div>

      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-white/5 p-6">
        <IncidentTable />
      </div>
    </div>
  );
}
