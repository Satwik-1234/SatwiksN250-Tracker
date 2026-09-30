'use client';

import { useCallback, useEffect, useState } from 'react';
import { BikeProfile } from '@/types/fuel';
import { StorageService } from '@/services/googleSheetsService';

const EMPTY: BikeProfile = { purchaseDate: '', nickname: '', variant: '', colour: '' };

/**
 * Shared bike identity. Read once on mount so the warranty card, the profile
 * view and the service schedule all agree, and written through a single setter.
 */
export function useBikeProfile() {
  const [profile, setProfile] = useState<BikeProfile>(EMPTY);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setProfile(StorageService.getBikeProfile());
    setLoaded(true);
  }, []);

  const saveProfile = useCallback((next: BikeProfile) => {
    setProfile(next);
    StorageService.saveBikeProfile(next);
  }, []);

  const setPurchaseDate = useCallback(
    (purchaseDate: string) => {
      setProfile((current) => {
        const next = { ...current, purchaseDate };
        StorageService.saveBikeProfile(next);
        return next;
      });
    },
    []
  );

  return { profile, loaded, saveProfile, setPurchaseDate };
}
