export default function LoadingGuestHouseDashboard() {
  return (
    <div className="min-h-screen bg-[#f4f7fb] p-6">
      <div className="mx-auto max-w-7xl animate-pulse space-y-4">
        <div className="h-8 w-72 rounded bg-slate-200" />
        <div className="h-4 w-56 rounded bg-slate-200" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="h-32 rounded-xl border bg-white" />
          <div className="h-32 rounded-xl border bg-white" />
        </div>
      </div>
    </div>
  );
}

