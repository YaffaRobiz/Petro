"use client"

import { useState, useTransition } from "react"
import { deleteFuelLog } from "@/app/actions/fuel"

export default function DeleteFuelButton({
  id,
  licensePlate,
}: {
  id: string
  licensePlate: string
}) {
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Delete?</span>
        <button
          onClick={() => startTransition(() => deleteFuelLog(id, licensePlate))}
          disabled={isPending}
          className="text-xs text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
        >
          {isPending ? "Deleting…" : "Yes"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs text-gray-400 hover:text-red-500 transition-colors"
    >
      Delete
    </button>
  )
}
