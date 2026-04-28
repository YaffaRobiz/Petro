"use client"

import { useState, useTransition, useRef, useEffect } from "react"
import { createServiceTask } from "@/app/actions/serviceTasks"
import { logPastService, getSurroundingOdometers } from "@/app/actions/maintenance"
import { SERVICE_SCHEMA, INSPECTION_CATEGORY_ID, OTHER_CATEGORY_ID } from "@/lib/serviceSchema"

export type LastServicedMap = Record<string, { date: string; odometer: number | null }>

const today = new Date().toISOString().split("T")[0]

const inputCls = "w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
const inputErrCls = "w-full border border-red-300 dark:border-red-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
const labelCls = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5"
const readonlyCls = `${inputCls} bg-gray-50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500 cursor-not-allowed`

function CategoryServiceFields({
  category, serviceType, customService, lastServicedByType,
  onCategoryChange, onServiceTypeChange, onCustomServiceChange, showLastServiced,
}: {
  category: string; serviceType: string; customService: string
  lastServicedByType: LastServicedMap
  onCategoryChange: (v: string) => void
  onServiceTypeChange: (v: string) => void
  onCustomServiceChange: (v: string) => void
  showLastServiced: boolean
}) {
  const isOther      = category === OTHER_CATEGORY_ID
  const isInspection = category === INSPECTION_CATEGORY_ID
  const selectedCat  = SERVICE_SCHEMA.find(c => c.id === category)
  const lastServiced = (!isOther && serviceType) ? (lastServicedByType[serviceType] ?? null) : null

  return (
    <>
      <div>
        <label className={labelCls}>Category <span className="text-red-500">*</span></label>
        <select name="category" required value={category} onChange={e => onCategoryChange(e.target.value)} className={inputCls}>
          <option value="" disabled>Select category</option>
          {SERVICE_SCHEMA.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </div>

      {isOther && (
        <div>
          <label className={labelCls}>Service Name <span className="text-red-500">*</span></label>
          <input name="service_type" type="text" required placeholder="e.g. Windshield replacement"
            value={customService} onChange={e => onCustomServiceChange(e.target.value)} className={inputCls} />
        </div>
      )}

      {category && !isOther && (
        <div>
          <label className={labelCls}>Service Type <span className="text-red-500">*</span></label>
          <select name="service_type" required value={serviceType} onChange={e => onServiceTypeChange(e.target.value)} className={inputCls}>
            <option value="" disabled>Select type</option>
            {selectedCat?.services.map(s => <option key={s.id} value={s.label}>{s.label}</option>)}
          </select>
        </div>
      )}

      {showLastServiced && !isOther && serviceType && (
        <div>
          <label className={labelCls}>Last Serviced</label>
          <div className={readonlyCls}>
            {lastServiced
              ? isInspection
                ? new Date(lastServiced.date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                : `${new Date(lastServiced.date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · ${Number(lastServiced.odometer).toLocaleString("en-US")} km`
              : "—"}
          </div>
        </div>
      )}
    </>
  )
}

export default function NewMaintenanceModal({
  vehicleId, licensePlate, currentOdometer, lastServicedByType,
}: {
  vehicleId: string
  licensePlate: string
  currentOdometer: number
  lastServicedByType: LastServicedMap
}) {
  const [open, setOpen]              = useState(false)
  const [tab, setTab]                = useState<"future" | "past">("future")
  const [isPending, startTransition] = useTransition()
  const [error, setError]            = useState<string | null>(null)
  const futureRef = useRef<HTMLFormElement>(null)
  const pastRef   = useRef<HTMLFormElement>(null)

  // Future tab state
  const [category, setCategory]           = useState("")
  const [serviceType, setServiceType]     = useState("")
  const [customService, setCustomService] = useState("")
  const [dueKm, setDueKm]                = useState("")

  // Past tab state
  const [pCat, setPCat]           = useState("")
  const [pType, setPType]         = useState("")
  const [pCustom, setPCustom]     = useState("")
  const [pDate, setPDate]         = useState("")
  const [pOdo, setPOdo]           = useState("")
  const [pCost, setPCost]         = useState("")
  const [pNotes, setPNotes]       = useState("")
  const [odoError, setOdoError]   = useState<string | null>(null)
  const [odoBounds, setOdoBounds] = useState<{ min: number | null; max: number | null }>({ min: null, max: null })
  const [boundsLoading, setBoundsLoading] = useState(false)

  const isOther      = category === OTHER_CATEGORY_ID
  const isInspection = category === INSPECTION_CATEGORY_ID
  const pIsInspection = pCat === INSPECTION_CATEGORY_ID
  const expectedOdo  = (!isInspection && dueKm) ? currentOdometer + parseInt(dueKm) : null

  const futureCanSubmit = category &&
    (isOther ? customService.trim() !== "" : serviceType !== "") &&
    (isInspection ? true : dueKm !== "")

  const pastCanSubmit = pCat &&
    (pCat === OTHER_CATEGORY_ID ? pCustom.trim() !== "" : pType !== "") &&
    pDate !== "" &&
    pCost !== "" &&
    (pIsInspection || pOdo !== "") &&
    !odoError

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  function handleClose() {
    setOpen(false); setError(null); setOdoError(null)
    setOdoBounds({ min: null, max: null })
    setCategory(""); setServiceType(""); setCustomService(""); setDueKm("")
    setPCat(""); setPType(""); setPCustom(""); setPDate(""); setPOdo(""); setPCost(""); setPNotes("")
    futureRef.current?.reset()
    pastRef.current?.reset()
  }

  async function handlePastDateChange(date: string) {
    setPDate(date)
    setOdoError(null)
    if (!date || pIsInspection) return
    setBoundsLoading(true)
    try {
      const bounds = await getSurroundingOdometers(vehicleId, date)
      setOdoBounds(bounds)
      if (pOdo) validateOdo(parseInt(pOdo), bounds)
    } finally {
      setBoundsLoading(false)
    }
  }

  function validateOdo(val: number, bounds = odoBounds) {
    if (isNaN(val)) { setOdoError(null); return }
    if (bounds.min !== null && val < bounds.min) {
      setOdoError(`Must be at least ${bounds.min.toLocaleString("en-US")} km`)
    } else if (bounds.max !== null && val > bounds.max) {
      setOdoError(`Must be at most ${bounds.max.toLocaleString("en-US")} km`)
    } else {
      setOdoError(null)
    }
  }

  function handleFutureSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      try { await createServiceTask(vehicleId, licensePlate, formData); handleClose() }
      catch (e) { setError(e instanceof Error ? e.message : "Something went wrong") }
    })
  }

  function handlePastSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      try { await logPastService(vehicleId, licensePlate, formData); handleClose() }
      catch (e) { setError(e instanceof Error ? e.message : "Something went wrong") }
    })
  }

  const tabCls = (t: "future" | "past") =>
    `flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
      tab === t
        ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
        : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
    }`

  const odoPlaceholder = odoBounds.min !== null && odoBounds.max !== null
    ? `${odoBounds.min.toLocaleString("en-US")}–${odoBounds.max.toLocaleString("en-US")}`
    : odoBounds.min !== null ? `≥ ${odoBounds.min.toLocaleString("en-US")}` : "e.g. 48500"

  return (
    <>
      <button
        onClick={() => { setOpen(true); setTab("future"); setError(null) }}
        className="flex items-center gap-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium px-4 py-2 rounded-full hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors"
      >
        <span className="text-base leading-none">+</span> Add service
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={handleClose} />

          <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">New Service</h2>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Close">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-5">
              <button type="button" onClick={() => { setTab("future"); setError(null) }} className={tabCls("future")}>Future service</button>
              <button type="button" onClick={() => { setTab("past"); setError(null) }} className={tabCls("past")}>Past service</button>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-lg px-4 py-3 mb-4">
                {error}
              </div>
            )}

            {/* FUTURE TAB */}
            <form ref={futureRef} action={handleFutureSubmit} className={`space-y-4 ${tab !== "future" ? "hidden" : ""}`}>
              <CategoryServiceFields
                category={category} serviceType={serviceType} customService={customService}
                lastServicedByType={lastServicedByType}
                onCategoryChange={v => { setCategory(v); setServiceType("") }}
                onServiceTypeChange={setServiceType}
                onCustomServiceChange={setCustomService}
                showLastServiced
              />

              {category && (
                isInspection ? (
                  <div>
                    <label className={labelCls}>Due Date <span className="text-red-500">*</span></label>
                    <input name="due_date" type="date" required min={today} className={inputCls} />
                  </div>
                ) : (
                  <div>
                    <label className={labelCls}>Due in (km) <span className="text-red-500">*</span></label>
                    <input name="due_km" type="number" required min={1} placeholder="e.g. 5000"
                      value={dueKm} onChange={e => setDueKm(e.target.value)} className={inputCls} />
                    {expectedOdo !== null && (
                      <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                        Expected at {expectedOdo.toLocaleString("en-US")} km
                      </p>
                    )}
                  </div>
                )
              )}

              {category && (
                <div>
                  <label className={labelCls}>Notes</label>
                  <textarea name="notes" rows={2} placeholder="Optional…" className={`${inputCls} resize-none`} />
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={isPending || !futureCanSubmit}
                  className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium py-2 rounded-full hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  {isPending ? "Saving…" : "Save service"}
                </button>
                <button type="button" onClick={handleClose} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-full transition-colors">
                  Cancel
                </button>
              </div>
            </form>

            {/* PAST TAB */}
            <form ref={pastRef} action={handlePastSubmit} className={`space-y-4 ${tab !== "past" ? "hidden" : ""}`}>
              <CategoryServiceFields
                category={pCat} serviceType={pType} customService={pCustom}
                lastServicedByType={lastServicedByType}
                onCategoryChange={v => { setPCat(v); setPType("") }}
                onServiceTypeChange={setPType}
                onCustomServiceChange={setPCustom}
                showLastServiced={false}
              />

              {pCat && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Date <span className="text-red-500">*</span></label>
                    <input name="date" type="date" required max={today}
                      value={pDate} onChange={e => handlePastDateChange(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Cost (€) <span className="text-red-500">*</span></label>
                    <input name="cost" type="number" required min={0} step="0.01" placeholder="120.00"
                      value={pCost} onChange={e => setPCost(e.target.value)} className={inputCls} />
                  </div>
                </div>
              )}

              {pCat && !pIsInspection && (
                <div>
                  <label className={labelCls}>
                    <span className="flex items-center gap-1.5">
                      Done at (km) <span className="text-red-500">*</span>
                      {boundsLoading && <span className="text-gray-300 font-normal normal-case tracking-normal">checking…</span>}
                      <span className="relative group inline-flex">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 cursor-default">
                          <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                        <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20 w-52">
                          <div className="bg-gray-900 text-white text-[11px] leading-snug px-2.5 py-2 rounded-lg">
                            The value must fit between surrounding odometer records to keep the history consistent.
                          </div>
                          <div className="w-0 h-0 mx-auto" style={{ borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderTop: "4px solid #111827" }} />
                        </div>
                      </span>
                    </span>
                  </label>
                  <input
                    name="odometer" type="number" required
                    min={odoBounds.min ?? 0} max={odoBounds.max ?? undefined}
                    placeholder={odoPlaceholder}
                    value={pOdo}
                    onChange={e => { setPOdo(e.target.value); validateOdo(parseInt(e.target.value)) }}
                    className={odoError ? inputErrCls : inputCls}
                  />
                  {odoError
                    ? <p className="mt-1 text-xs text-red-500">{odoError}</p>
                    : odoBounds.min !== null && (
                      <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                        {odoBounds.max !== null
                          ? `Between ${odoBounds.min.toLocaleString("en-US")} and ${odoBounds.max.toLocaleString("en-US")} km`
                          : `At least ${odoBounds.min.toLocaleString("en-US")} km`}
                      </p>
                    )}
                </div>
              )}

              {pCat && (
                <div>
                  <label className={labelCls}>Notes</label>
                  <textarea name="notes" rows={2} placeholder="Optional…"
                    value={pNotes} onChange={e => setPNotes(e.target.value)}
                    className={`${inputCls} resize-none`} />
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={isPending || !pastCanSubmit}
                  className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium py-2 rounded-full hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
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
