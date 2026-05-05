export default function MaintenanceBanner() {
  return (
    <div className="maintenance-banner flex items-center gap-3 px-5 py-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400 mb-6">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-lg">🔧</div>
      <div>
        <div className="font-semibold text-sm">Maintenance in Progress</div>
        <div className="text-xs text-amber-500 mt-0.5">Sports facility bookings are disabled from <strong>4:00 PM to 5:00 PM IST</strong> daily. Please try again after 5:00 PM.</div>
      </div>
    </div>
  );
}
