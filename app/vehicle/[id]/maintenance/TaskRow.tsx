"use client"

import { useState, useTransition, useRef, useEffect } from "react"
import { logService, deleteServiceTask, updateServiceTask } from "@/app/actions/serviceTasks"
import { INSPECTION_CATEGORY_ID, OTHER_CATEGORY_ID, getCategoryById } from "@/lib/serviceSchema"
import type { ServiceTask } from "@/lib/types"

type LastServiced = { date: string; odometer: number | null } | null
type Status = "completed" | "overdue" | "due_soon" | "ok"

function getStatus(task: ServiceTask, currentOdometer: number): Status {
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

function StatusDot({ status }: { status: Status }) {
  const color = { completed: "bg-green-500", overdue: "bg-red-500", due_soon: "bg-orange-400", ok: "bg-gray-300 dark:bg-gray-600" }[status]
  return <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${color}`} />
}

function DueBadge({ task, currentOdometer, status }: { task: ServiceTask; currentOdometer: number; status: Status }) {
  if (status === "completed") return null
  if (task.due_date) {
    const days = Math.floor((new Date(task.due_date).getTime() - Date.now()) / 86400000)
    const label = days < 0 ? `Overdue · ${Math.abs(days)} days` : `in ${days} days`
    const cls = status === "overdue" ? "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"
      : status === "due_soon" ? "bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
      : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
    return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>{label}</span>
  }
  if (task.expected_odometer !== null) {
    const km = task.expected_odometer - currentOdometer
    const label = km <= 0 ? `Overdue · ${Math.abs(km).toLocaleString("en-US")} km` : `in ${km.toLocaleString("en-US")} km`
    const cls = status === "overdue" ? "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"
      : status === "due_soon" ? "bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
      : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
    return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>{label}</span>
  }
  return null
}

function LogServiceModal({ task, vehicleId, licensePlate, currentOdometer, onClose }: {
  task: ServiceTask; vehicleId: string; licensePlate: string; currentOdometer: number; onClose: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError]   = useState<string | null>(null)
  const [odoError, setOdoError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const isInspection = task.category === INSPECTION_CATEGORY_ID
  const today = new Date().toISOString().split("T")[0]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  function handleOdoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseFloat(e.target.value)
    if (!isNaN(val) && val <= currentOdometer) {
      setOdoError(`Must be greater than current odometer (${currentOdometer.toLocaleString("en-US")} km)`)
    } else setOdoError(null)
  }

  function handleSubmit(formData: FormData) {
    if (!isInspection) {
      const odo = parseFloat(formData.get("odometer") as string)
      if (odo <= currentOdometer) { setOdoError(`Must be greater than current odometer (${currentOdometer.toLocaleString("en-US")} km)`); return }
    }
    setError(null); setOdoError(null)
    startTransition(async () => {
      try { await logService(task.id, vehicleId, licensePlate, task.category, task.service_type, formData); onClose() }
      catch (e) { setError(e instanceof Error ? e.message : "Something went wrong") }
    })
  }

  const inputCls = "w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
  const inputErrCls = "w-full border border-red-300 dark:border-red-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
  const labelCls = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">Log Service</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{task.service_type ?? "Other"}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
        {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}
        <form ref={formRef} action={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>Date <span className="text-red-500">*</span></label>
              <input name="date" type="date" required defaultValue={today} className={inputCls} /></div>
            <div><label className={labelCls}>Cost (€) <span className="text-red-500">*</span></label>
              <input name="cost" type="number" required min={0} step="0.01" placeholder="120.00" className={inputCls} /></div>
          </div>
          {!isInspection && (
            <div>
              <label className={labelCls}>Odometer (km) <span className="text-red-500">*</span></label>
              <input name="odometer" type="number" required min={currentOdometer + 1}
                placeholder={(currentOdometer + 1).toLocaleString("en-US")}
                onChange={handleOdoChange} className={odoError ? inputErrCls : inputCls} />
              {odoError && <p className="mt-1 text-xs text-red-500">{odoError}</p>}
            </div>
          )}
          <div><label className={labelCls}>Notes</label>
            <textarea name="notes" rows={2} placeholder="Optional…" className={`${inputCls} resize-none`} /></div>
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={isPending || !!odoError}
              className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium py-2 rounded-full hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {isPending ? "Saving…" : "Confirm"}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-600 border border-gray-200 dark:border-gray-700 rounded-full transition-colors">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function TaskRow({ task, currentOdometer, vehicleId, licensePlate, lastServiced, logInfo }: {
  task: ServiceTask; currentOdometer: number; vehicleId: string; licensePlate: string
  lastServiced: LastServiced; logInfo: { date: string; cost: number; odometer: number; notes: string | null } | null
}) {
  const [expanded, setExpanded]             = useState(false)
  const [editing, setEditing]               = useState(false)
  const [logOpen, setLogOpen]               = useState(false)
  const [confirming, setConfirming]         = useState(false)
  const [isPending, startTransition]        = useTransition()
  const [editPending, startEditTransition]  = useTransition()
  const [editError, setEditError]           = useState<string | null>(null)

  const status       = getStatus(task, currentOdometer)
  const isOther      = task.category === OTHER_CATEGORY_ID
  const isInspection = task.category === INSPECTION_CATEGORY_ID
  const categoryLabel = getCategoryById(task.category)?.label ?? task.category

  const lastServicedText = lastServiced
    ? isInspection
      ? new Date(lastServiced.date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
      : `${new Date(lastServiced.date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · ${Number(lastServiced.odometer).toLocaleString("en-US")} km`
    : "—"

  return (
    <>
      {logOpen && <LogServiceModal task={task} vehicleId={vehicleId} licensePlate={licensePlate} currentOdometer={currentOdometer} onClose={() => setLogOpen(false)} />}
      <div className="border-b border-gray-50 dark:border-gray-800 last:border-0">
        <div className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors cursor-pointer" onClick={() => setExpanded(e => !e)}>
          <StatusDot status={status} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {isOther ? `Other · ${task.service_type ?? ""}` : (task.service_type ?? "")}
            </p>
            {status === "completed" && logInfo ? (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Completed on {new Date(logInfo.date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                {!isInspection && logInfo.odometer > 0 && ` · ${logInfo.odometer.toLocaleString("en-US")} km`}
                {` · €${logInfo.cost.toFixed(2)}`}
              </p>
            ) : !isOther && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {categoryLabel} · (Last: {lastServicedText})
                {task.expected_odometer !== null && ` · Expected at ${task.expected_odometer.toLocaleString("en-US")} km`}
                {task.due_date && ` · due ${new Date(task.due_date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
            <DueBadge task={task} currentOdometer={currentOdometer} status={status} />
            {status !== "completed" && (
              <button onClick={() => setLogOpen(true)} className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg transition-colors">
                Log service
              </button>
            )}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              className={`text-gray-300 dark:text-gray-600 transition-transform duration-150 ${expanded ? "rotate-180" : ""}`}>
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </div>

        {expanded && (
          <div className="px-5 pb-4 pt-0 space-y-3 border-t border-gray-50 dark:border-gray-800">
            <div className="pt-3">
              <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Notes</p>
              {task.notes && <p className="text-sm text-gray-600 dark:text-gray-400">{task.notes}</p>}
              {logInfo?.notes && <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{logInfo.notes}</p>}
              {!task.notes && !logInfo?.notes && <p className="text-sm text-gray-400 dark:text-gray-600">—</p>}
            </div>

            {editing && status !== "completed" && (
              <form action={(fd) => { setEditError(null); startEditTransition(async () => { try { await updateServiceTask(task.id, licensePlate, fd); setEditing(false) } catch (e) { setEditError(e instanceof Error ? e.message : "Something went wrong") } }) }} className="space-y-2 pt-1">
                {isOther && (
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Service Name</label>
                    <input name="service_type" type="text" defaultValue={task.service_type ?? ""} required className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
                  </div>
                )}
                {task.expected_odometer !== null && (
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Expected at (km)</label>
                    <input name="expected_odometer" type="number" defaultValue={task.expected_odometer} min={currentOdometer + 1} required className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
                  </div>
                )}
                {task.due_date && (
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Due Date</label>
                    <input name="due_date" type="date" defaultValue={task.due_date} required className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Notes</label>
                  <textarea name="notes" rows={2} defaultValue={task.notes ?? ""} placeholder="Optional…" className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none" />
                </div>
                {editError && <p className="text-xs text-red-500">{editError}</p>}
                <div className="flex gap-2 pt-1">
                  <button type="submit" disabled={editPending} className="text-xs font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-3 py-1.5 rounded-full hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors disabled:opacity-50">
                    {editPending ? "Saving…" : "Save"}
                  </button>
                  <button type="button" onClick={() => { setEditing(false); setEditError(null) }} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Cancel</button>
                </div>
              </form>
            )}

            {!editing && (
              <div className="flex items-center justify-end gap-3 pt-1">
                {status !== "completed" && (
                  <button onClick={() => setEditing(true)} className="text-xs font-medium text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg transition-colors">Edit</button>
                )}
                {confirming ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Delete?</span>
                    <button onClick={() => startTransition(() => deleteServiceTask(task.id, licensePlate))} disabled={isPending} className="text-xs text-red-500 hover:text-red-600 font-medium disabled:opacity-50">{isPending ? "…" : "Yes"}</button>
                    <button onClick={() => setConfirming(false)} className="text-xs text-gray-400 hover:text-gray-600">No</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirming(true)} className="text-xs font-medium text-red-400 hover:text-red-500 border border-red-200 dark:border-red-900 px-3 py-1.5 rounded-lg transition-colors">Delete</button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
