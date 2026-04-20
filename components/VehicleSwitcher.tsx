"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { switchVehicle } from "@/app/actions/switchVehicle"

type Vehicle = {
  id: string
  nickname: string | null
  license_plate: string
  make: string
  model: string
}

export default function VehicleSwitcher({
  vehicles,
  selectedId,
}: {
  vehicles: Vehicle[]
  selectedId: string | null
}) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const selected = vehicles.find(v => v.id === selectedId) ?? vehicles[0]
  if (!selected) return null

  const displayName = selected.nickname || `${selected.make} ${selected.model}`

  async function handleSwitch(id: string) {
    await switchVehicle(id)
    setOpen(false)
    router.refresh()
  }

  return (
    <div className="relative">
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 right-0 mb-2 z-20 bg-white border border-gray-100 rounded-xl overflow-hidden shadow-lg">
            {vehicles.map(v => {
              const name = v.nickname || `${v.make} ${v.model}`
              const isActive = v.id === selected.id
              return (
                <button
                  key={v.id}
                  onClick={() => handleSwitch(v.id)}
                  className={`w-full flex items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${isActive ? "bg-gray-50" : ""}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isActive ? "bg-green-500" : "bg-gray-300"}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-gray-800 truncate">{name}</p>
                    <p className="text-xs text-gray-400">{v.license_plate}</p>
                  </div>
                  {isActive && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-500 flex-shrink-0">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </button>
              )
            })}
            <div className="border-t border-gray-100">
              <Link
                href="/vehicles/new"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-3 text-sm text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <span className="text-base leading-none font-medium">+</span> Add vehicle
              </Link>
            </div>
          </div>
        </>
      )}

      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors text-left"
      >
        <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-gray-700 truncate">{displayName}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{selected.license_plate}</p>
        </div>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={`text-gray-300 flex-shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
    </div>
  )
}
