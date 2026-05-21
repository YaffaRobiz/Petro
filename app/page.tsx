import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import MonthlySpentCard from "@/components/MonthlySpentCard"
import { type MonthlyBreakdown } from "@/components/MonthlyChart"
import FuelConsumptionCard from "@/components/FuelConsumptionCard"
import NewFillUpModal from "@/components/NewFillUpModal"

type TaskStatus = "completed" | "overdue" | "due_soon" | "ok"

function getTaskStatus(
  task: { completed_log_id: string | null; due_date: string | null; expected_odometer: number | null },
  currentOdo: number,
  now: Date,
): TaskStatus {
  if (task.completed_log_id) return "completed"
  if (task.due_date) {
    const days = Math.floor((new Date(task.due_date).getTime() - now.getTime()) / 86400000)
    if (days < 0) return "overdue"
    if (days <= 30) return "due_soon"
    return "ok"
  }
  if (task.expected_odometer !== null) {
    const km = task.expected_odometer - currentOdo
    if (km <= 0) return "overdue"
    if (km <= 1000) return "due_soon"
    return "ok"
  }
  return "ok"
}


export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at")

  if (!vehicles || vehicles.length === 0) redirect("/new-vehicle")

  // Resolve selected vehicle from cookie
  const cookieStore = await cookies()
  const selectedId = cookieStore.get("selected_vehicle_id")?.value
  const vehicle = vehicles.find(v => v.id === selectedId) ?? vehicles[0]

  const now = new Date()
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevMonthName = prevMonth.toLocaleString("en-US", { month: "long" })

  const [fuelRes, maintRes, tasksRes] = await Promise.all([
    supabase
      .from("fuel_logs")
      .select("id, date, cost, vehicle_id, odometer, liters")
      .eq("vehicle_id", vehicle.id)
      .order("date"),
    supabase
      .from("maintenance_logs")
      .select("id, date, cost, vehicle_id, service_type, odometer")
      .eq("vehicle_id", vehicle.id)
      .order("date"),
    supabase
      .from("service_tasks")
      .select("id, service_type, due_date, expected_odometer, completed_log_id")
      .eq("vehicle_id", vehicle.id)
      .order("created_at", { ascending: false }),
  ])

  const fuelLogs = fuelRes.data ?? []
  const maintLogs = maintRes.data ?? []
  const svcTasks = tasksRes.data ?? []

  // Monthly spending Jan–Dec of current year (for bar chart, split by type)
  const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
  const currentMonthIdx = now.getMonth()
  const monthlyData: MonthlyBreakdown[] = MONTH_LABELS.map((label, i) => {
    const prefix = `${now.getFullYear()}-${String(i + 1).padStart(2, "0")}`
    const fuelAmount = fuelLogs.filter(l => l.date.startsWith(prefix)).reduce((s, l) => s + Number(l.cost), 0)
    const maintAmount = maintLogs.filter(l => l.date.startsWith(prefix)).reduce((s, l) => s + Number(l.cost), 0)
    return { label, fuelAmount, maintAmount, isCurrent: i === currentMonthIdx }
  })

  // Fuel efficiency (km/L) — all fill-ups (used for last fill-up segment)
  const vFuel = [...fuelLogs].sort((a, b) => Number(a.odometer) - Number(b.odometer))
  const efficiencies: number[] = []
  for (let i = 1; i < vFuel.length; i++) {
    const dist = Number(vFuel[i].odometer) - Number(vFuel[i - 1].odometer)
    const liters = Number(vFuel[i].liters)
    if (dist > 0 && liters > 0) efficiencies.push(dist / liters)
  }

  // Dated efficiency values for the fuel card
  const filledEfficiencies: { date: string; kml: number }[] = []
  for (let i = 1; i < vFuel.length; i++) {
    const dist = Number(vFuel[i].odometer) - Number(vFuel[i - 1].odometer)
    const liters = Number(vFuel[i].liters)
    if (dist > 0 && liters > 0) filledEfficiencies.push({ date: vFuel[i].date, kml: dist / liters })
  }

  const d30 = new Date(now); d30.setDate(d30.getDate() - 30)
  const d60 = new Date(now); d60.setDate(d60.getDate() - 60)
  const str30 = d30.toISOString().slice(0, 10)
  const str60 = d60.toISOString().slice(0, 10)
  const kml30d     = filledEfficiencies.filter(e => e.date >= str30).map(e => e.kml)
  const kmlPrev30d = filledEfficiencies.filter(e => e.date >= str60 && e.date < str30).map(e => e.kml)
  const allKml     = filledEfficiencies.map(e => e.kml)

  const prevMonthPrefix = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, "0")}`
  const prevMonthKmls   = filledEfficiencies.filter(e => e.date.startsWith(prevMonthPrefix)).map(e => e.kml)

  const monthlyAvgsKml: (number | null)[] = Array.from({ length: 12 }, (_, i) => {
    const prefix = `${now.getFullYear()}-${String(i + 1).padStart(2, "0")}`
    const vals = filledEfficiencies.filter(e => e.date.startsWith(prefix)).map(e => e.kml)
    return vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : null
  })

  const fuelCardData = {
    avg30dKml:     kml30d.length > 0 ? kml30d.reduce((s, v) => s + v, 0) / kml30d.length : null,
    prevAvg30dKml: kmlPrev30d.length > 0 ? kmlPrev30d.reduce((s, v) => s + v, 0) / kmlPrev30d.length : null,
    lastFillKml:   efficiencies.length > 0 ? efficiencies[efficiencies.length - 1] : null,
    prevMonthKml:  prevMonthKmls.length > 0 ? prevMonthKmls.reduce((s, v) => s + v, 0) / prevMonthKmls.length : null,
    allTimeAvgKml: allKml.length > 0 ? allKml.reduce((s, v) => s + v, 0) / allKml.length : null,
    bestKml:       allKml.length > 0 ? Math.max(...allKml) : null,
    worstKml:      allKml.length > 0 ? Math.min(...allKml) : null,
    monthlyAvgsKml,
  }


  // Current odometer
  const allOdos = [
    ...fuelLogs.map(l => Number(l.odometer)),
    ...maintLogs.map(l => Number(l.odometer)),
  ]
  const currentOdo = Math.max(vehicle.initial_odometer, ...(allOdos.length ? allOdos : [0]))

  // Odometer stats
  const totalKm = currentOdo - vehicle.initial_odometer
  const thisMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
  const logsBeforeMonth = [
    ...fuelLogs.filter(l => l.date < thisMonthStart),
    ...maintLogs.filter(l => l.date < thisMonthStart),
  ]
  const odoAtMonthStart = logsBeforeMonth.length > 0
    ? Math.max(...logsBeforeMonth.map(l => Number(l.odometer)))
    : vehicle.initial_odometer
  const kmThisMonth = currentOdo - odoAtMonthStart
  const allLogDates = [...fuelLogs, ...maintLogs].map(l => l.date).sort()
  const firstLogDate = allLogDates.length > 0 ? new Date(allLogDates[0] + "T00:00:00") : null
  const daysSinceFirst = firstLogDate
    ? Math.max(1, Math.floor((now.getTime() - firstLogDate.getTime()) / 86400000))
    : null
  const avgKmPerDay = daysSinceFirst !== null && totalKm > 0
    ? Math.round(totalKm / daysSinceFirst)
    : null

  // Service task counts for dashboard badges
  const overdueCount = svcTasks.filter(t => {
    if (t.completed_log_id) return false
    if (t.due_date) return new Date(t.due_date) < now
    if (t.expected_odometer !== null) return t.expected_odometer < currentOdo
    return false
  }).length

  const dueSoonCount = svcTasks.filter(t => {
    if (t.completed_log_id) return false
    if (t.due_date) { const d = Math.floor((new Date(t.due_date).getTime() - now.getTime()) / 86400000); return d >= 0 && d <= 30 }
    if (t.expected_odometer !== null) { const km = t.expected_odometer - currentOdo; return km > 0 && km <= 1000 }
    return false
  }).length

  // Dashboard maintenance preview — top 3 tasks sorted by urgency
  const logById = Object.fromEntries(maintLogs.map(l => [l.id, l]))
  const dashboardTasks = svcTasks.slice(0, 3)

  const primaryName = vehicle.nickname || `${vehicle.make} ${vehicle.model}`
  const plateEncoded = encodeURIComponent(vehicle.license_plate)

  const cardCls = "bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6"
  const labelCls = "text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest"

  return (
    <div className="flex flex-col min-h-screen">
      {/* Page header */}
      <div className="flex items-start justify-between px-8 pt-8 pb-5">
        <div>
          <h1 className="text-[22px] font-semibold text-gray-900 dark:text-white leading-tight">Dashboard</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">{primaryName}</p>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <NewFillUpModal vehicleId={vehicle.id} licensePlate={vehicle.license_plate} currentOdometer={currentOdo} />
        </div>
      </div>

      {/* Cards grid */}
      <div className="px-8 pb-8 grid grid-cols-5 gap-4">

        {/* Monthly Spent */}
        <div className={`col-span-3 ${cardCls}`}>
          <MonthlySpentCard monthlyData={monthlyData} prevMonthName={prevMonthName} />
        </div>

        {/* Odometer */}
        <div className={`col-span-2 ${cardCls}`}>
          <p className={labelCls}>Odometer</p>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-[40px] font-medium text-gray-900 dark:text-white leading-none">
              {currentOdo.toLocaleString("en-US")}
            </span>
            <span className="text-base text-gray-400 dark:text-gray-500">km</span>
          </div>
          <div className="mt-16 pt-4 border-t border-gray-100 dark:border-gray-800 grid grid-cols-3 gap-3">
            {[
              { label: "Total", value: `+${totalKm.toLocaleString("en-US")} km` },
              { label: "This month", value: `+${kmThisMonth.toLocaleString("en-US")} km` },
              { label: "Avg / day", value: avgKmPerDay !== null ? `${avgKmPerDay} km` : "—" },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{label}</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Fuel Consumption */}
        <div className={`col-span-3 ${cardCls}`}>
          <FuelConsumptionCard data={fuelCardData} />
        </div>

        {/* Maintenance */}
        <div className={`col-span-2 ${cardCls}`}>
          <div className="flex items-center justify-between">
            <p className={labelCls}>Maintenance</p>
            <div className="flex items-center gap-1.5">
              {dueSoonCount > 0 && (
                <Link
                  href={`/vehicle/${plateEncoded}/maintenance?filter=soon`}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-500 dark:text-orange-400 text-[11px] font-semibold hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                >
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                    <path d="M8 1L1 14h14L8 1zm0 2.5l5.5 9.5H2.5L8 3.5zM7.25 7v3h1.5V7h-1.5zm0 4v1.5h1.5V11h-1.5z"/>
                  </svg>
                  {dueSoonCount}
                </Link>
              )}
              {overdueCount > 0 && (
                <Link
                  href={`/vehicle/${plateEncoded}/maintenance?filter=due`}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 text-[11px] font-semibold hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                    <path d="M8 1L1 14h14L8 1zm0 2.5l5.5 9.5H2.5L8 3.5zM7.25 7v3h1.5V7h-1.5zm0 4v1.5h1.5V11h-1.5z"/>
                  </svg>
                  {overdueCount}
                </Link>
              )}
            </div>
          </div>
          {dashboardTasks.length > 0 ? (
            <ul className="mt-3 space-y-2.5">
              {dashboardTasks.map(t => {
                const status = getTaskStatus(t, currentOdo, now)
                const dotColor =
                  status === "completed" ? "bg-green-400" :
                  status === "overdue"   ? "bg-red-500" :
                  status === "due_soon"  ? "bg-orange-400" :
                  "bg-gray-300 dark:bg-gray-600"

                let subtitle = ""
                if (status === "completed" && t.completed_log_id) {
                  const log = logById[t.completed_log_id]
                  if (log) {
                    const d = new Date(log.date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                    subtitle = `Done ${d}${log.odometer ? ` · ${Number(log.odometer).toLocaleString()} km` : ""}`
                  }
                } else if (t.due_date) {
                  const days = Math.floor((new Date(t.due_date).getTime() - now.getTime()) / 86400000)
                  const dateStr = new Date(t.due_date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                  subtitle = days < 0
                    ? `Overdue · ${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""}`
                    : days === 0 ? "Due today"
                    : `Due ${dateStr}`
                } else if (t.expected_odometer !== null) {
                  const km = t.expected_odometer - currentOdo
                  subtitle = km <= 0
                    ? `Overdue · ${Math.abs(km).toLocaleString()} km`
                    : `In ${km.toLocaleString()} km`
                }

                return (
                  <li key={t.id} className="flex items-start gap-2.5">
                    <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{t.service_type ?? "—"}</p>
                      {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500">{subtitle}</p>}
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-gray-300 dark:text-gray-700">No tasks added</p>
          )}
          <Link
            href={`/vehicle/${plateEncoded}/maintenance`}
            className="mt-4 inline-block text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            View all
          </Link>
        </div>


      </div>
    </div>
  )
}
