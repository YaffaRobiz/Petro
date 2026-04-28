export type ServiceItem = { id: string; label: string }
export type ServiceCategory = { id: string; label: string; services: ServiceItem[] }

export const INSPECTION_CATEGORY_ID = "inspections"
export const OTHER_CATEGORY_ID = "other"

// Categories sorted A–Z, services within each sorted A–Z, "Other" appended last
export const SERVICE_SCHEMA: ServiceCategory[] = [
  {
    id: "brakes",
    label: "Brakes",
    services: [
      { id: "brake_discs",  label: "Brake Disc (Rotor) Replacement" },
      { id: "brake_fluid",  label: "Brake Fluid Change" },
      { id: "brake_pads",   label: "Brake Pad Replacement" },
    ],
  },
  {
    id: "climate_electrical",
    label: "Climate & Electrical",
    services: [
      { id: "ac_service",   label: "AC Service / Recharge" },
      { id: "alternator",   label: "Alternator Replacement" },
      { id: "light_bulb",   label: "Light Bulb Replacement" },
      { id: "starter",      label: "Starter Replacement" },
    ],
  },
  {
    id: "core_maintenance",
    label: "Core Maintenance",
    services: [
      { id: "air_filter",    label: "Air Filter Replacement" },
      { id: "cabin_filter",  label: "Cabin Air Filter Replacement" },
      { id: "fuel_filter",   label: "Fuel Filter Replacement" },
      { id: "oil_change",    label: "Oil Change" },
      { id: "oil_filter",    label: "Oil Filter Replacement" },
      { id: "spark_plugs",   label: "Spark Plug Replacement" },
    ],
  },
  {
    id: "emissions_exhaust",
    label: "Emissions / Exhaust",
    services: [
      { id: "adblue_refill",  label: "AdBlue Refill" },
      { id: "adblue_repair",  label: "AdBlue System Repair" },
      { id: "dpf_service",    label: "DPF Service" },
      { id: "egr_service",    label: "EGR Valve Service" },
      { id: "emissions_test", label: "Emissions Test" },
    ],
  },
  {
    id: "engine_performance",
    label: "Engine & Performance",
    services: [
      { id: "battery",             label: "Battery Replacement" },
      { id: "engine_diagnostics",  label: "Engine Diagnostics" },
      { id: "serpentine_belt",     label: "Serpentine Belt Replacement" },
      { id: "timing_belt",         label: "Timing Belt Replacement" },
    ],
  },
  {
    id: "fluids_cooling",
    label: "Fluids & Cooling",
    services: [
      { id: "coolant",               label: "Coolant Flush / Replacement" },
      { id: "power_steering_fluid",  label: "Power Steering Fluid Change" },
      { id: "transmission_fluid",    label: "Transmission Fluid Change" },
      { id: "washer_fluid",          label: "Windshield Washer Fluid Refill" },
    ],
  },
  {
    id: "inspections",
    label: "Inspections",
    services: [
      { id: "general_inspection",     label: "General Inspection" },
      { id: "prepurchase_inspection", label: "Pre-Purchase Inspection" },
      { id: "safety_inspection",      label: "Safety Inspection" },
    ],
  },
  {
    id: "misc",
    label: "Miscellaneous",
    services: [
      { id: "detailing",         label: "Car Wash / Detailing" },
      { id: "exhaust_repair",    label: "Exhaust System Repair" },
      { id: "suspension_repair", label: "Suspension Repair" },
      { id: "wiper_blades",      label: "Wiper Blade Replacement" },
    ],
  },
  {
    id: "tires_wheels",
    label: "Tires & Wheels",
    services: [
      { id: "tire_pressure",    label: "Tire Pressure Check" },
      { id: "tire_replacement", label: "Tire Replacement" },
      { id: "tire_rotation",    label: "Tire Rotation" },
      { id: "wheel_alignment",  label: "Wheel Alignment" },
      { id: "wheel_balancing",  label: "Wheel Balancing" },
    ],
  },
  {
    id: OTHER_CATEGORY_ID,
    label: "Other",
    services: [],
  },
]

export function getCategoryById(id: string): ServiceCategory | undefined {
  return SERVICE_SCHEMA.find(c => c.id === id)
}
