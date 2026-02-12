# 🔥 FireSight — AI Video Analytics Platform

### By Firewire Networks Ltd

> **AI-powered CCTV analytics for construction, industrial & commercial sites.**
> Detect people, vehicles, machinery, PPE violations, fire, smoke, accidents, intrusions, and falls — in real time.

---

## 🎯 What is FireSight?

FireSight is an AI-powered CCTV video analytics platform that processes live or recorded camera feeds to detect and log security and safety incidents. It works with any existing RTSP/IP camera — no proprietary hardware required.

**Target Market:** Construction sites, industrial facilities, commercial properties, warehouses, transport hubs, retail.

**Key Differentiator:** The only AI video analytics platform purpose-built for construction and industrial use, self-hostable on a Mac Mini, starting at £49/month with no hardware lock-in.

---

## 🔍 Detection Categories (10)

| # | Category | Description | Severity |
|---|----------|-------------|----------|
| 1 | 👤 Human | Presence, counting, tracking | Low |
| 2 | 🚗 Vehicle | Cars, trucks, buses, motorcycles | Low |
| 3 | 🏗️ Plant/Machinery | Excavators, forklifts, cranes, bulldozers | Medium |
| 4 | 🚲 Bicycle | Bikes, e-scooters, micro-mobility | Low |
| 5 | 🦺 PPE Violations | Missing hard hat, hi-vis, goggles, gloves | High |
| 6 | 🔥 Fire | Flames, fire events | Critical |
| 7 | 💨 Smoke | Early smoke warning | High |
| 8 | 💥 Accident | Vehicle/plant collisions | Critical |
| 9 | 🚨 Intrusion | Unauthorised entry to restricted zones | High |
| 10 | ⬇️ Fall | Person down detection | Critical |

---

## ⚡ Features (30+)

### Core Detection & Logging
- Real-time YOLO detection across all 10 categories
- Multi-object tracking (IoU-based)
- Event rules engine (falls, accidents, intrusions)
- Incident logging with timestamps, confidence, thumbnails, clips
- Incident status workflow (new → reviewing → confirmed → resolved / false alarm)

### Advanced Analytics
- **Natural Language Search** — "show me forklifts near gate yesterday"
- **Video Synopsis** — condense hours into short event summaries
- **Activity Heatmaps** — visualise detection concentration
- **Speed Estimation** — vehicle speed with camera calibration
- **Crowd Density** — people counting and density alerts
- **Dwell Time Analytics** — zone time tracking and alerts
- **Incident Timeline** — visual journey of tracked objects
- **ANPR** — automatic number plate recognition

### Camera Management
- BYOC — works with any RTSP/IP camera or video file
- Camera CRUD with detection category selection
- Zone drawing (restricted/monitoring zones)
- Camera health monitoring
- Scheduled detection (auto on/off by day/time)
