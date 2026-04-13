import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import AddFuelForm from "./AddFuelForm"
import FuelLogRow from "./FuelLogRow"

export default async function FuelLogPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const licensePlate = decodeURIComponent(id)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Fetch vehicle by license plate
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("id, make, model, nickname, license_plate")
    .eq("license_plate", licensePlate)
    .eq("user_id", user.id)
    .single()

  if (!vehicle) notFound()

  // Fetch fuel logs for this vehicle
  const { data: logs } = await supabase
    .from("fuel_logs")
    .select("*")
    .eq("vehicle_id", vehicle.id)
    .order("date", { ascending: false })

  // Stats
  const totalFillUps = logs?.length ?? 0
  const totalCost = logs?.reduce((sum, l) => sum + Number(l.cost), 0) ?? 0
  const totalLiters = logs?.reduce((sum, l) => sum + Number(l.liters), 0) ?? 0
  const avgCostPerFillUp = totalFillUps > 0 ? totalCost / totalFillUps : 0

  const vehicleName = vehicle.nickname || `${vehicle.make} ${vehicle.model}`

  return (
    <main className="w-full px-6 py-8">
      <div className="mb-6">
        <Link
          href={`/vehicles/${encodeURIComponent(licensePlate)}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← {vehicleName}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Fuel Logs</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Fill-Ups</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalFillUps}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Total Cost</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">€{totalCost.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Total Liters</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalLiters.toFixed(1)} L</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Avg per Fill-Up</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">€{avgCostPerFillUp.toFixed(2)}</p>
        </div>
      </div>

      {/* Add form */}
      <div className="mb-6">
        <AddFuelForm vehicleId={vehicle.id} licensePlate={licensePlate} />
      </div>

      {/* Logs table */}
      {!logs || logs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg font-medium mb-1">No fill-ups logged yet</p>
          <p className="text-sm">Add your first fill-up above.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Date</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Odometer</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Liters</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Cost</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">€/L</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <FuelLogRow
                  key={log.id}
                  log={log}
                  licensePlate={licensePlate}
                  index={i}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
