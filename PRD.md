# Product Requirements Document — Petro
### Personal Vehicle Management App

**Version:** 1.0  
**Date:** 2026-04-13  
**Status:** Draft

---

## 1. Overview

Petro is a simple personal vehicle management web application. It allows a single authenticated user to track their vehicles, log fuel fill-ups, and record maintenance/service history. The focus is on simplicity and clarity — no complex features, no social or sharing functionality.

---

## 2. Goals

- Give a user a single place to track all their vehicles.
- Make it easy to log a fuel fill-up or a maintenance event in under 30 seconds.
- Show a simple at-a-glance dashboard with summary stats and recent activity.

---

## 3. Non-Goals (Out of Scope for v1)

- Reminders or push notifications
- Insurance or registration tracking
- Document / photo uploads
- Sharing vehicles with other users
- Charts or analytics dashboards
- Mobile native app
- Multi-currency or unit switching per session
- Mileage / trip tracking

---

## 4. Users

Single authenticated user per account. Auth is handled via Supabase (email + password). Each user can only see and manage their own data — enforced via Supabase Row Level Security (RLS).

---

## 5. Tech Stack

| Layer       | Technology                            |
|-------------|---------------------------------------|
| Frontend    | Next.js 14 (App Router, TypeScript)   |
| Styling     | TailwindCSS                           |
| Backend/DB  | Supabase (Auth + PostgreSQL + RLS)    |
| Deployment  | Vercel                                |

---

## 6. Data Models

### 6.1 `vehicles`

| Column           | Type        | Notes                          |
|------------------|-------------|--------------------------------|
| id               | uuid (PK)   | auto-generated                 |
| user_id          | uuid (FK)   | references auth.users          |
| make             | text        | e.g. "Toyota"                  |
| model            | text        | e.g. "Corolla"                 |
| year             | integer     | e.g. 2019                      |
| nickname         | text        | optional, e.g. "The Beast"     |
| license_plate    | text        | optional                       |
| initial_odometer | integer     | km, entered at vehicle creation|
| created_at       | timestamptz | auto                           |

### 6.2 `fuel_logs`

| Column      | Type        | Notes                       |
|-------------|-------------|-----------------------------|
| id          | uuid (PK)   | auto-generated              |
| user_id     | uuid (FK)   | references auth.users       |
| vehicle_id  | uuid (FK)   | references vehicles(id)     |
| date        | date        | fill-up date                |
| odometer    | integer     | km at fill-up               |
| liters      | numeric     | volume filled (L)           |
| cost        | numeric     | total cost in €             |
| created_at  | timestamptz | auto                        |

### 6.3 `maintenance_logs`

| Column       | Type        | Notes                                                                 |
|--------------|-------------|-----------------------------------------------------------------------|
| id           | uuid (PK)   | auto-generated                                                        |
| user_id      | uuid (FK)   | references auth.users                                                 |
| vehicle_id   | uuid (FK)   | references vehicles(id)                                               |
| date         | date        | service date                                                          |
| odometer     | integer     | km at service                                                         |
| service_type | text        | one of: Oil Change, Tire Rotation, Brake Service, Battery, Air Filter, General Inspection, Other |
| notes        | text        | optional free-text notes                                              |
| cost         | numeric     | total cost in €                                                       |
| created_at   | timestamptz | auto                                                                  |

---

## 7. Pages & Routes

| Route                              | Description                                      |
|------------------------------------|--------------------------------------------------|
| `/login`                           | Login page (email + password)                    |
| `/signup`                          | Sign up page                                     |
| `/` (dashboard)                    | Home: summary stats + recent activity            |
| `/vehicles`                        | List of all vehicles                             |
| `/vehicles/new`                    | Add a new vehicle                                |
| `/vehicles/[id]`                   | Vehicle detail: info + quick links to logs       |
| `/vehicles/[id]/fuel`              | Fuel log list + add entry form for this vehicle  |
| `/vehicles/[id]/maintenance`       | Maintenance log list + add entry form            |

All routes except `/login` and `/signup` are protected — unauthenticated users are redirected to `/login`.

---

## 8. Feature Specifications

### 8.1 Authentication

- Email + password sign up and login via Supabase Auth.
- On successful login → redirect to `/` (dashboard).
- On logout → redirect to `/login`.
- Auth state is managed server-side via Supabase SSR helpers and Next.js middleware.

### 8.2 Dashboard (`/`)

Displayed after login. Shows:

**Summary Stats (top row):**
- Total vehicles
- Total fuel logs
- Total maintenance logs

**Recent Activity (below stats):**
- Last 5 events across all vehicles (fuel logs and maintenance logs combined), sorted by date descending.
- Each row shows: vehicle name, event type, date, cost.

### 8.3 Vehicles

**List (`/vehicles`):**
- Cards or table rows, one per vehicle.
- Each shows: nickname (or make+model), year, license plate, initial odometer.
- Links to vehicle detail page.
- Button to add new vehicle.
- Delete button (with confirmation) per vehicle — cascades to its logs.

**Add (`/vehicles/new`):**
- Form fields: Make*, Model*, Year*, Nickname (optional), License Plate (optional), Initial Odometer (km)*.
- On submit → redirect to `/vehicles`.

**Detail (`/vehicles/[id]`):**
- Shows vehicle info.
- Two buttons: "Fuel Logs" and "Maintenance Logs".

### 8.4 Fuel Log (`/vehicles/[id]/fuel`)

- Table of all fuel entries for this vehicle, newest first.
- Columns: Date, Odometer (km), Liters, Cost (€), Cost per Liter (calculated).
- At the top: summary — total fill-ups, average cost per fill-up (€).
- "Add Fill-Up" button opens a form (inline or on same page):
  - Fields: Date*, Odometer (km)*, Liters*, Cost (€)*.
- Delete entry (with confirmation).

### 8.5 Maintenance Log (`/vehicles/[id]/maintenance`)

- Table of all maintenance entries for this vehicle, newest first.
- Columns: Date, Odometer (km), Service Type, Notes, Cost (€).
- "Add Service" button opens a form:
  - Fields: Date*, Odometer (km)*, Service Type* (dropdown), Notes (textarea, optional), Cost (€)*.
  - Service type options: Oil Change, Tire Rotation, Brake Service, Battery, Air Filter, General Inspection, Other.
- Delete entry (with confirmation).

---

## 9. Security

- All database tables have Row Level Security (RLS) enabled.
- Every policy checks `auth.uid() = user_id` — users can only read/write their own rows.
- Supabase service role key is never exposed to the client.

---

## 10. Units & Formatting

| Concern   | Value       |
|-----------|-------------|
| Distance  | km          |
| Volume    | liters (L)  |
| Currency  | Euro (€)    |
| Date      | DD/MM/YYYY (display), ISO in DB |

---

## 11. Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Both are safe to expose to the client (public). RLS enforces data isolation.

---

## 12. Deployment

- Deployed on Vercel.
- Environment variables set in Vercel project settings.
- No special build configuration required beyond standard Next.js defaults.

---

## 13. File Structure (planned)

```
/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx          ← protected layout with navbar
│   │   ├── page.tsx            ← dashboard
│   │   ├── vehicles/
│   │   │   ├── page.tsx        ← vehicle list
│   │   │   ├── new/page.tsx    ← add vehicle
│   │   │   └── [id]/
│   │   │       ├── page.tsx    ← vehicle detail
│   │   │       ├── fuel/page.tsx
│   │   │       └── maintenance/page.tsx
├── components/
│   ├── Navbar.tsx
│   ├── StatCard.tsx
│   ├── ActivityFeed.tsx
│   └── forms/
│       ├── VehicleForm.tsx
│       ├── FuelForm.tsx
│       └── MaintenanceForm.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts           ← browser client
│   │   └── server.ts           ← server client (SSR)
│   └── types.ts                ← shared TypeScript types
├── middleware.ts                ← auth route protection
├── supabase/
│   └── migrations/
│       └── 001_initial.sql     ← all tables + RLS policies
├── .env.example
└── PRD.md
```

---

## 14. Acceptance Criteria

- [ ] User can sign up and log in with email + password.
- [ ] User can add, view, and delete vehicles.
- [ ] User can log fuel fill-ups per vehicle and see history.
- [ ] User can log maintenance events per vehicle and see history.
- [ ] Dashboard shows correct counts and the 5 most recent events.
- [ ] All data is scoped to the authenticated user (RLS enforced).
- [ ] App builds and deploys to Vercel without errors.
- [ ] `.env.example` documents all required environment variables.
