// pages/_app.tsx
import "@/styles/globals.css";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import type { AppProps } from "next/app";

import TokenRefresher from "../components/TokenRefresher";
import { auth } from "../lib/firebase";

import { onAuthStateChanged, User } from "firebase/auth";

// Import React Query
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function App({ Component, pageProps }: AppProps) {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  // ✅ Listen auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });

    return () => unsubscribe();
  }, []);

  // ✅ Log aktivitas saat route berubah
  useEffect(() => {
    const logActivity = async (url: string) => {
      if (!user) return;

      try {
        await fetch("/api/audit-log/page-view", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            actorId: user.uid,
            actorName: user.email ?? "Unknown",
            page: url,
            description: `Visited page ${url}`,
            extra: {
              userAgent: navigator.userAgent,
              ip: await getIp(), // fetch IP
            },
          }),
        });
      } catch (err) {
        console.error("❌ Failed to log page view:", err);
      }
    };

    const getIp = async () => {
      try {
        const res = await fetch("https://api.ipify.org?format=json");
        const data = await res.json();
        return data.ip;
      } catch {
        return "Unknown IP";
      }
    };

    const handleRouteChange = (url: string) => {
      logActivity(url);
    };

    router.events.on("routeChangeComplete", handleRouteChange);
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [user, router]);

  return (
    <QueryClientProvider client={queryClient}>
      <TokenRefresher />
      <Component {...pageProps} />
    </QueryClientProvider>
  );
}
