import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import NewMaintenanceModal, { type LastServicedMap } from "@/components/NewMaintenanceModal"
import TasksTable from "./TasksTable"

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
    .select("id, make, model, nickname, license_plate, initial_odometer")
    .eq("license_plate", licensePlate)
    .eq("user_id", user.id)
    .single()

  if (!vehicle) notFound()

  const [tasksRes, fuelRes, maintRes] = await Promise.all([
    supabase.from("service_tasks").select("*").eq("vehicle_id", vehicle.id).order("created_at", { ascending: false }),
    supabase.from("fuel_logs").select("odometer").eq("vehicle_id", vehicle.id).order("odometer", { ascending: false }).limit(1).single(),
    supabase.from("maintenance_logs").select("id, odometer, service_type, date, notes, cost").eq("vehicle_id", vehicle.id).order("date", { ascending: false }),
  ])

  const tasks     = tasksRes.data ?? []
  const maintLogs = maintRes.data ?? []

  const currentOdometer = Math.max(
    vehicle.initial_odometer,
    fuelRes.data?.odometer ?? 0,
    ...maintLogs.map(l => Number(l.odometer)),
  )

  const lastServicedByType: LastServicedMap = {}
  for (const log of maintLogs) {
    if (log.service_type && !lastServicedByType[log.service_type]) {
      lastServicedByType[log.service_type] = { date: log.date, odometer: Number(log.odometer) }
    }
  }

  const logInfoById: Record<string, { date: string; cost: number; odometer: number; notes: string | null }> = {}
  for (const log of maintLogs) {
    logInfoById[log.id] = { date: log.date, cost: Number(log.cost), odometer: Number(log.odometer), notes: log.notes ?? null }
  }

  const now = new Date()
  const yearPrefix = `${now.getFullYear()}-`

  const completed = tasks.filter(t => t.completed_log_id).length
  const overdue   = tasks.filter(t => {
    if (t.completed_log_id) return false
    if (t.due_date) return new Date(t.due_date) < now
    if (t.expected_odometer !== null) return t.expected_odometer < currentOdometer
    return false
  }).length
  const dueSoon = tasks.filter(t => {
    if (t.completed_log_id) return false
    if (t.due_date) { const d = Math.floor((new Date(t.due_date).getTime() - now.getTime()) / 86400000); return d >= 0 && d <= 30 }
    if (t.expected_odometer !== null) { const km = t.expected_odometer - currentOdometer; return km > 0 && km <= 1000 }
    return false
  }).length
  const totalCostYTD = maintLogs
    .filter(l => l.date.startsWith(yearPrefix))
    .reduce((s, l) => s + Number(l.cost ?? 0), 0)

  const cardCls = "bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6"
  const labelCls = "text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest"

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex items-start justify-between px-8 pt-8 pb-5">
        <div>
          <h1 className="text-[22px] font-semibold text-gray-900 dark:text-white leading-tight">Maintenance</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
            {vehicle.nickname || `${vehicle.make} ${vehicle.model}`}
          </p>
        </div>
        <div className="pt-1">
          <NewMaintenanceModal
            vehicleId={vehicle.id}
            licensePlate={licensePlate}
            currentOdometer={currentOdometer}
            lastServicedByType={lastServicedByType}
          />
        </div>
      </div>

      <div className="px-8 pb-8 space-y-4">
        <div className="grid grid-cols-4 gap-4">
          <div className={cardCls}>
            <p className={labelCls}>Due Soon</p>
            <p className="text-[40px] font-bold text-gray-900 dark:text-white leading-none tracking-tight mt-3">{dueSoon}</p>
          </div>
          <div className={cardCls}>
            <p className={labelCls}>Overdue</p>
            <p className={`text-[40px] font-bold leading-none tracking-tight mt-3 ${overdue > 0 ? "text-red-500 dark:text-red-400" : "text-gray-900 dark:text-white"}`}>{overdue}</p>
          </div>
          <div className={cardCls}>
            <p className={labelCls}>Completed</p>
            <p className="text-[40px] font-bold text-gray-900 dark:text-white leading-none tracking-tight mt-3">{completed}</p>
          </div>
          <div className={cardCls}>
            <p className={labelCls}>Total Cost YTD</p>
            <p className="text-[40px] font-bold text-gray-900 dark:text-white leading-none tracking-tight mt-3">€{totalCostYTD.toFixed(0)}</p>
          </div>
        </div>

        <TasksTable
          tasks={tasks}
          currentOdometer={currentOdometer}
          vehicleId={vehicle.id}
          licensePlate={licensePlate}
          lastServicedByType={lastServicedByType}
          logInfoById={logInfoById}
        />
      </div>
    </div>
  )
}
