import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import FuelCostChart, { type ChartBar } from "./FuelCostChart"
import FuelTable from "./FuelTable"
import NewFillUpModal from "@/components/NewFillUpModal"

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
    .select("id, make, model, nickname, license_plate, initial_odometer")
    .eq("license_plate", licensePlate)
    .eq("user_id", user.id)
    .single()

  if (!vehicle) notFound()

  const [{ data: logs }, { data: maintOdos }] = await Promise.all([
    supabase.from("fuel_logs").select("*").eq("vehicle_id", vehicle.id).order("date", { ascending: false }),
    supabase.from("maintenance_logs").select("odometer").eq("vehicle_id", vehicle.id),
  ])

  const allLogs = logs ?? []

  const allOdos = [
    ...allLogs.map(l => Number(l.odometer)),
    ...(maintOdos ?? []).map(l => Number(l.odometer)),
  ]
  const currentOdometer = allOdos.length > 0
    ? Math.max(vehicle.initial_odometer, ...allOdos)
    : vehicle.initial_odometer

  // Efficiency per fill-up (km/L), keyed by log id
  const sortedAsc = [...allLogs].sort((a, b) => Number(a.odometer) - Number(b.odometer))
  const efficiencyById: Record<string, number | null> = {}
  for (let i = 0; i < sortedAsc.length; i++) {
    if (i === 0) {
      efficiencyById[sortedAsc[i].id] = null
    } else {
      const dist = Number(sortedAsc[i].odometer) - Number(sortedAsc[i - 1].odometer)
      const liters = Number(sortedAsc[i].liters)
      efficiencyById[sortedAsc[i].id] = dist > 0 && liters > 0 ? dist / liters : null
    }
  }

  const effValues = Object.values(efficiencyById).filter((v): v is number => v !== null)
  const avgEfficiency = effValues.length > 0
    ? effValues.reduce((s, v) => s + v, 0) / effValues.length
    : null

  const totalCost = allLogs.reduce((s, l) => s + Number(l.cost), 0)

  // Monthly chart data — current year
  const now = new Date()
  const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
  const monthlyData: ChartBar[] = MONTH_LABELS.map((label, i) => {
    const prefix = `${now.getFullYear()}-${String(i + 1).padStart(2, "0")}`
    const amount = allLogs
      .filter(l => l.date.startsWith(prefix))
      .reduce((s, l) => s + Number(l.cost), 0)
    return { label, amount, isCurrent: i === now.getMonth() }
  })

  // Yearly chart data — always 3 columns: 2 years ago, last year, current year
  const currentYear = now.getFullYear()
  const yearlyData: ChartBar[] = [currentYear - 4, currentYear - 3, currentYear - 2, currentYear - 1, currentYear].map(y => ({
    label: String(y).slice(2),
    amount: allLogs.filter(l => l.date.startsWith(String(y))).reduce((s, l) => s + Number(l.cost), 0),
    isCurrent: y === currentYear,
  }))

  const cardCls = "bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6"
  const labelCls = "text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest"

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="flex items-start justify-between px-8 pt-8 pb-5">
        <div>
          <h1 className="text-[22px] font-semibold text-gray-900 dark:text-white leading-tight">Refueling</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
            {vehicle.nickname || `${vehicle.make} ${vehicle.model}`}
          </p>
        </div>
        <div className="pt-1">
          <NewFillUpModal vehicleId={vehicle.id} licensePlate={licensePlate} currentOdometer={currentOdometer} />
        </div>
      </div>

      <div className="px-8 pb-8 space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-5 gap-4">
          <div className={`col-span-1 ${cardCls} flex flex-col justify-between`}>
            <p className={labelCls}>Fill-Ups</p>
            <div>
              <p className="text-[40px] font-bold text-gray-900 dark:text-white leading-none tracking-tight mt-3">
                {allLogs.length}
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">total entries</p>
            </div>
          </div>

          <div className={`col-span-3 ${cardCls}`}>
            <FuelCostChart monthly={monthlyData} yearly={yearlyData} />
          </div>

          <div className={`col-span-1 ${cardCls} flex flex-col justify-between`}>
            <p className={labelCls}>Avg km/L</p>
            <div>
              {avgEfficiency !== null ? (
                <>
                  <p className="text-[40px] font-bold text-gray-900 dark:text-white leading-none tracking-tight mt-3">
                    {avgEfficiency.toFixed(1)}
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    €{allLogs.length > 0 ? (totalCost / allLogs.length).toFixed(2) : "—"} avg/fill
                  </p>
                </>
              ) : (
                <p className="text-3xl font-bold text-gray-200 dark:text-gray-700 leading-none mt-3">—</p>
              )}
            </div>
          </div>
        </div>

        {/* Sortable table */}
        <FuelTable logs={allLogs} efficiencyById={efficiencyById} licensePlate={licensePlate} />
      </div>
    </div>
  )
}
