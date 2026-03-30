export default function RoomsLoading() {
  return (
    <div className="min-h-screen bg-white px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 animate-pulse space-y-3 text-center">
          <div className="mx-auto h-8 w-56 rounded-lg bg-gray-200" />
          <div className="mx-auto h-4 w-96 rounded bg-gray-200" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse overflow-hidden rounded-xl bg-gray-100 shadow-sm">
              <div className="h-48 bg-gray-200" />
              <div className="space-y-3 p-5">
                <div className="h-5 w-36 rounded bg-gray-200" />
                <div className="h-4 w-full rounded bg-gray-200" />
                <div className="h-4 w-3/4 rounded bg-gray-200" />
                <div className="flex items-center justify-between pt-2">
                  <div className="h-6 w-28 rounded bg-amber-100" />
                  <div className="h-9 w-24 rounded-lg bg-gray-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
