'use client';

import { useRouter } from 'next/navigation';
import { RaviServiceChat } from '@/components/ravi/RaviServiceChat';

export default function HaviPage() {
  const router = useRouter();
  return (
    <div className="h-[calc(100dvh-0px)] p-3 sm:p-6 lg:p-8">
      <div className="mx-auto h-full max-w-4xl">
        <RaviServiceChat variant="page" onClose={() => router.push('/')} />
      </div>
    </div>
  );
}
