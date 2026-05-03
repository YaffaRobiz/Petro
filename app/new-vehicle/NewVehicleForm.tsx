"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
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

export default function NewVehicleForm() {
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

  const inputCls    = "w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
  const inputErrCls = "w-full border border-red-300 dark:border-red-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
  const labelCls    = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50 dark:bg-gray-950">
      <div className="w-full max-w-xl">
        <div className="flex justify-center mb-8">
          <Image src="/petro_horizontal_logo.png" alt="Petro" width={300} height={98} priority />
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">
          Add your first vehicle to get started
        </p>

        <form action={(fd) => startTransition(() => addVehicle(fd))} className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
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

          <div className="grid grid-cols-2 gap-4">
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>License Plate <span className="text-red-500">*</span></label>
              <input name="license_plate" required placeholder="123-456-78" value={plate} onChange={e => setPlate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Nickname</label>
              <input name="nickname" placeholder="The Beast (optional)" className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Current Odometer (km) <span className="text-red-500">*</span></label>
            <input name="initial_odometer" type="number" required min={0} placeholder="45000"
              value={odometer} onChange={e => setOdometer(e.target.value)} className={inputCls} />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!canSubmit || isPending}
              className="w-full bg-gray-900 dark:bg-btn-dark text-white dark:text-white font-medium py-2 px-4 rounded-full hover:bg-gray-700 dark:hover:bg-btn-dark-hover transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPending ? "Saving…" : "Save Vehicle"}
            </button>
          </div>
        </form>

        <div className="flex justify-center mt-5">
          <form action="/auth/logout" method="POST">
            <button type="submit" className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              Log out
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
