# Cybersecurity Operations Center (SOC) Web Application

An enterprise-grade Security Operations Center (SOC) web application built with **Next.js (App Router)**, **TypeScript**, and **Tailwind CSS**. It serves as the primary operational console for security analysts to monitor Windows security event telemetry, triage alerts, manage multi-host incidents, track host risk, and run AI-assisted threat investigations.

---

## 1. Core Security Pipeline Architecture

```
TEST ATTACK / TELEMETRY
          ↓
WINDOWS EVENT LOGS (4624, 4625, 4688, 7045, 4672, 1102)
          ↓
EVENT COLLECTOR
          ↓
FASTAPI BACKEND
          ↓
POSTGRESQL DATABASE
          ↓
SIGMA / SIEM DETECTION RULES
          ↓
ALERT GENERATION (ALT-XXXX)
          ↓
INCIDENT CORRELATION (INC-XXXX)
          ↓
AI REASONING AGENT (Simulated Investigation Pipeline)
          ↓
INVESTIGATION & COMPLIANCE REPORT (REP-XXXX)
          ↓
SOC DASHBOARD & ANALYST CONSOLE
```

---

## 2. Frontend Architecture & Service Layer Abstraction

The frontend strictly enforces a **Service-Repository Pattern** via the `ISecurityService` interface. This allows zero UI disruption when switching between **Mock Demo Mode** and a **Live FastAPI Backend**:

```
                 [ React UI Components / App Router Pages ]
                                     │
                 [ Custom Hooks & Component State Handlers ]
                                     │
                 [ ISecurityService (Contract Interface) ]
                                     ├───► [ MockSecurityService (Correlated MITRE ATT&CK Dataset) ]
                                     └───► [ HttpSecurityService (REST API Client / FastAPI) ]
```

### Data Modes:
- **DEMO MODE (Simulated Dataset):** Self-contained, stateful in-memory and local mock dataset representing a realistic multi-stage lateral movement attack.
- **LIVE API MODE (FastAPI):** Direct connection to FastAPI REST endpoints backed by PostgreSQL.

---

## 3. Project Folder Structure

```
soc-platform/
├── public/
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── layout.tsx                     # Global Root Layout (Fonts, Global AppLayout Shell)
│   │   ├── page.tsx                       # Root Redirect to /dashboard
│   │   ├── globals.css                    # SOC Design System CSS Variables & Tokens
│   │   ├── dashboard/page.tsx             # Central SOC Overview & KPI Dashboard
│   │   ├── alerts/
│   │   │   ├── page.tsx                   # Alerts Triage Queue
│   │   │   └── [id]/page.tsx              # Alert Detail & Evidence Drilldown
│   │   ├── incidents/
│   │   │   ├── page.tsx                   # Incident Command Center
│   │   │   └── [id]/page.tsx              # Incident Workspace & Pipeline Timeline
│   │   ├── events/page.tsx                # High-Density Windows Event Telemetry
│   │   ├── threat-intel/page.tsx          # Threat Intelligence IOC Explorer
│   │   ├── ai-analyst/page.tsx            # AI Investigation Workbench
│   │   ├── reports/page.tsx               # Investigation & Incident Reports
│   │   ├── assets/
│   │   │   ├── page.tsx                   # Asset Inventory & Risk Register
│   │   │   └── [id]/page.tsx              # Host Security Profile & Isolation
│   │   ├── rules/page.tsx                 # SIEM Detection Rules Catalog
│   │   └── settings/page.tsx              # SOC Settings & Pipeline Health
│   ├── components/
│   │   ├── shell/
│   │   │   ├── AppLayout.tsx              # Shell Container
│   │   │   ├── Header.tsx                 # Breadcrumb, UTC Clock, Search, Mode Toggle
│   │   │   └── Sidebar.tsx                # Grouped Collapsible Navigation
│   │   └── common/
│   │       ├── SeverityBadge.tsx          # Standardized Severity Tags (Critical/High/Med/Low/Healthy)
│   │       ├── StatusBadge.tsx            # Lifecycle & Simulated Threat Verdicts
│   │       ├── MetricCard.tsx             # Telemetry Metric Card
│   │       ├── DataTable.tsx              # Paginated & Filterable High-Density Table
│   │       ├── JsonViewer.tsx             # Raw XML/JSON Event Inspector
│   │       ├── ConfirmationModal.tsx      # Guardrails for Critical Actions
│   │       ├── ModeToggleBadge.tsx        # In-App Demo/Live Switcher
│   │       ├── ErrorState.tsx             # Fallback Container
│   │       ├── EmptyState.tsx             # Empty State Container
│   │       └── LoadingSkeleton.tsx        # High-Fidelity Loading States
│   ├── services/
│   │   ├── api.interface.ts               # ISecurityService Specification
│   │   ├── mock.data.ts                   # Correlated Simulated Security Dataset
│   │   ├── mock.service.ts                # Mock Provider
│   │   ├── http.service.ts                # HTTP FastAPI Provider
│   │   └── index.ts                       # Service Factory Singleton
│   ├── types/
│   │   ├── security.ts                    # Core Security Domain Models
│   │   ├── events.ts                      # Windows Security Event Schemas
│   │   ├── rules.ts                       # Detection Rule & Sigma Schemas
│   │   └── threatIntel.ts                 # IOC Models
│   └── lib/
│       └── utils.ts                       # Formatters & Class Merge Utilities
├── package.json
├── tsconfig.json
└── README.md
```

---

## 4. AI Analyst Investigation Workflow

The AI Analyst simulates an autonomous investigative workflow with strict separation between empirical facts and AI inferences:

```
QUEUED 
  ↓ 
COLLECTING EVIDENCE (Gathering Windows Event logs)
  ↓ 
CORRELATING EVENTS (Linking WKS-FIN-04 to DC-CORP-01)
  ↓ 
ANALYZING DETECTION RULES (Evaluating Sigma matches)
  ↓ 
MAPPING MITRE ATT&CK (T1078, T1059.001, T1021.002, T1070.001)
  ↓ 
ASSESSING RISK (Calculating 96/100 composite risk score)
  ↓ 
GENERATING REPORT (Producing REP-2026-0421)
  ↓ 
COMPLETED
```

### Strict Information Separation:
1. **OBSERVED EVIDENCE:** Corroborated Windows event timestamps, actual command-line arguments, hostnames, and IP addresses.
2. **SIMULATED AI ASSESSMENT:** Inferred attack pattern, threat actor attribution estimate, and confidence rating explicitly marked with `Assessment confidence — simulated`.
3. **RECOMMENDED ACTIONS:** Host isolation, KRBTGT credential rotation, perimeter IP blocking, and AppLocker hardening.

---

## 5. API Contracts (FastAPI & PostgreSQL Ready)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard/stats` | KPI metrics (Critical Alerts, High Alerts, Active Incidents, 24h Event Volume) |
| `GET` | `/api/dashboard/activity-chart` | Time-bucketed security telemetry frequency |
| `GET` | `/api/alerts` | Paginated alerts with severity, status, and search filters |
| `GET` | `/api/alerts/{id}` | Alert details with associated raw event logs |
| `PATCH`| `/api/alerts/{id}/status` | Update alert triage status |
| `POST` | `/api/alerts/{id}/escalate` | Escalate an alert to an active Incident |
| `GET` | `/api/incidents` | Incident response queue |
| `GET` | `/api/incidents/{id}` | Full incident workspace & 5-stage pipeline timeline |
| `POST` | `/api/incidents/{id}/ai-investigate` | Trigger AI reasoning investigation on incident |
| `GET` | `/api/incidents/{id}/report` | Retrieve formal investigation report |
| `GET` | `/api/events` | High-density Windows security log stream |
| `GET` | `/api/assets` | Host asset inventory and risk scores |
| `POST` | `/api/assets/{id}/isolation` | Quarantine or release host from network |
| `GET` | `/api/rules` | SIEM detection rules database |
| `PATCH`| `/api/rules/{id}/status` | Toggle detection rule state |
| `GET` | `/api/threat-intel` | Threat indicators (IP, Hash, Domain) from Demo Threat Intel Feed |
| `GET` | `/api/system/health` | Status of API, Event Collector, PostgreSQL, and AI Engine |

---

## 6. How to Run the Application

### 1. Install Dependencies
```bash
npm.cmd install
```

### 2. Run Development Server
```bash
npm.cmd run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build for Production
```bash
npm.cmd run build
```

---

## 7. How to Switch Between Demo and Live Mode

1. **In-App Toggle:** Click the **`DEMO MODE (Simulated)`** badge in the top right header, or navigate to **Settings** (`/settings`) to switch modes.
2. **Environment Variable:** Set `NEXT_PUBLIC_DATA_MODE=live` or `NEXT_PUBLIC_DATA_MODE=mock` in your `.env.local` file.
