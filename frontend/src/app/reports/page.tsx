"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { FileText, Download, Clock } from "lucide-react";

type ReportType = "daily" | "weekly" | "monthly" | "custom";

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>("daily");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [generating, setGenerating] = useState(false);
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const [reports, setReports] = useState<Array<{
    id: string; type: string; date: string; status: string; url?: string;
  }>>([]);

  async function handleGenerate() {
    setGenerating(true);
    setReportUrl(null);
    try {
      const result = await api.generateReport({
        type: reportType,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      setReportUrl(result.download_url);
      setReports((prev) => [
        {
          id: result.report_id || Date.now().toString(),
          type: reportType,
          date: new Date().toISOString(),
          status: "completed",
          url: result.download_url,
        },
        ...prev,
      ]);
    } catch (err) {
      console.error("Failed to generate report:", err);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-gray-500 mt-1 text-sm">Generate and download incident analytics reports</p>
      </div>

      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-white/5 p-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-orange-500" />
          Generate Report
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500/50 transition text-white"
            >
              <option value="daily">Daily Summary</option>
              <option value="weekly">Weekly Summary</option>
              <option value="monthly">Monthly Summary</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          {reportType === "custom" && (
            <>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500/50 transition text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500/50 transition text-white"
                />
              </div>
            </>
          )}
          <div className="flex items-end">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full px-4 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 rounded-lg text-sm font-medium transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Generate
                </>
              )}
            </button>
          </div>
        </div>

        {reportUrl && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm text-emerald-400">Report generated successfully!</span>
            <a
              href={reportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm transition"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </a>
          </div>
        )}
      </div>

      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-white/5 overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-500" />
            Report History
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/[0.02]">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Generated</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-gray-600">
                    <FileText className="w-10 h-10 mx-auto mb-3 text-gray-700" />
                    <p className="text-gray-500">No reports generated yet</p>
                    <p className="text-xs text-gray-600 mt-1">Create your first report above</p>
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.id} className="border-t border-white/5 hover:bg-white/[0.02] transition">
                    <td className="px-5 py-3.5 text-sm capitalize">{report.type} Summary</td>
                    <td className="px-5 py-3.5 text-sm text-gray-400">
                      {new Date(report.date).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {report.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {report.url && (
                        <a
                          href={report.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-orange-400 hover:text-orange-300 text-sm"
                        >
                          Download
                        </a>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
