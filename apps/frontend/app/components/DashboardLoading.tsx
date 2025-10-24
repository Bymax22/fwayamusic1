// components/DashboardLoading.tsx
export function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1f29] to-[#0a3747] flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 border-4 border-[#e51f48] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-xl font-bold text-white mb-2">Loading Dashboard</h2>
        <p className="text-gray-400">Preparing your personalized experience...</p>
      </div>
    </div>
  );
}