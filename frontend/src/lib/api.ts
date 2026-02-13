/**
 * FireSight API Client
 * Handles all HTTP requests to the FastAPI backend.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws";

// ─── Type Definitions ────────────────────────────────────────────

export interface Camera {
  id: number;
  name: string;
  rtsp_url: string;
  status: "active" | "inactive" | "error";
  location?: string;
  created_at?: string;
}

export interface Incident {
  id: number;
  camera_id: number;
  category: string;
  severity: "critical" | "high" | "medium" | "low";
  confidence: number;
  detected_at: string;
  thumbnail_path?: string;
  clip_path?: string;
  metadata?: Record<string, any>;
}

export interface Detection {
  category: string;
  confidence: number;
  bbox: { x1: number; y1: number; x2: number; y2: number };
  track_id?: number;
}

export interface HealthStatus {
  cpu_percent: number;
  memory_percent: number;
  disk_percent: number;
  gpu_utilization: number;
  gpu_memory_percent: number;
  uptime_seconds: number;
  active_streams: number;
  inference_fps: number;
  db_connections: number;
  redis_connected: boolean;
  minio_connected: boolean;
}

// ─── API Client ──────────────────────────────────────────────────

class FireSightAPI {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private ensureTrailingSlash(endpoint: string): string {
    // Add trailing slash if endpoint doesn't have one and doesn't have query params
    const qIndex = endpoint.indexOf("?");
    if (qIndex === -1) {
      return endpoint.endsWith("/") ? endpoint : endpoint + "/";
    }
    const path = endpoint.substring(0, qIndex);
    const query = endpoint.substring(qIndex);
    return (path.endsWith("/") ? path : path + "/") + query;
  }

  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = this.baseUrl + this.ensureTrailingSlash(endpoint);
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || "API Error: " + response.status);
    }

    return response.json();
  }

  // ── Cameras ──────────────────────────────────────────────────

  async getCameras(): Promise<Camera[]> {
    return this.request<Camera[]>("/cameras");
  }

  async getCamera(id: number): Promise<Camera> {
    return this.request<Camera>("/cameras/" + id);
  }

  async addCamera(data: { name: string; rtsp_url: string; location?: string }): Promise<Camera> {
    return this.request<Camera>("/cameras", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateCamera(id: number, data: Partial<Camera>): Promise<Camera> {
    return this.request<Camera>("/cameras/" + id, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteCamera(id: number): Promise<void> {
    return this.request("/cameras/" + id, { method: "DELETE" });
  }

  // ── Incidents ────────────────────────────────────────────────

  async getIncidents(params?: Record<string, string | number>): Promise<Incident[]> {
    const query = params
      ? "?" + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()
      : "";
    return this.request<Incident[]>("/incidents" + query);
  }

  async getIncident(id: number): Promise<Incident> {
    return this.request<Incident>("/incidents/" + id);
  }

  // ── Detection ────────────────────────────────────────────────

  async getDetectionStatus(): Promise<any> {
    return this.request("/detection/status");
  }

  // ── Reports ──────────────────────────────────────────────────

  async generateReport(data: { type: string; start_date?: string; end_date?: string }): Promise<any> {
    return this.request("/reports/generate", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // ── Health ───────────────────────────────────────────────────

  async getHealth(): Promise<HealthStatus> {
    return this.request<HealthStatus>("/health");
  }

  // ── Heatmap ──────────────────────────────────────────────────

  async getHeatmap(cameraId: number, timeRange: string): Promise<any> {
    return this.request("/heatmap/" + cameraId + "?range=" + timeRange);
  }

  // ── Settings ─────────────────────────────────────────────────

  async getSettings(): Promise<any> {
    return this.request("/settings");
  }

  async updateSettings(data: any): Promise<any> {
    return this.request("/settings", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // ── Features ─────────────────────────────────────────────────

  async getFeatures(): Promise<any> {
    return this.request("/features");
  }

  // ── Search ───────────────────────────────────────────────────

  async search(query: string): Promise<any> {
    return this.request("/search?q=" + encodeURIComponent(query));
  }

  // ── Share ────────────────────────────────────────────────────

  async createShareLink(incidentId: number): Promise<any> {
    return this.request("/share", {
      method: "POST",
      body: JSON.stringify({ incident_id: incidentId }),
    });
  }

  // ── Generic ──────────────────────────────────────────────────

  async get<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint);
  }

  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = any>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async upload(endpoint: string, file: File): Promise<any> {
    const formData = new FormData();
    formData.append("file", file);
    const url = this.baseUrl + this.ensureTrailingSlash(endpoint);
    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      throw new Error("Upload failed: " + response.status);
    }
    return response.json();
  }
}

// ─── WebSocket ─────────────────────────────────────────────────

export function connectLiveFeed(cameraId: number, onMessage: (data: any) => void) {
  const ws = new WebSocket(WS_BASE_URL + "/live/" + cameraId);
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessage(data);
  };
  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
  };
  return ws;
}

export const api = new FireSightAPI(API_BASE_URL);
