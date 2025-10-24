import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button"; // ShadCN UI recommended
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Upload Successful",
  description: "Your media has been uploaded successfully",
};

export default function UploadSuccess() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg ring-1 ring-gray-200/10">
        {/* Animated checkmark */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-10 w-10 text-green-600 animate-in fade-in zoom-in-75" />
        </div>

        <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">
          Upload Successful!
        </h1>
        <p className="mb-6 text-center text-gray-600">
          Your media has been processed and is now available in your library.
        </p>

        <div className="space-y-4">
          {/* Quick actions */}
          <Button asChild className="w-full">
            <Link href="/upload" className="gap-2">
              Upload Another
            </Link>
          </Button>

          <Button variant="outline" asChild className="w-full">
            <Link href="/library" className="gap-2">
              View in Library
            </Link>
          </Button>

          {/* Social sharing (optional) */}
          <div className="flex justify-center space-x-4 pt-4">
            <button className="rounded-full p-2 hover:bg-gray-100">
              <span className="sr-only">Share on Twitter</span>
              {/* Replace with actual icon */}
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </button>
            <button className="rounded-full p-2 hover:bg-gray-100">
              <span className="sr-only">Share on Facebook</span>
              {/* Replace with actual icon */}
              <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Transaction details (optional) */}
        <div className="mt-8 border-t border-gray-100 pt-6 text-sm text-gray-500">
          <p className="text-center">
            Need help?{" "}
            <Link href="/support" className="text-blue-600 hover:underline">
              Contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}