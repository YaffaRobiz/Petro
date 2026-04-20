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

  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("id, make, model, nickname, license_plate")
    .eq("license_plate", licensePlate)
    .eq("user_id", user.id)
    .single()

  if (!vehicle) notFound()

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

  // Compute km/L per fill-up
  // Sort ascending by odometer to compute distance diffs
  const sortedAsc = [...(logs ?? [])].sort((a, b) => Number(a.odometer) - Number(b.odometer))
  const efficiencyById: Record<string, number | null> = {}
  for (let i = 0; i < sortedAsc.length; i++) {
    if (i === 0) {
      efficiencyById[sortedAsc[i].id] = null // first fill-up: no previous odometer
    } else {
      const distance = Number(sortedAsc[i].odometer) - Number(sortedAsc[i - 1].odometer)
      const liters = Number(sortedAsc[i].liters)
      efficiencyById[sortedAsc[i].id] = distance > 0 && liters > 0 ? distance / liters : null
    }
  }

  // Average km/L across fill-ups that have a computed value
  const efficiencyValues = Object.values(efficiencyById).filter((v): v is number => v !== null)
  const avgEfficiency = efficiencyValues.length > 0
    ? efficiencyValues.reduce((s, v) => s + v, 0) / efficiencyValues.length
    : null

  const vehicleName = vehicle.nickname || `${vehicle.make} ${vehicle.model}`

  return (
    <main className="w-full px-6 py-8">
      <div className="mb-6">
        <Link
          href={`/vehicle/${encodeURIComponent(licensePlate)}`}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          ← {vehicleName}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">Fuel Logs</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">Fill-Ups</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalFillUps}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">Total Cost</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">€{totalCost.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">Total Liters</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalLiters.toFixed(1)} L</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">Avg per Fill-Up</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">€{avgCostPerFillUp.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">Avg Efficiency</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {avgEfficiency !== null ? `${avgEfficiency.toFixed(1)} km/L` : "—"}
          </p>
        </div>
      </div>

      {/* Add form */}
      <div className="mb-6">
        <AddFuelForm vehicleId={vehicle.id} licensePlate={licensePlate} />
      </div>

      {/* Logs table */}
      {!logs || logs.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <p className="text-lg font-medium mb-1">No fill-ups logged yet</p>
          <p className="text-sm">Add your first fill-up above.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Date</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Odometer</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Liters</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Cost</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">€/L</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">km/L</th>
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
                  efficiency={efficiencyById[log.id] ?? null}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
