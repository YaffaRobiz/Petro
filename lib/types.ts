export type Vehicle = {
  id: string
  user_id: string
  make: string
  model: string
  year: number
  nickname: string | null
  license_plate: string
  fuel_type: string
  initial_odometer: number
  created_at: string
}

export const FUEL_TYPES = [
  "Petrol",
  "Diesel",
  "Electric",
  "Hybrid",
  "LPG",
  "CNG",
] as const

export type FuelType = (typeof FUEL_TYPES)[number]

export type FuelLog = {
  id: string
  user_id: string
  vehicle_id: string
  date: string
  odometer: number
  liters: number
  cost: number
  created_at: string
}

export type MaintenanceLog = {
  id: string
  user_id: string
  vehicle_id: string
  date: string
  odometer: number
  service_type: string
  notes: string | null
  cost: number
  created_at: string
}

export const SERVICE_TYPES = [
  "Oil Change",
  "Tire Rotation",
  "Brake Service",
  "Battery",
  "Air Filter",
  "General Inspection",
  "Other",
] as const

export type ServiceType = (typeof SERVICE_TYPES)[number]
