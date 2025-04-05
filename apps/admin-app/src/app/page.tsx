/** @format */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';

export default function HomePage() {
  const { authenticated, ready } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (ready) {
      if (authenticated) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [ready, authenticated, router]);

  return null;
}
