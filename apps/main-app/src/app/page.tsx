/** @format */

'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoadingScreen } from '../components/LoadingScreen';

export default function HomePage() {
  const { authenticated, ready } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (ready) {
      if (authenticated) {
        router.push('/my-portfolio');
      } else {
        router.push('/homepage');
      }
    }
  }, [ready, authenticated, router]);

  return <LoadingScreen />;
}
