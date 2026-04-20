"use server"

import { cookies } from "next/headers"

export async function switchVehicle(vehicleId: string) {
  const cookieStore = await cookies()
  cookieStore.set("selected_vehicle_id", vehicleId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: true,
    sameSite: "lax",
  })
}
