"use client"

import { useState, useTransition, useRef } from "react"
import { addFuelLog } from "@/app/actions/fuel"

export default function AddFuelForm({
  vehicleId,
  licensePlate,
}: {
  vehicleId: string
  licensePlate: string
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const today = new Date().toISOString().split("T")[0]

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      try {
        await addFuelLog(vehicleId, licensePlate, formData)
        formRef.current?.reset()
        setOpen(false)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong")
      }
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        + Add Fill-Up
      </button>
    )
  }

  return (
    <div className="bg-white border border-blue-200 rounded-xl p-5">
      <h3 className="font-semibold text-gray-900 mb-4">New Fill-Up</h3>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <form ref={formRef} action={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              name="date"
              type="date"
              required
              defaultValue={today}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Odometer (km) <span className="text-red-500">*</span>
            </label>
            <input
              name="odometer"
              type="number"
              required
              min={0}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="48500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Liters <span className="text-red-500">*</span>
            </label>
            <input
              name="liters"
              type="number"
              required
              min={0}
              step="0.01"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="40.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Cost (€) <span className="text-red-500">*</span>
            </label>
            <input
              name="cost"
              type="number"
              required
              min={0}
              step="0.01"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="65.00"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={() => { setOpen(false); setError(null) }}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            {isPending ? "Saving…" : "Save Fill-Up"}
          </button>
        </div>
      </form>
    </div>
  )
}
