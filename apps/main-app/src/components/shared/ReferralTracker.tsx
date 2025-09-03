'use client';

import { useUser } from '@baskt/ui';
import { useEffect } from 'react';
import { postTrackReferral } from '../../hooks/referral/postTrackReferral';

export function ReferralTracker() {
  const { userAddress } = useUser();
  const { trackReferral } = postTrackReferral();

  useEffect(() => {
    if (userAddress) {
      const urlParams = new URLSearchParams(window.location.search);
      const viaCode = urlParams.get('via');

      if (viaCode && viaCode.trim()) {
        trackReferral(viaCode.trim(), userAddress);

        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('via');
        window.history.replaceState({}, '', newUrl.toString());
      }
    }
  }, [userAddress, trackReferral]);

  return null;
}
