import { Stack } from 'expo-router';

import { SessionProvider, useSession } from '../src/ctx';
import { SplashScreenController } from '../src/splash';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function Root() {
  // Set up the auth context and render your layout inside of it.
  return (
    <SessionProvider>
      <SplashScreenController />
      <RootNavigator />
    </SessionProvider>
  );
}

function RootNavigator() {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!!session}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>

        <Stack.Protected guard={!session}>
          <Stack.Screen name="sign-in" />
          <Stack.Screen name="sign-up" />
          <Stack.Screen name="pending-approval" />
        </Stack.Protected>
      </Stack>
    </GestureHandlerRootView>
  );
}
