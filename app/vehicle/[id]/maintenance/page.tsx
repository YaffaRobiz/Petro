import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import AddMaintenanceForm from "./AddMaintenanceForm"
import MaintenanceLogRow from "./MaintenanceLogRow"

export default async function MaintenanceLogPage({
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
    .from("maintenance_logs")
    .select("*")
    .eq("vehicle_id", vehicle.id)
    .order("date", { ascending: false })

  const totalServices = logs?.length ?? 0
  const totalCost = logs?.reduce((sum, l) => sum + Number(l.cost), 0) ?? 0
  const avgCost = totalServices > 0 ? totalCost / totalServices : 0
  const lastService = logs?.[0]
    ? new Date(logs[0].date).toLocaleDateString("en-GB")
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">Maintenance Logs</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">Services</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalServices}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">Total Cost</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">€{totalCost.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">Avg per Service</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">€{avgCost.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">Last Service</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{lastService ?? "—"}</p>
        </div>
      </div>

      {/* Add form */}
      <div className="mb-6">
        <AddMaintenanceForm vehicleId={vehicle.id} licensePlate={licensePlate} />
      </div>

      {/* Logs table */}
      {!logs || logs.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <p className="text-lg font-medium mb-1">No services logged yet</p>
          <p className="text-sm">Add your first service entry above.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Date</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Odometer</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Service</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Notes</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Cost</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <MaintenanceLogRow
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
