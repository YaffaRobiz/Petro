"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function addMaintenanceLog(vehicleId: string, licensePlate: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const date = formData.get("date") as string
  const odometer = parseInt(formData.get("odometer") as string)
  const service_type = formData.get("service_type") as string
  const notes = (formData.get("notes") as string) || null
  const cost = parseFloat(formData.get("cost") as string)

  const { error } = await supabase.from("maintenance_logs").insert({
    user_id: user.id,
    vehicle_id: vehicleId,
    date,
    odometer,
    service_type,
    notes,
    cost,
  })

  if (error) throw new Error(error.message)

  revalidatePath(`/vehicles/${encodeURIComponent(licensePlate)}/maintenance`)
}

export async function updateMaintenanceLog(id: string, licensePlate: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const date = formData.get("date") as string
  const odometer = parseInt(formData.get("odometer") as string)
  const service_type = formData.get("service_type") as string
  const notes = (formData.get("notes") as string) || null
  const cost = parseFloat(formData.get("cost") as string)

  const { error } = await supabase
    .from("maintenance_logs")
    .update({ date, odometer, service_type, notes, cost })
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) throw new Error(error.message)

  revalidatePath(`/vehicles/${encodeURIComponent(licensePlate)}/maintenance`)
}

export async function deleteMaintenanceLog(id: string, licensePlate: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from("maintenance_logs")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) throw new Error(error.message)

  revalidatePath(`/vehicles/${encodeURIComponent(licensePlate)}/maintenance`)
}
