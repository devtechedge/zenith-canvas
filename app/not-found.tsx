"use client";

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] text-[#1A1A1A] p-4">
      <div className="text-center p-8 border-4 border-black bg-white neo-shadow max-w-md w-full">
        <h1 className="text-4xl font-black mb-2 uppercase tracking-tight text-red-500">404</h1>
        <h2 className="text-lg font-black uppercase mb-4 tracking-tight">Page Not Found</h2>
        <p className="text-xs text-stone-600 font-bold mb-6 leading-relaxed">
          The collaborative workspace or card layer you are trying to access does not exist or has been archived.
        </p>
        <Link
          href="/"
          className="inline-block bg-black text-[#FFB703] border-2 border-black px-4 py-2 text-xs font-black uppercase rounded-none hover:bg-stone-900 transition-all cursor-pointer"
        >
          Back to Workspace
        </Link>
      </div>
    </div>
  );
}
