# 🔥 FireSight — AI Video Analytics Platform

### By Firewire Networks Ltd

> **AI-powered CCTV analytics for construction, industrial & commercial sites.**
> > Detect people, vehicles, machinery, PPE violations, fire, smoke, accidents, intrusions, and falls — in real time.
> >
> > ---
> >
> > ## 🎯 What is FireSight?
> >
> > FireSight is an AI-powered CCTV video analytics platform that processes live or recorded camera feeds to detect and log security and safety incidents. It works with any existing RTSP/IP camera — no proprietary hardware required.
> >
> > **Target Market:** Construction sites, industrial facilities, commercial properties, warehouses, transport hubs, retail.
> >
> > **Key Differentiator:** The only AI video analytics platform purpose-built for construction and industrial use, self-hostable on a Mac Mini, starting at £49/month with no hardware lock-in.
> >
> > ---
> >
> > ## 🔍 Detection Categories (10)
> >
> > | # | Category | Description | Severity |
> > |---|----------|-------------|----------|
> > | 1 | 👤 Human | Presence, counting, tracking | Low |
> > | 2 | 🚗 Vehicle | Cars, trucks, buses, motorcycles | Low |
> > | 3 | 🏗️ Plant/Machinery | Excavators, forklifts, cranes, bulldozers | Medium |
> > | 4 | 🚲 Bicycle | Bikes, e-scooters, micro-mobility | Low |
> > | 5 | 🦺 PPE Violations | Missing hard hat, hi-vis, goggles, gloves | High |
> > | 6 | 🔥 Fire | Flames, fire events | Critical |
> > | 7 | 💨 Smoke | Early smoke warning | High |
> > | 8 | 💥 Accident | Vehicle/plant collisions | Critical |
> > | 9 | 🚨 Intrusion | Unauthorised entry to restricted zones | High |
> > | 10 | ⬇️ Fall | Person down detection | Critical |
> >
> > ---
> >
> > ## ⚡ Features (30+)
> >
> > ### Core Detection & Logging
> > - Real-time YOLO detection across all 10 categories
> > - - Multi-object tracking (IoU-based)
> >   - - Event rules engine (falls, accidents, intrusions)
> >     - - Incident logging with timestamps, confidence, thumbnails, clips
> >       - - Incident status workflow (new → reviewing → confirmed → resolved / false alarm)
> >        
> >         - ### Advanced Analytics
> >         - - **Natural Language Search** — "show me forklifts near gate yesterday"
> >           - - **Video Synopsis** — condense hours into short event summaries
> >             - - **Activity Heatmaps** — visualise detection concentration
> >               - - **Speed Estimation** — vehicle speed with camera calibration
> >                 - - **Crowd Density** — people counting and density alerts
> >                   - - **Dwell Time Analytics** — zone time tracking and alerts
> >                     - - **Incident Timeline** — visual journey of tracked objects
> >                       - - **ANPR** — automatic number plate recognition
> >                        
> >                         - ### Camera Management
> >                         - - BYOC — works with any RTSP/IP camera or video file
> >                           - - Camera CRUD with detection category selection
> >                             - - Zone drawing (restricted/monitoring zones)
> >                               - - Camera health monitoring
> >                                 - - Scheduled detection (auto on/off by day/time)
> >                                  
> >                                   - ### Alerts & Integrations
> >                                   - - Email alerts with branded HTML template
> >                                     - - Slack, Microsoft Teams, PagerDuty integration
> >                                       - - Generic webhook (POST JSON)
> >                                         - - Per-category alert rules with severity filtering
> >                                           - - Cooldown periods to prevent alert spam
> >                                            
> >                                             - ### Reporting
> >                                             - - Dashboard with stats cards, category breakdown, hourly chart
> >                                               - - PDF report generation (branded)
> >                                                 - - CSV export
> >                                                   - - Filtering by date range, camera, category
> >                                                    
> >                                                     - ---
> >
> > ## 🛠 Tech Stack
> >
> > | Layer | Technology |
> > |-------|-----------|
> > | AI Models | YOLOv8/v11 (Ultralytics) |
> > | Object Tracking | IoU-based custom tracker |
> > | Video Processing | OpenCV + FFmpeg |
> > | Backend API | FastAPI (Python 3.11+) |
> > | Task Queue | Celery + Redis |
> > | Frontend | Next.js 14 + Tailwind CSS |
> > | Real-time | WebSockets |
> > | Database | PostgreSQL 16 |
> > | Cache | Redis 7 |
> > | Object Storage | MinIO (self-hosted) / S3 |
> > | Reports | ReportLab (PDF), CSV |
> > | Deployment | Docker Compose |
> > | Target Hardware | Apple Mac Mini (M-series) |
> >
> > ---
> >
> > ## 📁 Project Structure
> >
> > ```
> > firesight/
> > ├── backend/
> > │   ├── app/
> > │   │   ├── __init__.py
> > │   │   ├── main.py              # FastAPI application entry point
> > │   │   ├── config.py            # Settings & environment config
> > │   │   ├── database.py          # PostgreSQL connection & session
> > │   │   ├── models.py            # SQLAlchemy ORM models
> > │   │   ├── schemas.py           # Pydantic request/response schemas
> > │   │   ├── routers/
> > │   │   │   ├── cameras.py       # Camera CRUD endpoints
> > │   │   │   ├── incidents.py     # Incident management
> > │   │   │   ├── detection.py     # Start/stop detection
> > │   │   │   ├── reports.py       # PDF/CSV reports
> > │   │   │   ├── websocket.py     # Live feed WebSocket
> > │   │   │   ├── features.py      # Heatmap, timelapse, sharing
> > │   │   │   └── settings.py      # Camera AI settings
> > │   │   ├── detection/
> > │   │   │   ├── engine.py        # YOLO detection engine
> > │   │   │   ├── tracker.py       # IoU object tracker
> > │   │   │   ├── event_rules.py   # Fall, accident, intrusion rules
> > │   │   │   ├── categories.py    # Detection category definitions
> > │   │   │   ├── fire_smoke.py    # Fire & smoke detection
> > │   │   │   ├── anpr.py          # Number plate recognition
> > │   │   │   ├── crowd_density.py # Crowd counting & density
> > │   │   │   ├── speed_estimator.py # Vehicle speed estimation
> > │   │   │   └── dwell_time.py    # Zone dwell time tracking
> > │   │   ├── services/
> > │   │   │   ├── alert_service.py
> > │   │   │   ├── clip_service.py
> > │   │   │   ├── report_service.py
> > │   │   │   ├── search_service.py
> > │   │   │   ├── synopsis_service.py
> > │   │   │   ├── heatmap_service.py
> > │   │   │   ├── timelapse_service.py
> > │   │   │   ├── timeline_service.py
> > │   │   │   ├── share_service.py
> > │   │   │   ├── health_service.py
> > │   │   │   ├── scheduler_service.py
> > │   │   │   └── integrations.py
> > │   │   └── utils/
> > │   │       └── video.py
> > │   ├── requirements.txt
> > │   └── Dockerfile
> > ├── frontend/
> > │   ├── package.json
> > │   ├── next.config.js
> > │   ├── tailwind.config.js
> > │   ├── src/
> > │   │   ├── app/
> > │   │   │   ├── layout.tsx
> > │   │   │   ├── globals.css
> > │   │   │   ├── page.tsx          # Dashboard
> > │   │   │   ├── live/page.tsx
> > │   │   │   ├── incidents/page.tsx
> > │   │   │   ├── cameras/page.tsx
> > │   │   │   ├── reports/page.tsx
> > │   │   │   ├── heatmap/page.tsx
> > │   │   │   ├── health/page.tsx
> > │   │   │   ├── settings/page.tsx
> > │   │   │   └── shared/[token]/page.tsx
> > │   │   ├── components/
> > │   │   │   ├── Sidebar.tsx
> > │   │   │   ├── Header.tsx
> > │   │   │   ├── StatsCards.tsx
> > │   │   │   ├── IncidentTable.tsx
> > │   │   │   ├── LiveFeed.tsx
> > │   │   │   ├── CameraCard.tsx
> > │   │   │   ├── SearchBar.tsx
> > │   │   │   ├── ConfidenceTuner.tsx
> > │   │   │   └── OnboardingWizard.tsx
> > │   │   └── lib/
> > │   │       └── api.ts
> > │   └── public/
> > │       └── firesight-logo.svg
> > ├── docker-compose.yml
> > ├── .env.example
> > └── README.md
> > ```
> >
> > ---
> >
> > ## 🗄 Database Schema
> >
> > ### Core Tables
> > - **cameras** — id, name, location, stream_url, is_active, detection_enabled, detection_categories, zones
> > - - **incidents** — id, camera_id, category, severity, status, confidence, description, bbox_data, thumbnail_path, clip_path, detected_at, reviewed_by, notes
> >   - - **alert_rules** — id, name, category, min_severity, alert_type, destination, cooldown_seconds
> >     - - **detection_sessions** — id, camera_id, started_at, ended_at, frames_processed, incidents_detected, status
> >       - - **sites** — id, name, address, lat, lng, timezone, contact_info
> >         - - **integrations** — id, name, type, destination, is_active, categories, min_severity, cooldown
> >           - - **shared_clips** — id, share_token, incident_id, clip/thumb paths, expiry, password_hash, view_count
> >             - - **detection_schedules** — id, camera_id, days_of_week, start/end time, categories, enhanced_sensitivity
> >               - - **speed_logs** — id, camera_id, track_id, speed_kmh/mph, limit, is_violation
> >                 - - **dwell_logs** — id, camera_id, zone_name, track_id, entered/departed, dwell_seconds, threshold_exceeded
> >                   - - **crowd_snapshots** — id, camera_id, people_count, density_level, density_per_sqm, threshold_exceeded
> >                    
> >                     - ---
> >
> > ## 🚀 Quick Start
> >
> > ### Prerequisites
> > - Python 3.11+
> > - - Node.js 18+
> >   - - Docker & Docker Compose
> >     - - Apple Mac Mini (M-series) recommended
> >      
> >       - ### 1. Clone the repository
> >       - ```bash
> >         git clone https://github.com/M33HAN/FireSight.git
> >         cd FireSight
> >         ```
> >
> > ### 2. Set up environment
> > ```bash
> > cp .env.example .env
> > # Edit .env with your configuration
> > ```
> >
> > ### 3. Start infrastructure
> > ```bash
> > docker-compose up -d
> > ```
> >
> > ### 4. Start backend
> > ```bash
> > cd backend
> > pip install -r requirements.txt
> > uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
> > ```
> >
> > ### 5. Start frontend
> > ```bash
> > cd frontend
> > npm install
> > npm run dev
> > ```
> >
> > ### 6. Open dashboard
> > Navigate to `http://localhost:3000`
> >
> > ---
> >
> > ## 💰 Subscription Tiers
> >
> > | Feature | Starter (£49/mo) | Pro (£149/mo) | Enterprise (£349/mo) |
> > |---------|:-:|:-:|:-:|
> > | Cameras | 4 | 16 | Unlimited |
> > | Core Detection | ✅ | ✅ | ✅ |
> > | PPE & Accident | ❌ | ✅ | ✅ |
> > | Custom Zones | ❌ | ✅ | ✅ |
> > | Clip Storage | 7 days | 30 days | 90 days |
> > | Alerts | Email | Email + Slack/Teams/Webhook | All + Priority |
> > | Reports | ❌ | PDF/CSV + Heatmaps | Full Suite |
> > | Users | 1 | 5 | Unlimited |
> > | API Access | ❌ | ❌ | ✅ |
> > | Custom Models | ❌ | ❌ | ✅ |
> >
> > ---
> >
> > ## 📡 API Endpoints
> >
> > | Method | Endpoint | Description |
> > |--------|----------|-------------|
> > | GET | `/api/cameras` | List cameras |
> > | POST | `/api/cameras` | Add camera |
> > | PUT | `/api/cameras/{id}` | Update camera |
> > | DELETE | `/api/cameras/{id}` | Delete camera |
> > | POST | `/api/cameras/{id}/toggle` | Toggle AI detection |
> > | GET | `/api/incidents` | List incidents (filtered) |
> > | GET | `/api/incidents/dashboard` | Dashboard stats |
> > | GET | `/api/incidents/search?q=` | Natural language search |
> > | PATCH | `/api/incidents/{id}` | Update incident status |
> > | POST | `/api/detection/start/{id}` | Start live detection |
> > | POST | `/api/detection/stop/{id}` | Stop live detection |
> > | POST | `/api/detection/analyse-video` | Upload & analyse video |
> > | GET | `/api/reports/summary` | Report summary |
> > | GET | `/api/reports/export/csv` | Export CSV |
> > | GET | `/api/reports/export/pdf` | Export PDF |
> > | POST | `/api/features/timelapse/{id}` | Generate timelapse |
> > | GET | `/api/features/heatmap/{id}` | Generate heatmap |
> > | POST | `/api/features/share/{id}` | Create share link |
> > | GET | `/api/features/shared/{token}` | View shared clip |
> > | WS | `/ws/live/{camera_id}` | Live detection WebSocket |
> >
> > ---
> >
> > ## 🎨 Branding
> >
> > | Colour | Hex | Use |
> > |--------|-----|-----|
> > | FireSight Orange | `#FF6B00` | Primary brand, accents, CTAs |
> > | Flame Gold | `#FFB800` | Highlights, active states |
> > | Flame Yellow | `#FFDD44` | Flame core, premium indicators |
> > | Dark Navy | `#1A1A2E` | Dashboard background |
> > | Charcoal | `#16213E` | Cards, panels |
> > | Dark BG | `#0F0F23` | Page background |
> > | White | `#FFFFFF` | Text on dark |
> >
> > ---
> >
> > ## 📋 Roadmap
> >
> > - [x] Phase 1 — MVP: Video upload → YOLO detection → incident log
> > - [ ] - [ ] Phase 2 — Live Streams: RTSP support, WebSocket real-time feed
> > - [ ] - [ ] Phase 3 — Advanced Features: Custom models, zones, alerts, heatmaps
> > - [ ] - [ ] Phase 4 — Polish & Launch: Onboarding, integrations, billing, mobile app
> >
> > - [ ] ---
> >
> > - [ ] ## 📄 License
> >
> > - [ ] © Firewire Networks Ltd. All rights reserved.
> >
> > - [ ] ---
> >
> > - [ ] **FireSight — We see what others miss.** 🔥
