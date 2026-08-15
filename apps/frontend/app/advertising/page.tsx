import MobileFooter from "../components/MobileFooter";
import Link from "next/link";

export default function AdvertisingPage() {
  return (
    <div className="min-h-screen pb-40 px-5 pt-6 bg-black text-white">
      <main className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold">Advertising</h1>
        <p className="mt-2 text-gray-400">Reach millions of listeners on Fwaya. Tell us about your campaign and we'll get back to you.</p>

        <section className="mt-6 bg-white/3 p-4 rounded-xl">
          <h2 className="font-semibold">Advertise with Fwaya</h2>
          <p className="mt-2 text-sm text-gray-300">We offer brand-safe placements across feeds, playlists, and video. Please provide basic info and our ad team will respond.</p>
          <form action="/api/v1/support" method="post" className="mt-3 space-y-2">
            <input name="name" placeholder="Contact name" className="w-full px-3 py-2 bg-white/5 rounded-md text-sm text-white" required />
            <input name="email" type="email" placeholder="Email" className="w-full px-3 py-2 bg-white/5 rounded-md text-sm text-white" required />
            <input name="company" placeholder="Company" className="w-full px-3 py-2 bg-white/5 rounded-md text-sm text-white" />
            <textarea name="message" placeholder="Brief campaign details" className="w-full px-3 py-2 bg-white/5 rounded-md text-sm text-white h-36" required />
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-yellow-500 py-2 rounded-lg">Contact Ad Team</button>
              <Link href="/support" className="flex-1 text-center bg-white/5 py-2 rounded-lg">Support</Link>
            </div>
          </form>
        </section>
      </main>

      <MobileFooter />
    </div>
  );
}
