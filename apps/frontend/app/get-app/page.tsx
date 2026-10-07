import Image from 'next/image';
import Link from 'next/link';
import { Apple, ArrowLeft, Play } from 'lucide-react';

export default function GetAppPage() {
  return (
    <main className="min-h-screen bg-background px-5 py-8 text-white sm:px-8 sm:py-12">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-sm text-white/65 transition hover:bg-white/5 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Fwaya
        </Link>

        <section className="my-auto grid gap-12 py-16 md:grid-cols-[1.1fr_0.9fr] md:items-center md:gap-16">
          <div className="max-w-2xl">
            <Image
              src="/fwayalogo-01.png"
              alt="Fwaya"
              width={176}
              height={64}
              className="mb-10 h-12 w-auto object-contain object-left"
              priority
            />
            <p className="mb-4 text-sm font-semibold uppercase text-purple/45">Fwaya for mobile</p>
            <h1 className="max-w-xl text-4xl font-semibold leading-tight sm:text-5xl">
              Your music life, on the move.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-white/60">
              The Fwaya mobile app is in the works. We’re getting it ready for iPhone and Android.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-1">
            <div className="rounded-2xl bg-background p-6 sm:p-7">
              <Apple className="h-7 w-7 text-purple/45" aria-hidden="true" />
              <p className="mt-6 text-lg font-semibold">App Store</p>
              <p className="mt-1 text-sm text-white/50">For iPhone and iPad</p>
              <button
                type="button"
                disabled
                className="mt-6 w-full cursor-not-allowed rounded-xl bg-purple/15 px-4 py-3 text-sm font-semibold text-purple/75"
              >
                Coming soon
              </button>
            </div>

            <div className="rounded-2xl bg-background p-6 sm:p-7">
              <Play className="h-7 w-7 fill-current text-purple/45" aria-hidden="true" />
              <p className="mt-6 text-lg font-semibold">Google Play</p>
              <p className="mt-1 text-sm text-white/50">For Android devices</p>
              <button
                type="button"
                disabled
                className="mt-6 w-full cursor-not-allowed rounded-xl bg-purple/15 px-4 py-3 text-sm font-semibold text-purple/75"
              >
                Coming soon
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}