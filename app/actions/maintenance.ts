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

  revalidatePath(`/vehicle/${encodeURIComponent(licensePlate)}/maintenance`)
  revalidatePath("/")
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

  revalidatePath(`/vehicle/${encodeURIComponent(licensePlate)}/maintenance`)
  revalidatePath("/")
}

export async function getSurroundingOdometers(
  vehicleId: string,
  date: string,
): Promise<{ min: number | null; max: number | null }> {
  const supabase = await createClient()

  const [fuelBefore, maintBefore, fuelAfter, maintAfter, vehicle] = await Promise.all([
    supabase.from("fuel_logs").select("odometer").eq("vehicle_id", vehicleId).lt("date", date).order("odometer", { ascending: false }).limit(1).single(),
    supabase.from("maintenance_logs").select("odometer").eq("vehicle_id", vehicleId).lt("date", date).order("odometer", { ascending: false }).limit(1).single(),
    supabase.from("fuel_logs").select("odometer").eq("vehicle_id", vehicleId).gt("date", date).order("odometer", { ascending: true }).limit(1).single(),
    supabase.from("maintenance_logs").select("odometer").eq("vehicle_id", vehicleId).gt("date", date).order("odometer", { ascending: true }).limit(1).single(),
    supabase.from("vehicles").select("initial_odometer").eq("id", vehicleId).single(),
  ])

  const beforeValues = [
    vehicle.data?.initial_odometer,
    fuelBefore.data?.odometer,
    maintBefore.data?.odometer,
  ].filter((v): v is number => v != null)

  const afterValues = [
    fuelAfter.data?.odometer,
    maintAfter.data?.odometer,
  ].filter((v): v is number => v != null)

  return {
    min: beforeValues.length > 0 ? Math.max(...beforeValues) : null,
    max: afterValues.length > 0 ? Math.min(...afterValues) : null,
  }
}

export async function logPastService(vehicleId: string, licensePlate: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const date         = formData.get("date") as string
  const category     = formData.get("category") as string
  const service_type = formData.get("service_type") as string
  const notes        = (formData.get("notes") as string) || null
  const cost         = parseFloat(formData.get("cost") as string) || 0
  const isInspection = category === "inspections"
  const odometer     = isInspection ? 0 : parseInt(formData.get("odometer") as string)

  if (!isInspection) {
    const bounds = await getSurroundingOdometers(vehicleId, date)
    if (bounds.min !== null && odometer < bounds.min) {
      throw new Error(`Odometer must be at least ${bounds.min.toLocaleString("en-US")} km based on surrounding records`)
    }
    if (bounds.max !== null && odometer > bounds.max) {
      throw new Error(`Odometer must be at most ${bounds.max.toLocaleString("en-US")} km based on surrounding records`)
    }
  }

  const { error } = await supabase.from("maintenance_logs").insert({
    user_id: user.id,
    vehicle_id: vehicleId,
    date,
    odometer,
    service_type,
    category,
    notes,
    cost,
  })

  if (error) throw new Error(error.message)

  revalidatePath(`/vehicle/${encodeURIComponent(licensePlate)}/maintenance`)
  revalidatePath("/")
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

  revalidatePath(`/vehicle/${encodeURIComponent(licensePlate)}/maintenance`)
  revalidatePath("/")
}
