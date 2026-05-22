import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | Fwaya',
  description: 'Fwaya Privacy Policy describing data collection, use, and user rights.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-white px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-[#07070f]/90 p-8 shadow-2xl shadow-purple-500/10">
        <div className="mb-6">
          <p className="text-sm uppercase tracking-[0.24em] text-purple-300">Privacy Policy</p>
          <h1 className="mt-3 text-3xl font-bold text-white">Fwaya Privacy Policy</h1>
          <p className="mt-3 text-gray-400 max-w-2xl">
            This Privacy Policy explains how Fwaya collects, uses, and protects your personal information when you use our service.
          </p>
        </div>

        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-white">Information We Collect</h2>
            <p className="mt-3 text-gray-300">
              We may collect information such as your name, email address, profile information, account type, and any content you provide to the platform. When you sign in with Google, we receive your basic profile details and email address as permitted by your authentication provider.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white">How We Use Information</h2>
            <p className="mt-3 text-gray-300">
              We use this information to create and manage your account, personalize your experience, deliver the service, send transactional messages, and improve Fwaya.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white">Third-Party Services</h2>
            <p className="mt-3 text-gray-300">
              Fwaya uses third-party services such as Firebase Authentication and Google sign-in. These providers may process your data in accordance with their own privacy policies.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white">Cookies and Tracking</h2>
            <p className="mt-3 text-gray-300">
              We may use cookies and similar technologies to support authentication, analytics, and site performance. You can control these settings through your browser.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white">Your Rights</h2>
            <p className="mt-3 text-gray-300">
              You can request access to or deletion of your account data by contacting us at the address below. We will respond according to applicable laws.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white">Contact</h2>
            <p className="mt-3 text-gray-300">
              If you have questions about this policy, please contact us at <a href="mailto:support@fwaya.net" className="text-purple-300 hover:text-purple-200">support@fwaya.net</a>.
            </p>
          </div>
        </section>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-white/10 pt-6">
          <Link href="/" className="text-sm text-purple-300 hover:text-purple-200">
            Back to home
          </Link>
          <p className="text-sm text-gray-500">Last updated: May 2026</p>
        </div>
      </div>
    </div>
  );
}
