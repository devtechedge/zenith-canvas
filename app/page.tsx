// Next 15 rejects `ssr: false` on `next/dynamic` inside a Server Component.
// The whole board is client-only (localStorage, Web Audio), so marking this
// boundary as a Client Component keeps the previous behaviour intact.
'use client';

import dynamic from 'next/dynamic';

const ZenithWorkspaceClient = dynamic(() => import('@/components/ZenithWorkspaceClient'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] font-mono text-xs text-stone-500">
      <div className="text-center p-8 border-4 border-black bg-white neo-shadow max-w-sm">
        <h2 className="text-sm font-black uppercase mb-2">Zenith Workspace</h2>
        <p className="text-[10px] leading-relaxed text-[#1A1A1A] font-bold">
          Opening your board.
        </p>
      </div>
    </div>
  )
});

export default function Page() {
  return <ZenithWorkspaceClient />;
}
