import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Fetch everything in parallel
  const [vehiclesRes, fuelRes, maintRes] = await Promise.all([
    supabase
      .from("vehicles")
      .select("id, make, model, nickname, license_plate")
      .eq("user_id", user.id),
    supabase
      .from("fuel_logs")
      .select("id, date, cost, vehicle_id")
      .eq("user_id", user.id)
      .order("date", { ascending: false }),
    supabase
      .from("maintenance_logs")
      .select("id, date, cost, vehicle_id, service_type")
      .eq("user_id", user.id)
      .order("date", { ascending: false }),
  ])

  const vehicles = vehiclesRes.data ?? []
  const fuelLogs = fuelRes.data ?? []
  const maintLogs = maintRes.data ?? []

  // Stats
  const totalVehicles = vehicles.length
  const totalFillUps = fuelLogs.length
  const totalServices = maintLogs.length
  const totalSpent =
    fuelLogs.reduce((s, l) => s + Number(l.cost), 0) +
    maintLogs.reduce((s, l) => s + Number(l.cost), 0)

  // Build a quick lookup: vehicle_id → vehicle
  const vehicleMap = Object.fromEntries(vehicles.map((v) => [v.id, v]))

  // Combine + sort last 5 activities
  type ActivityItem = {
    id: string
    type: "fuel" | "maintenance"
    date: string
    cost: number
    detail: string
    vehicle_id: string
  }

  const allActivity: ActivityItem[] = [
    ...fuelLogs.map((l) => ({
      id: l.id,
      type: "fuel" as const,
      date: l.date,
      cost: Number(l.cost),
      detail: "Fill-Up",
      vehicle_id: l.vehicle_id,
    })),
    ...maintLogs.map((l) => ({
      id: l.id,
      type: "maintenance" as const,
      date: l.date,
      cost: Number(l.cost),
      detail: l.service_type,
      vehicle_id: l.vehicle_id,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  const username = user.user_metadata?.username ?? user.email

  return (
    <main className="w-full px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Welcome back, {username}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <Link
          href="/vehicles"
          className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 hover:shadow-sm hover:border-blue-200 dark:hover:border-blue-700 transition-all group"
        >
          <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">Vehicles</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{totalVehicles}</p>
        </Link>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">Fuel Fill-Ups</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{totalFillUps}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">Services</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{totalServices}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">Total Spent</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">€{totalSpent.toFixed(0)}</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>

        {allActivity.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 py-16 text-center text-gray-400 dark:text-gray-500">
            <p className="text-sm font-medium">No activity yet</p>
            <p className="text-sm mt-1">Add a vehicle and start logging to see activity here.</p>
            <Link
              href="/vehicles/new"
              className="mt-4 inline-block text-sm text-blue-600 hover:underline font-medium"
            >
              Add your first vehicle →
            </Link>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Vehicle</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Event</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Date</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Cost</th>
                </tr>
              </thead>
              <tbody>
                {allActivity.map((item, i) => {
                  const vehicle = vehicleMap[item.vehicle_id]
                  const vehicleName = vehicle
                    ? vehicle.nickname || `${vehicle.make} ${vehicle.model}`
                    : "Unknown"
                  const plate = vehicle?.license_plate

                  return (
                    <tr
                      key={item.id}
                      className={i % 2 === 0 ? "border-b border-gray-50 dark:border-gray-800" : "border-b border-gray-50 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/20"}
                    >
                      <td className="px-4 py-3">
                        {plate ? (
                          <Link
                            href={`/vehicles/${encodeURIComponent(plate)}`}
                            className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            {vehicleName}
                          </Link>
                        ) : (
                          <span className="font-medium text-gray-900 dark:text-white">{vehicleName}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                          <span>{item.type === "fuel" ? "⛽" : "🔧"}</span>
                          {item.detail}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                        {new Date(item.date).toLocaleDateString("en-GB")}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                        €{item.cost.toFixed(2)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}
