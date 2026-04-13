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

  return (
    <main className="max-w-xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/vehicles" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to vehicles
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          {vehicle.nickname || `${vehicle.make} ${vehicle.model}`}
        </h1>
        {vehicle.nickname && (
          <p className="text-gray-500 mb-4">{vehicle.make} {vehicle.model}</p>
        )}

        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          <div>
            <dt className="text-xs text-gray-400 uppercase tracking-wide">Year</dt>
            <dd className="text-sm font-medium text-gray-900 mt-0.5">{vehicle.year}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400 uppercase tracking-wide">Plate</dt>
            <dd className="text-sm font-medium text-gray-900 mt-0.5">{vehicle.license_plate}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400 uppercase tracking-wide">Fuel Type</dt>
            <dd className="text-sm font-medium text-gray-900 mt-0.5">{vehicle.fuel_type}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400 uppercase tracking-wide">Starting Odometer</dt>
            <dd className="text-sm font-medium text-gray-900 mt-0.5">{vehicle.initial_odometer.toLocaleString()} km</dd>
          </div>
        </dl>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href={`/vehicles/${encodeURIComponent(vehicle.license_plate)}/fuel`}
          className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-sm hover:border-blue-200 transition-all group"
        >
          <div className="text-2xl mb-2">⛽</div>
          <h2 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Fuel Logs</h2>
          <p className="text-sm text-gray-500 mt-1">Track fill-ups, liters and cost</p>
        </Link>

        <Link
          href={`/vehicles/${encodeURIComponent(vehicle.license_plate)}/maintenance`}
          className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-sm hover:border-blue-200 transition-all group"
        >
          <div className="text-2xl mb-2">🔧</div>
          <h2 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Maintenance Logs</h2>
          <p className="text-sm text-gray-500 mt-1">Track services and repairs</p>
        </Link>
      </div>
    </main>
  )
}
