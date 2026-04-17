import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const licensePlate = decodeURIComponent(id)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("*")
    .eq("license_plate", licensePlate)
    .eq("user_id", user.id)
    .single()

  if (!vehicle) notFound()

  // Compute current odometer from logs
  const [fuelOdosRes, maintOdosRes] = await Promise.all([
    supabase.from("fuel_logs").select("odometer").eq("vehicle_id", vehicle.id),
    supabase.from("maintenance_logs").select("odometer").eq("vehicle_id", vehicle.id),
  ])
  const allOdos = [
    ...(fuelOdosRes.data ?? []),
    ...(maintOdosRes.data ?? []),
  ].map((r) => Number(r.odometer))
  const currentOdometer = allOdos.length > 0
    ? Math.max(vehicle.initial_odometer, ...allOdos)
    : vehicle.initial_odometer

  return (
    <main className="max-w-xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/vehicles" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
          ← Back to vehicles
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          {vehicle.nickname || `${vehicle.make} ${vehicle.model}`}
        </h1>
        {vehicle.nickname && (
          <p className="text-gray-500 dark:text-gray-400 mb-4">{vehicle.make} {vehicle.model}</p>
        )}

        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          <div>
            <dt className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">Year</dt>
            <dd className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{vehicle.year}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">Plate</dt>
            <dd className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{vehicle.license_plate}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">Fuel Type</dt>
            <dd className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{vehicle.fuel_type}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">Current Odometer</dt>
            <dd className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{currentOdometer.toLocaleString('en-US')} km</dd>
          </div>
        </dl>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href={`/vehicles/${encodeURIComponent(vehicle.license_plate)}/fuel`}
          className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-sm hover:border-blue-200 dark:hover:border-blue-700 transition-all group"
        >
          <div className="text-2xl mb-2">⛽</div>
          <h2 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Fuel Logs</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track fill-ups, liters and cost</p>
        </Link>

        <Link
          href={`/vehicles/${encodeURIComponent(vehicle.license_plate)}/maintenance`}
          className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-sm hover:border-blue-200 dark:hover:border-blue-700 transition-all group"
        >
          <div className="text-2xl mb-2">🔧</div>
          <h2 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Maintenance Logs</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track services and repairs</p>
        </Link>
      </div>
    </main>
  )
}
