'use client';

import dynamic from 'next/dynamic';

const WorkspaceHubClient = dynamic(
  () => import('@/components/pages/WorkspaceHubClient'), 
  { ssr: false }
);

export default function WorkspaceHub() {
  return <WorkspaceHubClient />;
}
