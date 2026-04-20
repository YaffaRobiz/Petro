import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import SidebarLinks from "./SidebarLinks"
import DarkModeToggle from "./DarkModeToggle"

export default async function Sidebar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: vehicles } = user
    ? await supabase
        .from("vehicles")
        .select("nickname, license_plate, make, model")
        .eq("user_id", user.id)
        .order("created_at")
        .limit(1)
    : { data: [] }

  const vehicle = vehicles?.[0]

  return (
    <aside className="w-[220px] min-h-screen bg-[#111110] flex flex-col fixed left-0 top-0 z-20">
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-2.5">
        <Image src="/petro_app_icon.png" alt="" width={26} height={26} className="rounded-lg" />
        <span className="text-white font-semibold text-[15px] tracking-tight">Petro</span>
      </div>

      {/* Nav links */}
      <SidebarLinks />

      {/* Footer */}
      <div className="mt-auto px-3 pb-4 space-y-1">
        {vehicle && (
          <div className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/8">
            <p className="text-[13px] font-medium text-white/70 truncate">
              {vehicle.nickname || `${vehicle.make} ${vehicle.model}`}
            </p>
            <p className="text-xs text-white/35 mt-0.5">{vehicle.license_plate}</p>
          </div>
        )}
        <div className="flex items-center justify-between px-1">
          <form action="/auth/logout" method="POST">
            <button
              type="submit"
              className="px-2 py-1.5 text-xs text-white/35 hover:text-white/60 rounded-lg hover:bg-white/5 transition-colors"
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
