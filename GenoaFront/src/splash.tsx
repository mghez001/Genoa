import { useEffect } from 'react';
import { SplashScreen } from 'expo-router';

import { useSession } from './ctx';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore duplicate calls while Fast Refresh reloads the module.
});

export function SplashScreenController() {
  const { isLoading } = useSession();

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync().catch(() => {
        // Ignore hide races if the splash is already gone.
      });
    }
  }, [isLoading]);

  return null;
}
