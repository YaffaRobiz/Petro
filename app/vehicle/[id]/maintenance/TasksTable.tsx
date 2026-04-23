"use client"

import { useState } from "react"
import TaskRow from "./TaskRow"
import type { ServiceTask } from "@/lib/types"
import type { LastServicedMap } from "@/components/NewMaintenanceModal"
import { SERVICE_SCHEMA } from "@/lib/serviceSchema"

type Filter = "all" | "soon" | "due"
export type LogInfo = { date: string; cost: number; notes: string | null }

function getStatusKey(task: ServiceTask, currentOdometer: number): "completed" | "overdue" | "due_soon" | "ok" {
  if (task.completed_log_id) return "completed"
  if (task.due_date) {
    const days = Math.floor((new Date(task.due_date).getTime() - Date.now()) / 86400000)
    if (days < 0) return "overdue"
    if (days <= 30) return "due_soon"
    return "ok"
  }
  if (task.expected_odometer !== null) {
    const km = task.expected_odometer - currentOdometer
    if (km <= 0) return "overdue"
    if (km <= 1000) return "due_soon"
    return "ok"
  }
  return "ok"
}

export default function TasksTable({
  tasks,
  currentOdometer,
  vehicleId,
  licensePlate,
  lastServicedByType,
  logInfoById,
}: {
  tasks: ServiceTask[]
  currentOdometer: number
  vehicleId: string
  licensePlate: string
  lastServicedByType: LastServicedMap
  logInfoById: Record<string, LogInfo>
}) {
  const [filter, setFilter] = useState<Filter>("all")
  const [categoryFilter, setCategoryFilter] = useState("all")

  // Unique categories present in tasks
  const presentCategories = Array.from(new Set(tasks.map(t => t.category)))
  const categoryOptions = [
    { id: "all", label: "All" },
    ...SERVICE_SCHEMA.filter(c => presentCategories.includes(c.id)),
  ]

  const filtered = tasks.filter(task => {
    const s = getStatusKey(task, currentOdometer)
    if (filter === "soon" && s !== "due_soon")  return false
    if (filter === "due"  && s !== "overdue")   return false
    if (categoryFilter !== "all" && task.category !== categoryFilter) return false
    return true
  })

  const statusBtn = (f: Filter, label: string) => (
    <button
      onClick={() => setFilter(f)}
      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
        filter === f
          ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
          : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
      {/* Header row 1: label + status filter */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50 dark:border-gray-800">
        <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Tasks</p>
        <div className="flex items-center gap-1">
          {statusBtn("all",  "All")}
          {statusBtn("soon", "Due Soon")}
          {statusBtn("due",  "Overdue")}
        </div>
      </div>

      {/* Header row 2: category filter */}
      {categoryOptions.length > 2 && (
        <div className="flex items-center gap-1.5 px-5 py-2.5 border-b border-gray-50 dark:border-gray-800 overflow-x-auto">
          {categoryOptions.map(c => (
            <button
              key={c.id}
              onClick={() => setCategoryFilter(c.id)}
              className={`whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors flex-shrink-0 ${
                categoryFilter === c.id
                  ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">
          <p className="text-sm font-medium">
            {filter === "all" && categoryFilter === "all"
              ? "No services added yet"
              : "No matching services"}
          </p>
        </div>
      ) : (
        filtered.map(task => (
          <TaskRow
            key={task.id}
            task={task}
            currentOdometer={currentOdometer}
            vehicleId={vehicleId}
            licensePlate={licensePlate}
            lastServiced={task.service_type ? (lastServicedByType[task.service_type] ?? null) : null}
            logInfo={task.completed_log_id ? (logInfoById[task.completed_log_id] ?? null) : null}
          />
        ))
      )}
    </div>
  )
}
