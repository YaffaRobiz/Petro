export default function Loading() {
  return (
    <main className="w-full px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 bg-gray-200 rounded w-40 animate-pulse" />
        <div className="h-9 bg-gray-200 rounded w-32 animate-pulse" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 space-y-3 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-100 rounded w-1/2" />
            <div className="h-px bg-gray-100 w-full mt-2" />
            <div className="h-4 bg-gray-100 rounded w-1/3" />
          </div>
        ))}
      </div>
    </main>
  )
}
