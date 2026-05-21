"use client"

import { useState } from "react"
import MonthlyChart, { type MonthlyBreakdown, type MonthlyChartData } from "@/components/MonthlyChart"

type Filter = "all" | "fuel" | "maintenance"

export default function MonthlySpentCard({
  monthlyData,
  prevMonthName,
}: {
  monthlyData: MonthlyBreakdown[]
  prevMonthName: string
}) {
  const [filter, setFilter] = useState<Filter>("all")

  const getAmount = (m: MonthlyBreakdown) => {
    if (filter === "fuel") return m.fuelAmount
    if (filter === "maintenance") return m.maintAmount
    return m.fuelAmount + m.maintAmount
  }

  const currentIdx = monthlyData.findIndex(m => m.isCurrent)
  const thisMonthSpent = currentIdx >= 0 ? getAmount(monthlyData[currentIdx]) : 0
  const lastMonthSpent = currentIdx > 0 ? getAmount(monthlyData[currentIdx - 1]) : 0

  const spentDiff = thisMonthSpent - lastMonthSpent
  const spentPct = lastMonthSpent > 0 ? Math.abs((spentDiff / lastMonthSpent) * 100) : null
  const spentDown = spentDiff <= 0

  const chartData: MonthlyChartData[] = monthlyData.map(m => ({
    label: m.label,
    amount: getAmount(m),
    isCurrent: m.isCurrent,
  }))

  const labelCls = "text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest"

  const filterBtn = (f: Filter, label: string) => (
    <button
      key={f}
      onClick={() => setFilter(f)}
      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
        filter === f
          ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
          : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      }`}
    >
      {label}
    </button>
  )

  return (
    <>
      <div className="flex items-center justify-between">
        <p className={labelCls}>Monthly Spent</p>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 flex gap-0.5">
          {filterBtn("all", "All")}
          {filterBtn("fuel", "Fuel")}
          {filterBtn("maintenance", "Maintenance")}
        </div>
      </div>
      <div className="flex items-end gap-3 mt-3">
        <span className="text-[46px] font-medium text-gray-900 dark:text-white leading-none">
          €{thisMonthSpent.toFixed(2)}
        </span>
        {spentPct !== null && (
          <div className="mb-1 flex items-center gap-2 text-[13px]">
            <span className={`font-semibold px-2 py-0.5 rounded-full ${spentDown ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"}`}>
              {spentDown ? "↓" : "↑"} {spentPct.toFixed(1)}%
            </span>
            <span className="text-gray-400 dark:text-gray-500">
              €{Math.abs(spentDiff).toFixed(2)} {spentDown ? "less" : "more"} than {prevMonthName}
            </span>
          </div>
        )}
      </div>
      <MonthlyChart data={chartData} />
    </>
  )
}
