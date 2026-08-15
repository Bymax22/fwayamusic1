import MobileFooter from "../components/MobileFooter";
import Link from "next/link";

export default function SupportPage() {
  return (
    <div className="min-h-screen pb-40 lg:pb-0 px-5 pt-6 bg-black text-white">
      <main className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold">Support</h1>
        <p className="mt-2 text-gray-400">Need help? Browse FAQs or send us a message.</p>

        <section className="mt-6 bg-white/3 p-4 rounded-xl">
          <h2 className="font-semibold">FAQ</h2>
          <ul className="mt-3 space-y-2 text-sm text-gray-200">
            <li><Link href="/help/faq#account">Account & sign-in</Link></li>
            <li><Link href="/help/faq#payments">Payments & billing</Link></li>
            <li><Link href="/help/faq#uploads">Uploads & publishing</Link></li>
            <li><Link href="/help/faq#copyright">Copyright & takedowns</Link></li>
          </ul>
        </section>

        <section className="mt-6 bg-white/3 p-4 rounded-xl">
          <h2 className="font-semibold">Contact</h2>
          <p className="text-sm text-gray-300 mt-2">Use the form below to submit a support request.</p>
          <form action="/api/v1/support" method="post" className="mt-3 space-y-2">
            <input name="name" placeholder="Your name" className="w-full px-3 py-2 bg-white/5 rounded-md text-sm text-white" required />
            <input name="email" type="email" placeholder="Email" className="w-full px-3 py-2 bg-white/5 rounded-md text-sm text-white" required />
            <textarea name="message" placeholder="Describe your issue" className="w-full px-3 py-2 bg-white/5 rounded-md text-sm text-white h-36" required />
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-purple-600 py-2 rounded-lg">Send</button>
              <Link href="/help/faq" className="flex-1 text-center bg-white/5 py-2 rounded-lg">View FAQ</Link>
            </div>
          </form>
        </section>
      </main>

      <MobileFooter />
    </div>
  );
}
