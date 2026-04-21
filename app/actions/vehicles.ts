"use server"

import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function addVehicle(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const make = formData.get("make") as string
  const model = formData.get("model") as string
  const year = parseInt(formData.get("year") as string)
  const fuel_type = formData.get("fuel_type") as string
  const nickname = (formData.get("nickname") as string) || null
  const license_plate = formData.get("license_plate") as string
  const initial_odometer = parseInt(formData.get("initial_odometer") as string)

  const { data, error } = await supabase
    .from("vehicles")
    .insert({ user_id: user.id, make, model, year, fuel_type, nickname, license_plate, initial_odometer })
    .select("id")
    .single()

  if (error) throw new Error(error.message)

  const cookieStore = await cookies()
  cookieStore.set("selected_vehicle_id", data.id, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: true,
    sameSite: "lax",
  })

  revalidatePath("/")
  redirect("/")
}

export async function editVehicle(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const make = formData.get("make") as string
  const model = formData.get("model") as string
  const year = parseInt(formData.get("year") as string)
  const fuel_type = formData.get("fuel_type") as string
  const nickname = (formData.get("nickname") as string) || null
  const license_plate = formData.get("license_plate") as string
  const rawOdo = formData.get("initial_odometer") as string | null

  const updates: Record<string, unknown> = { make, model, year, fuel_type, nickname, license_plate }
  if (rawOdo) updates.initial_odometer = parseInt(rawOdo)

  const { error } = await supabase
    .from("vehicles")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) throw new Error(error.message)

  revalidatePath("/")
  redirect(`/vehicle/${encodeURIComponent(license_plate)}`)
}

export async function deleteVehicle(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { error } = await supabase
    .from("vehicles")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) throw new Error(error.message)

  const cookieStore = await cookies()
  const { data: remaining } = await supabase
    .from("vehicles")
    .select("id")
    .eq("user_id", user.id)
    .order("created_at")

  if (remaining && remaining.length > 0) {
    cookieStore.set("selected_vehicle_id", remaining[0].id, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: true,
      sameSite: "lax",
    })
    redirect("/")
  } else {
    cookieStore.delete("selected_vehicle_id")
    redirect("/new-vehicle")
  }
}
