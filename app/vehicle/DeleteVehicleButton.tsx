"use client"

import { useState, useTransition } from "react"
import { deleteVehicle } from "@/app/actions/vehicles"

export default function DeleteVehicleButton({ id }: { id: string }) {
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (confirming) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500 dark:text-gray-400">Are you sure?</span>
        <button
          onClick={() => startTransition(() => deleteVehicle(id))}
          disabled={isPending}
          className="text-sm font-medium text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          {isPending ? "Deleting…" : "Yes, delete"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-sm font-medium text-red-500 hover:text-red-600 border border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors"
    >
      Delete vehicle
    </button>
  )
}
