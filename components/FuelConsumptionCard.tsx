"use client"

import { useState } from "react"

type Unit = "kml" | "l100"

export type FuelCardData = {
  avg30dKml:      number | null
  prevAvg30dKml:  number | null
  lastFillKml:    number | null
  prevMonthKml:   number | null
  allTimeAvgKml:  number | null
  bestKml:        number | null
  worstKml:       number | null
  monthlyAvgsKml: (number | null)[]
}

const conv = (kml: number | null, unit: Unit): number | null =>
  kml === null ? null : unit === "kml" ? kml : parseFloat((100 / kml).toFixed(2))

const fmt = (v: number | null) => v === null ? "—" : v.toFixed(1)

// Build SVG polyline + area path from monthly values
function buildTrendPath(
  points: { x: number; y: number }[],
  chartH: number,
): { line: string; area: string } {
  if (points.length < 2) return { line: "", area: "" }
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")
  const area = `${d} L ${points[points.length - 1].x.toFixed(1)},${chartH} L ${points[0].x.toFixed(1)},${chartH} Z`
  return { line: d, area }
}

export default function FuelConsumptionCard({ data }: { data: FuelCardData }) {
  const [unit, setUnit] = useState<Unit>("kml")

  const avg     = conv(data.avg30dKml, unit)
  const prevAvg = conv(data.prevAvg30dKml, unit)
  const allTimeAvg = conv(data.allTimeAvgKml, unit)

  // Badge logic
  const hasDiff = avg !== null && prevAvg !== null
  const diff    = hasDiff ? avg! - prevAvg! : 0
  const pct     = hasDiff && prevAvg !== 0 ? Math.abs(diff / prevAvg!) * 100 : null
  // km/L: higher = better; L/100km: lower = better
  const improved = unit === "kml" ? diff > 0 : diff < 0

  // Monthly chart (convert, keep nulls)
  const monthly = data.monthlyAvgsKml.map(v => conv(v, unit))
  const nonNull = monthly.filter((v): v is number => v !== null)

  const CHART_W = 300, CHART_H = 64
  const yMin = nonNull.length > 0 ? Math.min(...nonNull) * 0.94 : 0
  const yMax = nonNull.length > 0 ? Math.max(...nonNull) * 1.06 : 1
  const yRange = yMax - yMin || 1

  const toY = (v: number) => CHART_H - ((v - yMin) / yRange) * CHART_H
  const toX = (i: number) => (i / 11) * CHART_W

  const chartPts = monthly
    .map((v, i) => v === null ? null : { x: toX(i), y: toY(v) })
    .filter((p): p is { x: number; y: number } => p !== null)

  const { line: trendLine, area: trendArea } = buildTrendPath(chartPts, CHART_H)
  const avgY = allTimeAvg !== null ? toY(allTimeAvg) : null

  // For L/100km: best fill-up = highest km/L → lowest L/100km; worst = lowest km/L → highest L/100km
  const bestDisplay  = conv(data.bestKml,  unit)
  const worstDisplay = conv(data.worstKml, unit)

  const labelCls = "text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest"

  const unitBtn = (u: Unit, label: string) => (
    <button
      key={u}
      onClick={() => setUnit(u)}
      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
        unit === u
          ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
          : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      }`}
    >
      {label}
    </button>
  )

  const stats = [
    { label: "Last fill-up", value: fmt(conv(data.lastFillKml, unit)),  cls: "text-gray-900 dark:text-white" },
    { label: "Best",         value: fmt(bestDisplay),                    cls: "text-green-600 dark:text-green-400" },
    { label: "Worst",        value: fmt(worstDisplay),                   cls: "text-red-500 dark:text-red-400" },
    { label: "Prev mo",      value: fmt(conv(data.prevMonthKml, unit)),  cls: "text-gray-900 dark:text-white" },
  ]

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className={labelCls}>Fuel Consumption</p>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 flex gap-0.5">
          {unitBtn("kml", "km/L")}
          {unitBtn("l100", "L/100km")}
        </div>
      </div>

      {/* Body: number left, chart + stats right */}
      <div className="mt-3 flex items-stretch gap-0">

        {/* Left: avg + badge */}
        <div className="flex-shrink-0 w-[36%] flex flex-col justify-center">
          <div className="flex items-baseline gap-2">
            <span className="text-[42px] font-medium text-gray-900 dark:text-white leading-none">
              {fmt(avg)}
            </span>
            {avg !== null && (
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 leading-tight">
                  {unit === "kml" ? "km/L" : "L/100km"}
                </span>
                <span className="text-[11px] text-gray-400 dark:text-gray-500 leading-tight">current avg</span>
              </div>
            )}
          </div>
          {pct !== null && (
            <div className="mt-2 flex items-center gap-1.5 text-[12px]">
              <span className={`font-semibold px-1.5 py-0.5 rounded-full ${improved ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"}`}>
                {diff > 0 ? "↑" : "↓"} {pct.toFixed(1)}%
              </span>
              <span className="text-gray-400 dark:text-gray-500">from {fmt(prevAvg)}</span>
            </div>
          )}
        </div>

        {/* Right: chart + stats below */}
        <div className="flex-1 min-w-0 flex flex-col gap-3 pl-6 border-l border-gray-100 dark:border-gray-800">
          {/* Chart */}
          <div>
            <p className="text-[11px] text-gray-300 dark:text-gray-600 text-right mb-1.5">12-mo trend</p>
            <svg
              width="100%"
              viewBox={`0 0 ${CHART_W} ${CHART_H}`}
              preserveAspectRatio="none"
              className="overflow-visible"
            >
              <defs>
                <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9bc53d" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#9bc53d" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {/* Area fill */}
              {trendArea && <path d={trendArea} fill="url(#tg)" />}

              {/* Trend line */}
              {trendLine && (
                <path d={trendLine} fill="none" stroke="#9bc53d" strokeWidth="1.5"
                  strokeLinejoin="round" strokeLinecap="round" />
              )}

              {/* All-time avg dashed line */}
              {avgY !== null && allTimeAvg !== null && (
                <>
                  <line x1={0} y1={avgY} x2={CHART_W * 0.84} y2={avgY}
                    stroke="#9ca3af" strokeWidth="1" strokeDasharray="4 3" />
                  <text x={CHART_W} y={avgY + 4} textAnchor="end" fontSize="9"
                    className="fill-gray-400 dark:fill-gray-500">
                    avg {allTimeAvg.toFixed(1)}
                  </text>
                </>
              )}
            </svg>
          </div>

          {/* Stats below chart */}
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            {stats.map(({ label, value, cls }) => (
              <div key={label}>
                <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{label}</p>
                <p className={`text-[20px] font-light leading-tight mt-0.5 tracking-tight ${cls}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  )
}
