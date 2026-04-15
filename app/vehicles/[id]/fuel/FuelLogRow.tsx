"use client"

import { useState, useTransition } from "react"
import { updateFuelLog, deleteFuelLog } from "@/app/actions/fuel"
import { TrashIcon, EditIcon } from "@/lib/icons"
import type { FuelLog } from "@/lib/types"

export default function FuelLogRow({
  log,
  licensePlate,
  index,
  efficiency,
}: {
  log: FuelLog
  licensePlate: string
  index: number
  efficiency: number | null
}) {
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()

  const costPerLiter = Number(log.liters) > 0
    ? Number(log.cost) / Number(log.liters)
    : 0

  const rowClass = index % 2 === 0
    ? "border-b border-gray-50 dark:border-gray-800"
    : "border-b border-gray-50 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/20"

  if (editing) {
    return (
      <tr className="border-b border-blue-100 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-900/10">
        <td className="px-3 py-2">
          <input
            form={`edit-fuel-${log.id}`}
            name="date"
            type="date"
            defaultValue={log.date}
            required
            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </td>
        <td className="px-3 py-2">
          <input
            form={`edit-fuel-${log.id}`}
            name="odometer"
            type="number"
            defaultValue={log.odometer}
            required
            min={0}
            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
          />
        </td>
        <td className="px-3 py-2">
          <input
            form={`edit-fuel-${log.id}`}
            name="liters"
            type="number"
            defaultValue={Number(log.liters).toFixed(2)}
            required
            min={0}
            step="0.01"
            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
          />
        </td>
        <td className="px-3 py-2">
          <input
            form={`edit-fuel-${log.id}`}
            name="cost"
            type="number"
            defaultValue={Number(log.cost).toFixed(2)}
            required
            min={0}
            step="0.01"
            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
          />
        </td>
        <td className="px-4 py-2 text-right text-gray-400 dark:text-gray-600 text-sm">—</td>
        <td className="px-4 py-2 text-right text-gray-400 dark:text-gray-600 text-sm">—</td>
        <td className="px-3 py-2 text-right">
          <form
            id={`edit-fuel-${log.id}`}
            action={(formData) =>
              startTransition(async () => {
                await updateFuelLog(log.id, licensePlate, formData)
                setEditing(false)
              })
            }
            className="flex items-center justify-end gap-2"
          >
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-3 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-700 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-3 py-1 text-xs font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md transition-colors"
            >
              {isPending ? "Saving…" : "Save"}
            </button>
          </form>
        </td>
      </tr>
    )
  }

  return (
    <tr className={rowClass}>
      <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
        {new Date(log.date).toLocaleDateString("en-GB")}
      </td>
      <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
        {Number(log.odometer).toLocaleString()} km
      </td>
      <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
        {Number(log.liters).toFixed(2)} L
      </td>
      <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300 font-medium">
        €{Number(log.cost).toFixed(2)}
      </td>
      <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">
        €{costPerLiter.toFixed(3)}
      </td>
      <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">
        {efficiency !== null ? `${efficiency.toFixed(1)}` : "—"}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => { setEditing(true); setConfirming(false) }}
            className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20"
            aria-label="Edit"
          >
            <EditIcon className="w-4 h-4" />
          </button>

          {confirming ? (
            <div className="flex items-center gap-1.5 ml-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">Delete?</span>
              <button
                onClick={() => startTransition(() => deleteFuelLog(log.id, licensePlate))}
                disabled={isPending}
                className="text-xs text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
              >
                {isPending ? "…" : "Yes"}
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
              aria-label="Delete"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}
