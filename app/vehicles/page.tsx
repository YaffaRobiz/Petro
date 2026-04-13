import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import DeleteVehicleButton from "./DeleteVehicleButton"

export default async function VehiclesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <main className="w-full px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Vehicles</h1>
        <Link
          href="/vehicles/new"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Add Vehicle
        </Link>
      </div>

      {!vehicles || vehicles.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg font-medium mb-1">No vehicles yet</p>
          <p className="text-sm">Add your first vehicle to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((v) => (
            <div
              key={v.id}
              className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3 hover:shadow-sm transition-shadow"
            >
              <div>
                <h2 className="font-semibold text-gray-900 text-lg leading-tight">
                  {v.nickname || `${v.make} ${v.model}`}
                </h2>
                {v.nickname && (
                  <p className="text-sm text-gray-500">{v.make} {v.model}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                <span>{v.year}</span>
                <span>{v.license_plate}</span>
                <span>{v.fuel_type}</span>
                <span>{v.initial_odometer.toLocaleString()} km</span>
              </div>

              <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                <Link
                  href={`/vehicles/${encodeURIComponent(v.license_plate)}`}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View →
                </Link>
                <DeleteVehicleButton id={v.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
