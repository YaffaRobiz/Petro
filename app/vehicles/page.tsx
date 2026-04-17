import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import DeleteVehicleButton from "./DeleteVehicleButton"

export default async function VehiclesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [vehiclesRes, fuelOdosRes, maintOdosRes] = await Promise.all([
    supabase.from("vehicles").select("*").order("created_at", { ascending: false }),
    supabase.from("fuel_logs").select("vehicle_id, odometer").eq("user_id", user.id),
    supabase.from("maintenance_logs").select("vehicle_id, odometer").eq("user_id", user.id),
  ])

  const vehicles = vehiclesRes.data ?? []

  // Build map of vehicle_id -> max odometer from logs
  const odoMap: Record<string, number> = {}
  for (const log of [...(fuelOdosRes.data ?? []), ...(maintOdosRes.data ?? [])]) {
    const curr = odoMap[log.vehicle_id] ?? 0
    if (Number(log.odometer) > curr) odoMap[log.vehicle_id] = Number(log.odometer)
  }

  return (
    <main className="w-full px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Vehicles</h1>
        <Link
          href="/vehicles/new"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Add Vehicle
        </Link>
      </div>

      {vehicles.length === 0 ? (
        <div className="text-center py-20 text-gray-400 dark:text-gray-500">
          <p className="text-lg font-medium mb-1">No vehicles yet</p>
          <p className="text-sm">Add your first vehicle to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((v) => {
            const currentOdometer = Math.max(
              v.initial_odometer,
              odoMap[v.id] ?? 0
            )
            return (
              <div
                key={v.id}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 flex flex-col gap-3 hover:shadow-sm transition-shadow"
              >
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-white text-lg leading-tight">
                    {v.nickname || `${v.make} ${v.model}`}
                  </h2>
                  {v.nickname && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{v.make} {v.model}</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                  <span>{v.year}</span>
                  <span>{v.license_plate}</span>
                  <span>{v.fuel_type}</span>
                </div>

                <div className="text-sm">
                  <span className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">Current Odometer</span>
                  <p className="font-medium text-gray-900 dark:text-white mt-0.5">{currentOdometer.toLocaleString('en-US')} km</p>
                </div>

                <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100 dark:border-gray-800">
                  <Link
                    href={`/vehicles/${encodeURIComponent(v.license_plate)}`}
                    className="text-sm text-blue-600 hover:text-blue-700 dark:hover:text-blue-400 font-medium"
                  >
                    View →
                  </Link>
                  <DeleteVehicleButton id={v.id} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
