"use client"

import { useState } from "react"

export default function AppShell({
  sidebar,
  children,
}: {
  sidebar: React.ReactNode
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(true)

  return (
    <div className="flex min-h-screen">
      {/* Sidebar wrapper — controls width + clips content when collapsed */}
      <div
        className={`fixed left-0 top-0 z-20 h-full transition-[width] duration-300 ease-in-out overflow-hidden ${
          open ? "w-[220px]" : "w-0"
        }`}
      >
        {sidebar}
      </div>

      {/* Toggle button — rides the right edge of the sidebar */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
        className={`fixed top-[22px] z-30 flex items-center justify-center w-[18px] h-[18px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:shadow-md transition-[left] duration-300 ease-in-out`}
        style={{ left: open ? "211px" : "8px" }}
      >
        <svg
          width="9" height="9" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        >
          {open
            ? <path d="m15 18-6-6 6-6" />
            : <path d="m9 18 6-6-6-6" />}
        </svg>
      </button>

      {/* Main content — margin mirrors sidebar width */}
      <div
        className={`flex-1 min-h-screen transition-[margin] duration-300 ease-in-out bg-[#f0efe8] dark:bg-gray-950 text-gray-900 dark:text-gray-100 ${
          open ? "ml-[220px]" : "ml-0"
        }`}
      >
        {children}
      </div>
    </div>
  )
}
