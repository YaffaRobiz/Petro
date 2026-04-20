import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"

function buildSparklinePath(values: number[], w: number, h: number) {
  if (values.length < 2) return { line: "", area: "" }
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const pts = values.map((v, i) => ({
    x: (i / (values.length - 1)) * w,
    y: h * 0.9 - ((v - min) / range) * (h * 0.8),
  }))
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")
  const area = `${d} L ${pts[pts.length - 1].x.toFixed(1)},${h} L ${pts[0].x.toFixed(1)},${h} Z`
  return { line: d, area }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const now = new Date()
  const thisMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevMonthStr = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, "0")}-01`
  const prevMonthName = prevMonth.toLocaleString("en-US", { month: "long" })

  const [vehiclesRes, fuelRes, maintRes] = await Promise.all([
    supabase.from("vehicles").select("*").eq("user_id", user.id).order("created_at"),
    supabase.from("fuel_logs").select("id, date, cost, vehicle_id, odometer, liters").eq("user_id", user.id).order("date"),
    supabase.from("maintenance_logs").select("id, date, cost, vehicle_id, service_type, odometer").eq("user_id", user.id).order("date"),
  ])

  const vehicles = vehiclesRes.data ?? []
  const fuelLogs = fuelRes.data ?? []
  const maintLogs = maintRes.data ?? []
  const primary = vehicles[0] ?? null

  // Monthly spend
  const thisMonthSpent = [
    ...fuelLogs.filter(l => l.date >= thisMonthStr),
    ...maintLogs.filter(l => l.date >= thisMonthStr),
  ].reduce((s, l) => s + Number(l.cost), 0)

  const lastMonthSpent = [
    ...fuelLogs.filter(l => l.date >= prevMonthStr && l.date < thisMonthStr),
    ...maintLogs.filter(l => l.date >= prevMonthStr && l.date < thisMonthStr),
  ].reduce((s, l) => s + Number(l.cost), 0)

  const spentDiff = thisMonthSpent - lastMonthSpent
  const spentPct = lastMonthSpent > 0 ? Math.abs((spentDiff / lastMonthSpent) * 100) : null
  const spentDown = spentDiff <= 0

  // Last 12 month labels
  const monthLabels = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
    return d.toLocaleString("en-US", { month: "short" })
  })

  // Fuel efficiency (L/100km) for primary vehicle
  const vFuel = fuelLogs
    .filter(l => primary && l.vehicle_id === primary.id)
    .sort((a, b) => Number(a.odometer) - Number(b.odometer))

  const efficiencies: number[] = []
  for (let i = 1; i < vFuel.length; i++) {
    const dist = Number(vFuel[i].odometer) - Number(vFuel[i - 1].odometer)
    const liters = Number(vFuel[i].liters)
    if (dist > 0 && liters > 0) efficiencies.push((liters / dist) * 100)
  }
  const avgEff = efficiencies.length > 0
    ? efficiencies.reduce((s, e) => s + e, 0) / efficiencies.length
    : null

  const { line: sparkLine, area: sparkArea } = buildSparklinePath(efficiencies.slice(-12), 110, 44)

  // Last fill-up
  const lastFill = vFuel.length > 0 ? vFuel[vFuel.length - 1] : null
  const lastFillEff = efficiencies.length > 0 ? efficiencies[efficiencies.length - 1] : null
  const lastFillDate = lastFill ? new Date(lastFill.date + "T00:00:00") : null
  const daysAgo = lastFillDate
    ? Math.floor((now.getTime() - lastFillDate.getTime()) / 86400000)
    : null

  // Current odometer
  const allOdos = [
    ...fuelLogs.filter(l => primary && l.vehicle_id === primary.id).map(l => Number(l.odometer)),
    ...maintLogs.filter(l => primary && l.vehicle_id === primary.id).map(l => Number(l.odometer)),
  ]
  const currentOdo = primary
    ? Math.max(primary.initial_odometer, ...(allOdos.length ? allOdos : [0]))
    : 0

  // Recent maintenance
  const recentMaint = maintLogs
    .filter(l => primary && l.vehicle_id === primary.id)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3)

  const primaryName = primary?.nickname || (primary ? `${primary.make} ${primary.model}` : null)
  const plateEncoded = primary ? encodeURIComponent(primary.license_plate) : null

  const cardCls = "bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6"
  const labelCls = "text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest"

  return (
    <div className="flex flex-col min-h-screen">
      {/* Page header */}
      <div className="flex items-start justify-between px-8 pt-8 pb-5">
        <div>
          <h1 className="text-[22px] font-semibold text-gray-900 dark:text-white leading-tight">Dashboard</h1>
          {primaryName && (
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">· {primaryName}</p>
          )}
        </div>
        <div className="flex items-center gap-2 pt-1">
          {plateEncoded && (
            <Link
              href={`/vehicles/${plateEncoded}/fuel`}
              className="flex items-center gap-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium px-4 py-2 rounded-full hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors"
            >
              <span className="text-base leading-none">+</span> New fill-up
            </Link>
          )}
        </div>
      </div>

      {/* Cards grid */}
      <div className="px-8 pb-8 grid grid-cols-5 gap-4">

        {/* Monthly Spent */}
        <div className={`col-span-5 ${cardCls}`}>
          <p className={labelCls}>Monthly Spent</p>
          <div className="flex items-end gap-3 mt-3">
            <span className="text-[46px] font-bold text-gray-900 dark:text-white leading-none tracking-tight">
              €{thisMonthSpent.toFixed(2)}
            </span>
            {spentPct !== null && (
              <span
                className={`mb-1 inline-flex items-center gap-1.5 text-[13px] font-medium px-2.5 py-1 rounded-full ${
                  spentDown
                    ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                {spentDown ? "↓" : "↑"} {spentPct.toFixed(1)}%
                <span className="font-normal text-gray-400 dark:text-gray-500">
                  €{Math.abs(spentDiff).toFixed(2)} {spentDown ? "less" : "more"} than {prevMonthName}
                </span>
              </span>
            )}
          </div>
          {/* Month timeline */}
          <div className="flex justify-between mt-6 pt-4 border-t border-gray-50 dark:border-gray-800">
            {monthLabels.map((m, i) => (
              <span
                key={i}
                className={`text-[11px] ${
                  i === 11
                    ? "text-gray-700 dark:text-gray-300 font-medium"
                    : "text-gray-200 dark:text-gray-700"
                }`}
              >
                {m}
              </span>
            ))}
          </div>
        </div>

        {/* Fuel Consumption */}
        <div className={`col-span-3 ${cardCls}`}>
          <div className="flex items-start justify-between">
            <p className={labelCls}>Fuel Consumption</p>
            {efficiencies.length >= 2 && (
              <span className="text-[11px] text-gray-300 dark:text-gray-600">12-mo trend</span>
            )}
          </div>
          <div className="flex items-end justify-between mt-3">
            <div>
              {avgEff !== null ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-[40px] font-bold text-gray-900 dark:text-white leading-none tracking-tight">
                    {avgEff.toFixed(1)}
                  </span>
                  <span className="text-base text-gray-400 dark:text-gray-500 pb-0.5">L/100km</span>
                </div>
              ) : (
                <span className="text-3xl font-bold text-gray-200 dark:text-gray-700 leading-none">—</span>
              )}
            </div>
            {sparkLine && (
              <svg width="110" height="44" className="text-green-500 opacity-75 flex-shrink-0">
                <defs>
                  <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={sparkArea} fill="url(#sg)" />
                <path d={sparkLine} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        </div>

        {/* Maintenance */}
        <div className={`col-span-2 ${cardCls}`}>
          <p className={labelCls}>Maintenance</p>
          {recentMaint.length > 0 ? (
            <ul className="mt-3 space-y-2.5">
              {recentMaint.map(m => (
                <li key={m.id} className="flex items-start gap-2.5">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{m.service_type}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(m.date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-gray-300 dark:text-gray-700">No services logged</p>
          )}
          {plateEncoded && (
            <Link
              href={`/vehicles/${plateEncoded}/maintenance`}
              className="mt-4 inline-block text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              View all
            </Link>
          )}
        </div>

        {/* Last Fill-Up */}
        <div className={`col-span-3 ${cardCls}`}>
          <div className="flex items-start justify-between">
            <p className={labelCls}>Last Fill-Up</p>
            {lastFill && lastFillDate && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {lastFillDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                {daysAgo !== null && ` · ${daysAgo} day${daysAgo !== 1 ? "s" : ""} ago`}
              </span>
            )}
          </div>
          {lastFill ? (
            <div className="grid grid-cols-4 gap-4 mt-4">
              {[
                { value: `€${Number(lastFill.cost).toFixed(2)}`, label: "total" },
                { value: Number(lastFill.liters).toFixed(1), label: "liters" },
                { value: `€${(Number(lastFill.cost) / Number(lastFill.liters)).toFixed(2)}`, label: "per liter" },
                { value: lastFillEff !== null ? lastFillEff.toFixed(1) : "—", label: "L/100km" },
              ].map(({ value, label }) => (
                <div key={label}>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{value}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{label}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-gray-300 dark:text-gray-700">No fill-ups logged</p>
          )}
        </div>

        {/* Odometer */}
        <div className={`col-span-2 ${cardCls}`}>
          <p className={labelCls}>Odometer</p>
          {primary ? (
            <div className="flex items-baseline gap-2 mt-4">
              <span className="text-[40px] font-bold text-gray-900 dark:text-white leading-none tracking-tight">
                {currentOdo.toLocaleString("en-US")}
              </span>
              <span className="text-base text-gray-400 dark:text-gray-500">km</span>
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-sm text-gray-300 dark:text-gray-700 mb-3">No vehicles yet</p>
              <Link
                href="/vehicles/new"
                className="text-sm text-blue-600 hover:underline font-medium"
              >
                Add a vehicle →
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
