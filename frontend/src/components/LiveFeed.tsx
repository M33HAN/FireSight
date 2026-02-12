"use client";

import { useState, useEffect, useRef } from "react";
import { Camera } from "@/lib/api";

interface LiveFeedProps {
  camera: Camera;
  large?: boolean;
  onClick?: () => void;
}

export default function LiveFeed({ camera, large = false, onClick }: LiveFeedProps) {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(false);
  const [detections, setDetections] = useState<number>(0);
  const [fps, setFps] = useState<number>(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    connectStream();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [camera.id]);

  function connectStream() {
    setError(false);
    const wsUrl = `ws://${window.location.hostname}:8000/ws/stream/${camera.id}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.frame && imgRef.current) {
            imgRef.current.src = `data:image/jpeg;base64,${data.frame}`;
          }
          if (data.detections !== undefined) {
            setDetections(data.detections);
          }
          if (data.fps !== undefined) {
            setFps(data.fps);
          }
        } catch {
          // Binary frame data
          if (imgRef.current && event.data instanceof Blob) {
            imgRef.current.src = URL.createObjectURL(event.data);
          }
        }
      };

      ws.onerror = () => {
        setError(true);
        setConnected(false);
      };

      ws.onclose = () => {
        setConnected(false);
      };
    } catch {
      setError(true);
    }
  }

  return (
    <div
      className={`relative bg-gray-900 border border-gray-800 rounded-lg overflow-hidden group ${
        onClick ? "cursor-pointer hover:border-orange-500/50" : ""
      } ${large ? "aspect-video" : "aspect-video"}`}
      onClick={onClick}
    >
      {/* Video Frame */}
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-gray-500">
          <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          <p className="text-sm">Connection lost</p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              connectStream();
            }}
            className="mt-2 text-xs text-orange-400 hover:text-orange-300"
          >
            Reconnect
          </button>
        </div>
      ) : (
        <img
          ref={imgRef}
          alt={`Live feed from ${camera.name}`}
          className="w-full h-full object-cover"
          src="/placeholder-camera.jpg"
        />
      )}

      {/* Overlay - Camera Info */}
      <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                connected ? "bg-green-500 animate-pulse" : error ? "bg-red-500" : "bg-yellow-500"
              }`}
            />
            <span className="text-sm font-medium truncate">{camera.name}</span>
          </div>
          {large && (
            <div className="flex items-center gap-3 text-xs text-gray-300">
              <span>{fps.toFixed(0)} FPS</span>
              <span>{detections} detections</span>
            </div>
          )}
        </div>
      </div>

      {/* Overlay - Bottom Info */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center justify-between text-xs text-gray-300">
          <span>{camera.location || "No location"}</span>
          <div className="flex items-center gap-2">
            {detections > 0 && (
              <span className="px-1.5 py-0.5 bg-orange-600 rounded text-white">
                {detections} active
              </span>
            )}
            <span>{connected ? "Live" : "Offline"}</span>
          </div>
        </div>
      </div>

      {/* Live indicator */}
      {connected && (
        <div className="absolute top-3 right-3">
          <span className="flex items-center gap-1 px-2 py-0.5 bg-red-600 rounded text-xs font-medium">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            LIVE
          </span>
        </div>
      )}
    </div>
  );
}
