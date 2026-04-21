"use client"

import { useState, useTransition, useRef, useEffect } from "react"
import { addFuelLog } from "@/app/actions/fuel"

export default function NewFillUpModal({
  vehicleId,
  licensePlate,
  currentOdometer,
}: {
  vehicleId: string
  licensePlate: string
  currentOdometer: number
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [odoError, setOdoError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const today = new Date().toISOString().split("T")[0]

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  function handleOdoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseFloat(e.target.value)
    if (!isNaN(val) && val <= currentOdometer) {
      setOdoError(`Must be greater than current odometer (${currentOdometer.toLocaleString("en-US")} km)`)
    } else {
      setOdoError(null)
    }
  }

  function handleSubmit(formData: FormData) {
    const odo = parseFloat(formData.get("odometer") as string)
    if (odo <= currentOdometer) {
      setOdoError(`Must be greater than current odometer (${currentOdometer.toLocaleString("en-US")} km)`)
      return
    }
    setError(null)
    setOdoError(null)
    startTransition(async () => {
      try {
        await addFuelLog(vehicleId, licensePlate, formData)
        formRef.current?.reset()
        setOpen(false)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong")
      }
    })
  }

  const inputCls = "w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
  const inputErrCls = "w-full border border-red-300 dark:border-red-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
  const labelCls = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5"

  return (
    <>
      <button
        onClick={() => { setOpen(true); setError(null); setOdoError(null) }}
        className="flex items-center gap-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium px-4 py-2 rounded-full hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors"
      >
        <span className="text-base leading-none">+</span> New fill-up
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />

          <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">New Fill-Up</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Close"
              >
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Date <span className="text-red-500">*</span></label>
                  <input name="date" type="date" required defaultValue={today} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>
                    Odometer (km) <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="odometer"
                    type="number"
                    required
                    min={currentOdometer + 1}
                    placeholder={(currentOdometer + 1).toLocaleString("en-US")}
                    onChange={handleOdoChange}
                    className={odoError ? inputErrCls : inputCls}
                  />
                  {odoError && (
                    <p className="mt-1 text-xs text-red-500">{odoError}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Liters <span className="text-red-500">*</span></label>
                  <input name="liters" type="number" required min={0} step="0.01" placeholder="40.00" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Total Cost (€) <span className="text-red-500">*</span></label>
                  <input name="cost" type="number" required min={0} step="0.01" placeholder="65.00" className={inputCls} />
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={isPending || !!odoError}
                  className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium py-2 rounded-full hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? "Saving…" : "Save fill-up"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-full transition-colors"
                >
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
