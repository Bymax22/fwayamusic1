export default function SystemStatusPage() {
  return (
    <div className="min-h-screen bg-black px-4 py-6 text-white md:px-6">
      <div className="mx-auto max-w-3xl rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-900/30 to-black p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-purple-300">System Status</p>
        <h1 className="mt-2 text-2xl font-bold md:text-3xl">Is FWAYA running normally?</h1>
        <div className="mt-6 flex items-center gap-3">
          <span className="inline-flex h-3 w-3 rounded-full bg-green-400" />
          <span className="text-sm text-gray-200">All major FWAYA services are currently operational.</span>
        </div>
        <p className="mt-5 text-sm text-gray-300">
          If something is not working for you, contact FWAYA Support on WhatsApp: <a href="https://wa.me/260966999999" className="text-purple-300">0966 999 999</a>.
        </p>
      </div>
    </div>
  );
}
