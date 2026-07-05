'use client';

import dynamic from 'next/dynamic';

const CanvasWorkspaceClient = dynamic(
  () => import('@/components/pages/CanvasWorkspaceClient'), 
  { ssr: false }
);

export default function CanvasWorkspace() {
  return <CanvasWorkspaceClient />;
}
