import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import SplashScreen from "../components/splashScreen";
import { supabase } from "../lib/supabase";

export default function RootLayout() {
  const [session, setSession] = useState<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();

      if (!mounted) return;
      setSession(data.session);

      // minimal splash delay (UX only, NOT navigation logic)
      await new Promise((r) => setTimeout(r, 800));

      if (mounted) setReady(true);
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (!ready) return <SplashScreen />;

  /**
   * IMPORTANT:
   * We do NOT manually route users.
   * Expo Router decides based on folder structure.
   */
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
