"use client"

import { useState, useTransition, useRef, useEffect } from "react"
import { createServiceTask } from "@/app/actions/serviceTasks"
import { SERVICE_SCHEMA, INSPECTION_CATEGORY_ID, OTHER_CATEGORY_ID } from "@/lib/serviceSchema"

export type LastServicedMap = Record<string, { date: string; odometer: number | null }>

export default function NewMaintenanceModal({
  vehicleId,
  licensePlate,
  currentOdometer,
  lastServicedByType,
}: {
  vehicleId: string
  licensePlate: string
  currentOdometer: number
  lastServicedByType: LastServicedMap
}) {
  const [open, setOpen]               = useState(false)
  const [isPending, startTransition]  = useTransition()
  const [error, setError]             = useState<string | null>(null)
  const [category, setCategory]           = useState("")
  const [serviceType, setServiceType]     = useState("")
  const [customService, setCustomService] = useState("")
  const [dueKm, setDueKm]                = useState("")
  const formRef = useRef<HTMLFormElement>(null)

  const today = new Date().toISOString().split("T")[0]

  const isOther      = category === OTHER_CATEGORY_ID
  const isInspection = category === INSPECTION_CATEGORY_ID
  const selectedCat  = SERVICE_SCHEMA.find(c => c.id === category)
  const lastServiced = (!isOther && serviceType) ? (lastServicedByType[serviceType] ?? null) : null
  const expectedOdo  = (!isInspection && dueKm) ? currentOdometer + parseInt(dueKm) : null

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  function handleClose() {
    setOpen(false)
    setError(null)
    setCategory("")
    setServiceType("")
    setCustomService("")
    setDueKm("")
    formRef.current?.reset()
  }

  function handleCategoryChange(val: string) {
    setCategory(val)
    setServiceType("")
  }

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      try {
        await createServiceTask(vehicleId, licensePlate, formData)
        handleClose()
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong")
      }
    })
  }

  const inputCls = "w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
  const labelCls = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5"

  const canSubmit = category &&
    (isOther ? customService.trim() !== "" : serviceType !== "") &&
    (isInspection ? true : dueKm !== "")

  return (
    <>
      <button
        onClick={() => { setOpen(true); setError(null) }}
        className="flex items-center gap-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium px-4 py-2 rounded-full hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors"
      >
        <span className="text-base leading-none">+</span> Add service
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={handleClose} />

          <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">New Service</h2>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Close">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-lg px-4 py-3 mb-4">
                {error}
              </div>
            )}

            <form ref={formRef} action={handleSubmit} className="space-y-4">
              {/* Category */}
              <div>
                <label className={labelCls}>Category <span className="text-red-500">*</span></label>
                <select
                  name="category"
                  required
                  value={category}
                  onChange={e => handleCategoryChange(e.target.value)}
                  className={inputCls}
                >
                  <option value="" disabled>Select category</option>
                  {SERVICE_SCHEMA.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Free text name for Other */}
              {isOther && (
                <div>
                  <label className={labelCls}>Service Name <span className="text-red-500">*</span></label>
                  <input
                    name="service_type"
                    type="text"
                    required
                    placeholder="e.g. Windshield replacement"
                    value={customService}
                    onChange={e => setCustomService(e.target.value)}
                    className={inputCls}
                  />
                </div>
              )}

              {/* Service Type — hidden for Other */}
              {category && !isOther && (
                <div>
                  <label className={labelCls}>Service Type <span className="text-red-500">*</span></label>
                  <select
                    name="service_type"
                    required
                    value={serviceType}
                    onChange={e => setServiceType(e.target.value)}
                    className={inputCls}
                  >
                    <option value="" disabled>Select type</option>
                    {selectedCat?.services.map(s => (
                      <option key={s.id} value={s.label}>{s.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Last Serviced — read-only, hidden for Other */}
              {!isOther && serviceType && (
                <div>
                  <label className={labelCls}>Last Serviced</label>
                  <div className={`${inputCls} bg-gray-50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500 cursor-not-allowed`}>
                    {lastServiced
                      ? isInspection
                        ? new Date(lastServiced.date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                        : `${new Date(lastServiced.date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · ${Number(lastServiced.odometer).toLocaleString("en-US")} km`
                      : "—"}
                  </div>
                </div>
              )}

              {/* Due field */}
              {category && (
                isInspection ? (
                  <div>
                    <label className={labelCls}>Due Date <span className="text-red-500">*</span></label>
                    <input name="due_date" type="date" required min={today} className={inputCls} />
                  </div>
                ) : (
                  <div>
                    <label className={labelCls}>Due in (km) <span className="text-red-500">*</span></label>
                    <input
                      name="due_km"
                      type="number"
                      required
                      min={1}
                      placeholder="e.g. 5000"
                      value={dueKm}
                      onChange={e => setDueKm(e.target.value)}
                      className={inputCls}
                    />
                    {expectedOdo !== null && (
                      <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                        Expected at {expectedOdo.toLocaleString("en-US")} km
                      </p>
                    )}
                  </div>
                )
              )}

              {/* Notes */}
              {category && (
                <div>
                  <label className={labelCls}>Notes</label>
                  <textarea name="notes" rows={2} placeholder="Optional…" className={`${inputCls} resize-none`} />
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={isPending || !canSubmit}
                  className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium py-2 rounded-full hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isPending ? "Saving…" : "Save service"}
                </button>
                <button type="button" onClick={handleClose} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-full transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
