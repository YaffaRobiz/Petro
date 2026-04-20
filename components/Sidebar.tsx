import Image from "next/image"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import SidebarLinks from "./SidebarLinks"
import DarkModeToggle from "./DarkModeToggle"
import VehicleSwitcher from "./VehicleSwitcher"

export default async function Sidebar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: vehicles } = user
    ? await supabase
        .from("vehicles")
        .select("id, nickname, license_plate, make, model")
        .eq("user_id", user.id)
        .order("created_at")
    : { data: [] }

  const cookieStore = await cookies()
  const selectedId = cookieStore.get("selected_vehicle_id")?.value ?? null

  return (
    <aside className="w-[220px] min-h-screen bg-white border-r border-gray-100 flex flex-col fixed left-0 top-0 z-20">
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-2.5">
        <Image src="/petro_app_icon.png" alt="" width={26} height={26} className="rounded-lg" />
        <span className="text-gray-900 font-semibold text-[15px] tracking-tight">Petro</span>
      </div>

      {/* Nav links */}
      <SidebarLinks />

      {/* Footer */}
      <div className="mt-auto px-3 pb-4 space-y-2">
        {vehicles && vehicles.length > 0 && (
          <VehicleSwitcher vehicles={vehicles} selectedId={selectedId} />
        )}
        <div className="flex items-center justify-between px-1">
          <form action="/auth/logout" method="POST">
            <button
              type="submit"
              className="px-2 py-1.5 text-xs text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Log out
            </button>
          </form>
          <DarkModeToggle />
        </div>
      </div>
    </aside>
  )
}
