"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function addFuelLog(vehicleId: string, licensePlate: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const date = formData.get("date") as string
  const odometer = parseInt(formData.get("odometer") as string)
  const liters = parseFloat(formData.get("liters") as string)
  const cost = parseFloat(formData.get("cost") as string)

  const { error } = await supabase.from("fuel_logs").insert({
    user_id: user.id,
    vehicle_id: vehicleId,
    date,
    odometer,
    liters,
    cost,
  })

  if (error) throw new Error(error.message)

  revalidatePath(`/vehicles/${encodeURIComponent(licensePlate)}/fuel`)
}

export async function updateFuelLog(id: string, licensePlate: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const date = formData.get("date") as string
  const odometer = parseInt(formData.get("odometer") as string)
  const liters = parseFloat(formData.get("liters") as string)
  const cost = parseFloat(formData.get("cost") as string)

  const { error } = await supabase
    .from("fuel_logs")
    .update({ date, odometer, liters, cost })
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) throw new Error(error.message)

  revalidatePath(`/vehicles/${encodeURIComponent(licensePlate)}/fuel`)
}

export async function deleteFuelLog(id: string, licensePlate: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from("fuel_logs")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) throw new Error(error.message)

  revalidatePath(`/vehicles/${encodeURIComponent(licensePlate)}/fuel`)
}
