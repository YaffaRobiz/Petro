import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"

export default async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10 w-full">
      <div className="w-full px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/">
            <Image
              src="/petro_app_icon.png"
              alt="Petro"
              width={32}
              height={32}
              className="rounded-lg"
            />
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              href="/"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/vehicles"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Vehicles
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 hidden sm:block">
            {user?.user_metadata?.username ?? user?.email}
          </span>
          <form action="/auth/logout" method="POST">
            <button
              type="submit"
              className="text-sm text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 px-3 py-1.5 rounded-lg transition-colors"
            >
              Log out
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}
