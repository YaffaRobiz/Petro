"use client"

import { useState } from "react"
import FuelLogRow from "./FuelLogRow"
import type { FuelLog } from "@/lib/types"

type SortField = "date" | "odometer" | "liters" | "cost" | "cpl" | "kml"
type SortDir = "asc" | "desc"

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <span className={`ml-1 inline-block text-[10px] ${active ? "text-gray-600 dark:text-gray-300" : "text-gray-300 dark:text-gray-600"}`}>
      {active ? (dir === "asc" ? "↑" : "↓") : "↕"}
    </span>
  )
}

export default function FuelTable({
  logs,
  efficiencyById,
  licensePlate,
}: {
  logs: FuelLog[]
  efficiencyById: Record<string, number | null>
  licensePlate: string
}) {
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  function handleSort(field: SortField) {
    if (field === sortField) {
      setSortDir(d => d === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDir(field === "date" ? "desc" : "asc")
    }
  }

  const sorted = [...logs].sort((a, b) => {
    let aVal: number, bVal: number
    switch (sortField) {
      case "date":     aVal = a.date.localeCompare(b.date); bVal = 0; break
      case "odometer": aVal = Number(a.odometer); bVal = Number(b.odometer); break
      case "liters":   aVal = Number(a.liters);   bVal = Number(b.liters);   break
      case "cost":     aVal = Number(a.cost);      bVal = Number(b.cost);     break
      case "cpl":      aVal = Number(a.liters) > 0 ? Number(a.cost) / Number(a.liters) : 0
                       bVal = Number(b.liters) > 0 ? Number(b.cost) / Number(b.liters) : 0; break
      case "kml":      aVal = efficiencyById[a.id] ?? -1; bVal = efficiencyById[b.id] ?? -1; break
      default:         aVal = 0; bVal = 0
    }

    const cmp = sortField === "date"
      ? a.date.localeCompare(b.date)
      : aVal - bVal

    return sortDir === "asc" ? cmp : -cmp
  })

  const thCls = "px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 transition-colors whitespace-nowrap"

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
      {logs.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <p className="text-base font-medium mb-1">No fill-ups logged yet</p>
          <p className="text-sm">Add your first fill-up above.</p>
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <th className={`${thCls} text-left`} onClick={() => handleSort("date")}>
                Date <SortIcon active={sortField === "date"} dir={sortDir} />
              </th>
              <th className={`${thCls} text-right`} onClick={() => handleSort("odometer")}>
                Odometer <SortIcon active={sortField === "odometer"} dir={sortDir} />
              </th>
              <th className={`${thCls} text-right`} onClick={() => handleSort("liters")}>
                Liters <SortIcon active={sortField === "liters"} dir={sortDir} />
              </th>
              <th className={`${thCls} text-right`} onClick={() => handleSort("cost")}>
                Cost <SortIcon active={sortField === "cost"} dir={sortDir} />
              </th>
              <th className={`${thCls} text-right`} onClick={() => handleSort("cpl")}>
                €/L <SortIcon active={sortField === "cpl"} dir={sortDir} />
              </th>
              <th className={`${thCls} text-right`} onClick={() => handleSort("kml")}>
                km/L <SortIcon active={sortField === "kml"} dir={sortDir} />
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((log, i) => (
              <FuelLogRow
                key={log.id}
                log={log}
                licensePlate={licensePlate}
                index={i}
                efficiency={efficiencyById[log.id] ?? null}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
