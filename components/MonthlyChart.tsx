"use client"

import { useState } from "react"

export type MonthlyChartData = {
  label: string
  amount: number
  isCurrent: boolean
}

const CURRENT_COLOR = "#9bc53d"
const DEFAULT_COLOR = "#dcdcd3"
const HOVER_COLOR = "#c4c4bb"
const CHART_H = 72
const MIN_H_EMPTY = 3
const MIN_H_DATA = 8

export default function MonthlyChart({ data }: { data: MonthlyChartData[] }) {
  const [hovered, setHovered] = useState<number | null>(null)
  const maxAmount = Math.max(...data.map(d => d.amount), 1)

  return (
    <div className="mt-5 pt-4 border-t border-gray-50 dark:border-gray-800 select-none">
      {/* Bars */}
      <div className="flex items-end gap-[3px]" style={{ height: CHART_H }}>
        {data.map((item, i) => {
          const isHovered = hovered === i
          const barH = item.amount > 0
            ? Math.max((item.amount / maxAmount) * (CHART_H - 4), MIN_H_DATA)
            : MIN_H_EMPTY

          const tooltipStyle: React.CSSProperties = { left: "50%", transform: "translateX(-50%)" }

          return (
            <div
              key={i}
              className="relative flex-1 flex flex-col justify-end cursor-pointer"
              style={{ height: "100%" }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Tooltip */}
              {isHovered && (
                <div
                  className="absolute z-10 pointer-events-none"
                  style={{ bottom: barH + 8, ...tooltipStyle }}
                >
                  <div className="bg-gray-900 text-white text-[11px] font-medium px-2 py-1 rounded-md whitespace-nowrap">
                    €{item.amount.toFixed(2)}
                  </div>
                  {/* Arrow */}
                  <div
                    className="w-0 h-0 mx-auto"
                    style={{
                      borderLeft: "4px solid transparent",
                      borderRight: "4px solid transparent",
                      borderTop: "4px solid #111827",
                    }}
                  />
                </div>
              )}

              {/* Bar */}
              <div
                className="w-full rounded-t-sm"
                style={{
                  height: barH,
                  backgroundColor: item.isCurrent
                    ? CURRENT_COLOR
                    : isHovered
                    ? HOVER_COLOR
                    : DEFAULT_COLOR,
                  transition: "background-color 120ms ease",
                }}
              />
            </div>
          )
        })}
      </div>

      {/* Month labels */}
      <div className="flex gap-[3px] mt-1.5">
        {data.map((item, i) => (
          <div key={i} className="flex-1 text-center">
            <span
              className="text-[10px]"
              style={{
                color: item.isCurrent ? "#6b7280" : "#d1d5db",
                fontWeight: item.isCurrent ? 500 : 400,
              }}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
