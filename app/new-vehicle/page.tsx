import { addVehicle } from "@/app/actions/vehicles"
import Link from "next/link"
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

export default function NewVehiclePage() {
  return (
    <main className="max-w-xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/vehicles" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
          ← Back to vehicles
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">Add Vehicle</h1>
      </div>

      <form action={addVehicle} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Make <span className="text-red-500">*</span>
            </label>
            <select
              name="make"
              required
              defaultValue=""
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="" disabled>Select make</option>
              {CAR_MAKES.map((make) => (
                <option key={make} value={make}>{make}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Model <span className="text-red-500">*</span>
            </label>
            <input
              name="model"
              required
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Corolla"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Year <span className="text-red-500">*</span>
            </label>
            <input
              name="year"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{4}"
              maxLength={4}
              required
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="2020"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fuel Type <span className="text-red-500">*</span>
            </label>
            <select
              name="fuel_type"
              required
              defaultValue="Petrol"
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {FUEL_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              License Plate <span className="text-red-500">*</span>
            </label>
            <input
              name="license_plate"
              required
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="123-456-78"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nickname
            </label>
            <input
              name="nickname"
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="The Beast (optional)"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Current Odometer (km) <span className="text-red-500">*</span>
          </label>
          <input
            name="initial_odometer"
            type="number"
            required
            min={0}
            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="45000"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
          >
            Save Vehicle
          </button>
          <Link
            href="/vehicles"
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 rounded-lg transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </main>
  )
}
