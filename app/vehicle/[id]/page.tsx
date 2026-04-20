import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import DeleteVehicleButton from "@/app/vehicle/DeleteVehicleButton"
import EditVehicleForm from "./EditVehicleForm"

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

  const [{ count: fuelCount }, { count: maintCount }] = await Promise.all([
    supabase.from("fuel_logs").select("id", { count: "exact", head: true }).eq("vehicle_id", vehicle.id),
    supabase.from("maintenance_logs").select("id", { count: "exact", head: true }).eq("vehicle_id", vehicle.id),
  ])

  const hasLogs = (fuelCount ?? 0) > 0 || (maintCount ?? 0) > 0

  const cardCls = "bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6"

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex items-start justify-between px-8 pt-8 pb-5">
        <div>
          <h1 className="text-[22px] font-semibold text-gray-900 dark:text-white leading-tight">Vehicle Info</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
            {vehicle.nickname || `${vehicle.make} ${vehicle.model}`}
          </p>
        </div>
      </div>

      <div className="px-8 pb-8 space-y-4">
        <div className={cardCls}>
          <EditVehicleForm vehicle={vehicle} hasLogs={hasLogs} />
        </div>

        <div className={`${cardCls} flex items-center justify-between`}>
          <div>
            <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Danger Zone</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Permanently delete this vehicle and all its data.
            </p>
          </div>
          <DeleteVehicleButton id={vehicle.id} />
        </div>
      </div>
    </div>
  )
}
