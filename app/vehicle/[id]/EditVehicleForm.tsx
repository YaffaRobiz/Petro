"use client"

import { useState } from "react"
import { editVehicle } from "@/app/actions/vehicles"
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

type Vehicle = {
  id: string
  make: string
  model: string
  year: number
  nickname: string | null
  license_plate: string
  fuel_type: string
  initial_odometer: number
}

const inputCls = "w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
const labelCls = "block text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5"

export default function EditVehicleForm({
  vehicle,
  hasLogs,
}: {
  vehicle: Vehicle
  hasLogs: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [dirty, setDirty] = useState(false)

  if (!editing) {
    const fields = [
      { label: "Make", value: vehicle.make },
      { label: "Model", value: vehicle.model },
      { label: "Year", value: vehicle.year },
      { label: "License Plate", value: vehicle.license_plate },
      { label: "Fuel Type", value: vehicle.fuel_type },
      { label: "Initial Odometer", value: `${vehicle.initial_odometer.toLocaleString("en-US")} km` },
      ...(vehicle.nickname ? [{ label: "Nickname", value: vehicle.nickname }] : []),
    ]
    return (
      <div>
        <div className="flex items-center justify-between mb-5">
          <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            Vehicle Details
          </p>
          <button
            onClick={() => setEditing(true)}
            className="text-xs font-medium text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            Edit
          </button>
        </div>
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-6">
          {fields.map(({ label, value }) => (
            <div key={label}>
              <dt className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{label}</dt>
              <dd className="text-sm font-medium text-gray-900 dark:text-white mt-1">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    )
  }

  return (
    <form action={editVehicle.bind(null, vehicle.id)} onChange={() => setDirty(true)}>
      <div className="flex items-center justify-between mb-5">
        <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          Edit Vehicle
        </p>
        <button
          type="button"
          onClick={() => { setEditing(false); setDirty(false) }}
          className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Make</label>
          <select name="make" defaultValue={vehicle.make} required className={inputCls}>
            {CAR_MAKES.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Model</label>
          <input name="model" defaultValue={vehicle.model} required className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div>
          <label className={labelCls}>Year</label>
          <input
            name="year"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{4}"
            maxLength={4}
            defaultValue={vehicle.year}
            required
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Fuel Type</label>
          <select name="fuel_type" defaultValue={vehicle.fuel_type} required className={inputCls}>
            {FUEL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div>
          <label className={labelCls}>License Plate</label>
          <input name="license_plate" defaultValue={vehicle.license_plate} required className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Nickname</label>
          <input name="nickname" defaultValue={vehicle.nickname ?? ""} placeholder="Optional" className={inputCls} />
        </div>
      </div>

      <div className="mt-4">
        <label className={labelCls}>Initial Odometer (km)</label>
        <div className="relative group w-fit">
          <input
            name="initial_odometer"
            type="number"
            defaultValue={vehicle.initial_odometer}
            readOnly={hasLogs}
            className={`${inputCls} ${hasLogs ? "bg-gray-50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-600 cursor-not-allowed select-none" : ""}`}
          />
          {hasLogs && (
            <div className="pointer-events-none absolute bottom-full left-0 mb-2 hidden group-hover:block z-10">
              <div className="bg-gray-900 text-white text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap">
                Cannot change — fuel or maintenance logs already exist
              </div>
              <div className="w-0 h-0 ml-3" style={{ borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderTop: "4px solid #111827" }} />
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 mt-6 pt-5 border-t border-gray-100 dark:border-gray-800">
        <button
          type="submit"
          disabled={!dirty}
          className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium px-5 py-2 rounded-full hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Save changes
        </button>
        <button
          type="button"
          onClick={() => { setEditing(false); setDirty(false) }}
          className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
