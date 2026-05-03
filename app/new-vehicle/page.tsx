import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import NewVehicleForm from "./NewVehicleForm"

export default async function NewVehiclePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)

  if (vehicles && vehicles.length > 0) redirect("/")

  return <NewVehicleForm />
}
