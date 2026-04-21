"use client"

import { useState } from "react"

export type ChartBar = { label: string; amount: number; isCurrent?: boolean }

const CHART_H = 72
const MIN_H_EMPTY = 3
const MIN_H_DATA = 8
const CURRENT_COLOR = "#9bc53d"
const DEFAULT_COLOR = "#dcdcd3"
const HOVER_COLOR = "#c4c4bb"

function BarChart({ bars }: { bars: ChartBar[] }) {
  const [hovered, setHovered] = useState<number | null>(null)
  const maxAmount = Math.max(...bars.map(b => b.amount), 1)

  return (
    <div className="select-none">
      <div className="flex items-end gap-[3px]" style={{ height: CHART_H }}>
        {bars.map((bar, i) => {
          const isHovered = hovered === i
          const barH = bar.amount > 0
            ? Math.max((bar.amount / maxAmount) * (CHART_H - 4), MIN_H_DATA)
            : MIN_H_EMPTY

          return (
            <div
              key={i}
              className="relative flex-1 flex flex-col justify-end cursor-pointer"
              style={{ height: "100%" }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {isHovered && (
                <div className="absolute z-10 pointer-events-none" style={{ bottom: barH + 8, left: "50%", transform: "translateX(-50%)" }}>
                  <div className="bg-gray-900 text-white text-[11px] font-medium px-2 py-1 rounded-md whitespace-nowrap">
                    €{bar.amount.toFixed(2)}
                  </div>
                  <div className="w-0 h-0 mx-auto" style={{ borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderTop: "4px solid #111827" }} />
                </div>
              )}
              <div
                className="w-full rounded-t-sm"
                style={{
                  height: barH,
                  backgroundColor: bar.isCurrent ? CURRENT_COLOR : isHovered ? HOVER_COLOR : DEFAULT_COLOR,
                  transition: "background-color 120ms ease",
                }}
              />
            </div>
          )
        })}
      </div>
      <div className="flex gap-[3px] mt-1.5">
        {bars.map((bar, i) => (
          <div key={i} className="flex-1 text-center">
            <span className="text-[10px]" style={{ color: bar.isCurrent ? "#6b7280" : "#d1d5db", fontWeight: bar.isCurrent ? 500 : 400 }}>
              {bar.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function FuelCostChart({
  monthly,
  yearly,
}: {
  monthly: ChartBar[]
  yearly: ChartBar[]
}) {
  const [view, setView] = useState<"month" | "year">("month")

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Total Cost</p>
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 text-[11px] font-medium">
          <button
            onClick={() => setView("month")}
            className={`px-2.5 py-1 rounded-md transition-colors ${view === "month" ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"}`}
          >
            Month
          </button>
          <button
            onClick={() => setView("year")}
            className={`px-2.5 py-1 rounded-md transition-colors ${view === "year" ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"}`}
          >
            Year
          </button>
        </div>
      </div>
      <BarChart bars={view === "month" ? monthly : yearly} />
    </div>
  )
}
