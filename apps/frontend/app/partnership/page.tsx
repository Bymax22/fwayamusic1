import Link from "next/link";

export default function PartnershipPage() {
  return (
    <div className="min-h-screen pb-40 px-5 pt-6 bg-black text-white">
      <main className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold">Partnerships</h1>
        <p className="mt-2 text-gray-400">Interested in partnering with Fwaya? Whether you're a distributor, label, or brand, let's talk.</p>

        <section className="mt-6 bg-white/3 p-4 rounded-xl">
          <h2 className="font-semibold">Partner with us</h2>
          <p className="mt-2 text-sm text-gray-300">Tell us a bit about your organisation and partnership interest. We'll review and respond with next steps.</p>
          <form action="/api/v1/support" method="post" className="mt-3 space-y-2">
            <input name="name" placeholder="Contact name" className="w-full px-3 py-2 bg-white/5 rounded-md text-sm text-white" required />
            <input name="email" type="email" placeholder="Email" className="w-full px-3 py-2 bg-white/5 rounded-md text-sm text-white" required />
            <input name="org" placeholder="Organisation" className="w-full px-3 py-2 bg-white/5 rounded-md text-sm text-white" />
            <textarea name="message" placeholder="Partnership details" className="w-full px-3 py-2 bg-white/5 rounded-md text-sm text-white h-36" required />
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-cyan-500 py-2 rounded-lg">Contact Partnerships</button>
              <Link href="/support" className="flex-1 text-center bg-white/5 py-2 rounded-lg">Support</Link>
            </div>
          </form>
        </section>
      </main>

      {/* MobileFooter removed — handled by Need Help modal */}
    </div>
  );
}
