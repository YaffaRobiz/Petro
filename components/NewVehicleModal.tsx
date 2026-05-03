"use client"

import { useState, useTransition, useEffect } from "react"
import { createPortal } from "react-dom"
import { addVehicle } from "@/app/actions/vehicles"
import { FUEL_TYPES } from "@/lib/types"

const CAR_MAKES = [
  "Acura", "Alfa Romeo", "Aston Martin", "Audi", "Bentley", "BMW", "Buick",
  "Cadillac", "Chevrolet", "Chrysler", "Citroën", "Dacia", "Dodge",
  "Ferrari", "Fiat", "Ford", "Genesis", "GMC", "Honda", "Hyundai",
  "Infiniti", "Jaguar", "Jeep", "Kia", "Lamborghini", "Land Rover",
  "Lexus", "Lincoln", "Maserati", "Mazda", "McLaren", "Mercedes-Benz",
  "MINI", "Mitsubishi", "Nissan", "Opel", "Peugeot", "Porsche",
  "RAM", "Renault", "Rolls-Royce", "Seat", "Skoda", "Subaru",
  "Suzuki", "Tesla", "Toyota", "Volkswagen", "Volvo", "Other",
]

export default function NewVehicleModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [make, setMake]         = useState("")
  const [model, setModel]       = useState("")
  const [year, setYear]         = useState("")
  const [fuelType, setFuelType] = useState("Petrol")
  const [plate, setPlate]       = useState("")
  const [odometer, setOdometer] = useState("")

  const currentYear = new Date().getFullYear()
  const yearError = year.length === 4 && parseInt(year) > currentYear
    ? `Year can't be greater than ${currentYear}`
    : null

  const canSubmit = make && model.trim() && year.length === 4 && !yearError && plate.trim() && odometer !== ""

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  function handleClose() {
    setMake(""); setModel(""); setYear(""); setFuelType("Petrol")
    setPlate(""); setOdometer("")
    onClose()
  }

  if (!open) return null

  const inputCls    = "w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
  const inputErrCls = "w-full border border-red-300 dark:border-red-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
  const labelCls    = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5"

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={handleClose} />

      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">Add Vehicle</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form action={(fd) => startTransition(() => addVehicle(fd))} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Make <span className="text-red-500">*</span></label>
              <select name="make" required value={make} onChange={e => setMake(e.target.value)} className={inputCls}>
                <option value="" disabled>Select make</option>
                {CAR_MAKES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Model <span className="text-red-500">*</span></label>
              <input name="model" required placeholder="Corolla" value={model} onChange={e => setModel(e.target.value)} className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Year <span className="text-red-500">*</span></label>
              <input name="year" type="text" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} required
                placeholder="2020" value={year} onChange={e => setYear(e.target.value.replace(/\D/g, ""))} className={yearError ? inputErrCls : inputCls} />
              {yearError && <p className="mt-1 text-xs text-red-500">{yearError}</p>}
            </div>
            <div>
              <label className={labelCls}>Fuel Type <span className="text-red-500">*</span></label>
              <select name="fuel_type" required value={fuelType} onChange={e => setFuelType(e.target.value)} className={inputCls}>
                {FUEL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>License Plate <span className="text-red-500">*</span></label>
              <input name="license_plate" required placeholder="123-456-78" value={plate} onChange={e => setPlate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Nickname</label>
              <input name="nickname" placeholder="Optional" className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Current Odometer (km) <span className="text-red-500">*</span></label>
            <input name="initial_odometer" type="number" required min={0} placeholder="45000"
              value={odometer} onChange={e => setOdometer(e.target.value)} className={inputCls} />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={!canSubmit || isPending}
              className="flex-1 bg-gray-900 dark:bg-btn-dark text-white dark:text-white text-sm font-medium py-2 rounded-full hover:bg-gray-700 dark:hover:bg-btn-dark-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPending ? "Saving…" : "Save Vehicle"}
            </button>
            <button type="button" onClick={handleClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-full transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
