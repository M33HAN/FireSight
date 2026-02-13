"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { FileText, Download, Calendar, Clock, ChevronDown } from "lucide-react";

type ReportType = "daily" | "weekly" | "monthly" | "custom";

export default function ReportsPage() {
    const [reportType, setReportType] = useState<ReportType>("daily");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [generating, setGenerating] = useState(false);
    const [reportUrl, setReportUrl] = useState<string | null>(null);
    const [reports, setReports] = useState<Array<{id:string;type:string;date:string;status:string;url?:string}>>([]);

  async function handleGenerate() {
        setGenerating(true); setReportUrl(null);
        try {
                const result = await api.generateReport({ type: reportType, start_date: startDate || undefined, end_date: endDate || undefined });
                setReportUrl(result.download_url);
                setReports(prev => [{ id: result.id, type: reportType, date: new Date().toISOString(), status: "completed", url: result.download_url }, ...prev]);
        } catch (e) { console.error("Failed:", e); } finally { setGenerating(false); }
  }

  return (
        <div className="space-y-6">
              <div><h1 className="text-2xl font-bold tracking-tight">Reports</h1>h1><p className="text-gray-500 mt-1 text-sm">Generate and download analytics reports</p>p></div>div>
        
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-white/5 p-6">
                      <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2"><FileText className="w-4 h-4 text-orange-500" /> Generate Report</h3>h3>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                            <label className="block text-xs text-gray-500 mb-1.5">Report Type</label>label>
                                            <div className="relative"><select value={reportType} onChange={(e) => setReportType(e.target.value as ReportType)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-200 appearance-none focus:outline-none focus:border-orange-500/50"><option value="daily">Daily</option>option><option value="weekly">Weekly</option>option><option value="monthly">Monthly</option>option><option value="custom">Custom Range</option>option></select>select><ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-500 pointer-events-none" /></div>div>
                                </div>div>
                        {reportType === "custom" && (<><div><label className="block text-xs text-gray-500 mb-1.5">Start Date</label>label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-orange-500/50" /></div>div><div><label className="block text-xs text-gray-500 mb-1.5">End Date</label>label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-orange-500/50" /></div>div></>>)}
                                <div className="flex items-end"><button onClick={handleGenerate} disabled={generating} className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors">{generating ? "Generating..." : "Generate Report"}</button>button></div>div>
                      </div>div>
                {reportUrl && (<div className="mt-4 flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3"><Download className="w-4 h-4 text-emerald-400" /><span className="text-sm text-emerald-400">Report ready!</span>span><a href={reportUrl} className="text-sm text-orange-400 hover:text-orange-300 underline ml-auto">Download</a>a></div>div>)}
              </div>div>
        
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-white/5 p-6">
                      <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-orange-500" /> Recent Reports</h3>h3>
                {reports.length === 0 ? (<div className="text-center py-12"><FileText className="w-10 h-10 mx-auto mb-3 text-gray-700" /><p className="text-gray-500 text-sm">No reports generated yet</p>p><p className="text-gray-600 text-xs mt-1">Generate your first report above</p>p></div>div>
                                                 ) : (<div className="divide-y divide-white/5">{reports.map((r) => (<div key={r.id} className="flex items-center justify-between py-3"><div className="flex items-center gap-3"><Calendar className="w-4 h-4 text-gray-500" /><div><p className="text-sm text-gray-300">{r.type.charAt(0).toUpperCase() + r.type.slice(1)} Report</p>p><p className="text-xs text-gray-600">{new Date(r.date).toLocaleString()}</p>p></div>div></div>div><div className="flex items-center gap-2"><span className={`text-xs px-2 py-0.5 rounded-full ${r.status==="completed"?"bg-emerald-500/10 text-emerald-400":"bg-amber-500/10 text-amber-400"}`}>{r.status}</span>span>{r.url && <a href={r.url} className="text-orange-400 hover:text-orange-300"><Download className="w-4 h-4" /></a>a>}</div>div></div>div>))}</div>div>)}
              </div>div>
        </div>div>
      );
}</></div>
