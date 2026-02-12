"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { api } from "@/lib/api";

type ReportType = "daily" | "weekly" | "monthly" | "custom";

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>("daily");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [generating, setGenerating] = useState(false);
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const [reports, setReports] = useState<Array<{
    id: string;
    type: string;
    date: string;
    status: string;
    url?: string;
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
    <div className="flex h-screen bg-gray-950 text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Reports" />
        <main className="flex-1 overflow-auto p-6">
          {/* Report Generator */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Generate Report</h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Report Type</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as ReportType)}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
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
                    <label className="block text-sm text-gray-400 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </>
              )}

              <div className="flex items-end">
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 rounded text-sm font-medium transition flex items-center justify-center gap-2"
                >
                  {generating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Generate
                    </>
                  )}
                </button>
              </div>
            </div>

            {reportUrl && (
              <div className="bg-green-900/20 border border-green-800 rounded p-3 flex items-center justify-between">
                <span className="text-sm text-green-400">Report generated successfully!</span>
                <a
                  href={reportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-green-700 hover:bg-green-600 rounded text-sm transition"
                >
                  Download PDF
                </a>
              </div>
            )}
          </div>

          {/* Report History */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-800">
              <h3 className="text-lg font-semibold">Report History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Type</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Generated</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Status</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                        No reports generated yet. Create your first report above.
                      </td>
                    </tr>
                  ) : (
                    reports.map((report) => (
                      <tr key={report.id} className="border-t border-gray-800 hover:bg-gray-800/30">
                        <td className="px-4 py-3 text-sm capitalize">{report.type} Summary</td>
                        <td className="px-4 py-3 text-sm text-gray-400">
                          {new Date(report.date).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-xs bg-green-900/50 text-green-400">
                            {report.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
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
        </main>
      </div>
    </div>
  );
}
