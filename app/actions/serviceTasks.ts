"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { INSPECTION_CATEGORY_ID } from "@/lib/serviceSchema"

export async function createServiceTask(vehicleId: string, licensePlate: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const category    = formData.get("category") as string
  const serviceType = (formData.get("service_type") as string) || null
  const notes       = (formData.get("notes") as string) || null
  const isInspection = category === INSPECTION_CATEGORY_ID

  let expected_odometer: number | null = null
  let due_date: string | null = null

  if (isInspection) {
    due_date = formData.get("due_date") as string
    if (!due_date) throw new Error("Due date is required for inspections")
  } else {
    const dueKm = parseInt(formData.get("due_km") as string)
    if (isNaN(dueKm) || dueKm <= 0) throw new Error("Due km must be a positive number")

    // Compute expected odometer from current vehicle max
    const [fuelRes, maintRes, vehicleRes] = await Promise.all([
      supabase.from("fuel_logs").select("odometer").eq("vehicle_id", vehicleId).order("odometer", { ascending: false }).limit(1).single(),
      supabase.from("maintenance_logs").select("odometer").eq("vehicle_id", vehicleId).order("odometer", { ascending: false }).limit(1).single(),
      supabase.from("vehicles").select("initial_odometer").eq("id", vehicleId).single(),
    ])
    const currentOdo = Math.max(
      vehicleRes.data?.initial_odometer ?? 0,
      fuelRes.data?.odometer ?? 0,
      maintRes.data?.odometer ?? 0,
    )
    expected_odometer = currentOdo + dueKm
  }

  const { error } = await supabase.from("service_tasks").insert({
    user_id: user.id,
    vehicle_id: vehicleId,
    category,
    service_type: serviceType,
    expected_odometer,
    due_date,
    notes,
  })

  if (error) throw new Error(error.message)

  revalidatePath(`/vehicle/${encodeURIComponent(licensePlate)}/maintenance`)
}

export async function logService(
  taskId: string,
  vehicleId: string,
  licensePlate: string,
  category: string,
  serviceType: string | null,
  formData: FormData,
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const date    = formData.get("date") as string
  const cost    = parseFloat(formData.get("cost") as string)
  const notes   = (formData.get("notes") as string) || null
  const isInspection = category === INSPECTION_CATEGORY_ID
  const odometer = isInspection ? null : parseInt(formData.get("odometer") as string)

  const { data: log, error: logError } = await supabase
    .from("maintenance_logs")
    .insert({
      user_id: user.id,
      vehicle_id: vehicleId,
      date,
      odometer: odometer ?? 0,
      service_type: serviceType ?? "Other",
      category,
      notes,
      cost,
    })
    .select("id")
    .single()

  if (logError) throw new Error(logError.message)

  const { error: taskError } = await supabase
    .from("service_tasks")
    .update({ completed_log_id: log.id })
    .eq("id", taskId)
    .eq("user_id", user.id)

  if (taskError) throw new Error(taskError.message)

  revalidatePath(`/vehicle/${encodeURIComponent(licensePlate)}/maintenance`)
  revalidatePath("/")
}

export async function deleteServiceTask(taskId: string, licensePlate: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from("service_tasks")
    .delete()
    .eq("id", taskId)
    .eq("user_id", user.id)

  if (error) throw new Error(error.message)

  revalidatePath(`/vehicle/${encodeURIComponent(licensePlate)}/maintenance`)
}

export async function updateServiceTask(taskId: string, licensePlate: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const notes       = (formData.get("notes") as string) || null
  const serviceType = (formData.get("service_type") as string) || null
  const rawOdo      = formData.get("expected_odometer") as string | null
  const rawDate     = formData.get("due_date") as string | null

  const updates: Record<string, unknown> = { notes }
  if (serviceType !== null) updates.service_type = serviceType
  if (rawOdo)               updates.expected_odometer = parseInt(rawOdo)
  if (rawDate)              updates.due_date = rawDate

  const { error } = await supabase
    .from("service_tasks")
    .update(updates)
    .eq("id", taskId)
    .eq("user_id", user.id)

  if (error) throw new Error(error.message)

  revalidatePath(`/vehicle/${encodeURIComponent(licensePlate)}/maintenance`)
}
