export default function GuestHouseBookingLoading() {
  return (
    <div className="min-h-screen bg-[#f4f7fb] px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl animate-pulse space-y-6">
        <div className="h-24 rounded-2xl border bg-white" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="h-[420px] rounded-2xl border bg-white" />
          <div className="h-[420px] rounded-2xl border bg-white" />
        </div>
      </div>
    </div>
  );
}

