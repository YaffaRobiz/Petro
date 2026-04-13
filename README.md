# Petro — Personal Vehicle Management App

Petro is a simple personal web app for tracking your vehicles, fuel fill-ups, and maintenance history — all in one place.

## Features

- **Auth** — Secure sign up and login with email + password (Supabase Auth)
- **Vehicles** — Add and manage your vehicles (make, model, year, fuel type, license plate, odometer)
- **Fuel Logs** — Track fill-ups with date, odometer, liters, and cost. See cost per liter and running totals.
- **Maintenance Logs** — Log services (oil change, tires, brakes, etc.) with date, odometer, cost, and notes
- **Dashboard** — At-a-glance summary stats and a recent activity feed across all your vehicles

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router, TypeScript) |
| Styling | TailwindCSS |
| Backend / DB | Supabase (Auth + PostgreSQL + RLS) |
| Deployment | Vercel |

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/YaffaRobiz/Petro.git
cd Petro
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the migration below to create the tables and RLS policies:

```sql
-- vehicles
create table if not exists vehicles (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  make              text not null,
  model             text not null,
  year              integer not null,
  fuel_type         text not null default 'Petrol',
  nickname          text,
  license_plate     text not null,
  initial_odometer  integer not null default 0,
  created_at        timestamptz not null default now(),
  constraint vehicles_user_license_plate_unique unique (user_id, license_plate)
);
alter table vehicles enable row level security;
create policy "users can manage their own vehicles"
  on vehicles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- fuel_logs
create table if not exists fuel_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  vehicle_id  uuid not null references vehicles(id) on delete cascade,
  date        date not null,
  odometer    integer not null,
  liters      numeric(8,2) not null,
  cost        numeric(8,2) not null,
  created_at  timestamptz not null default now()
);
alter table fuel_logs enable row level security;
create policy "users can manage their own fuel logs"
  on fuel_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- maintenance_logs
create table if not exists maintenance_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  vehicle_id    uuid not null references vehicles(id) on delete cascade,
  date          date not null,
  odometer      integer not null,
  service_type  text not null,
  notes         text,
  cost          numeric(8,2) not null,
  created_at    timestamptz not null default now()
);
alter table maintenance_logs enable row level security;
create policy "users can manage their own maintenance logs"
  on maintenance_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Find both values in your Supabase project under **Settings → API**.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploying to Vercel

1. Push the repo to GitHub
2. Import the project in [vercel.com](https://vercel.com)
3. Add the two environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in the Vercel project settings
4. Deploy
