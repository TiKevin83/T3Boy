import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { type AppType } from "next/app";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { env } from "~/env";

import { api } from "~/utils/api";

import "~/styles/globals.css";

if (typeof window !== "undefined") {
  // checks that we are client-side
  posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
    loaded: (posthog) => {
      if (env.NEXT_PUBLIC_NODE_ENV === "development") posthog.debug(); // debug mode in development
    },
  });
}

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <SessionProvider session={session}>
      <PostHogProvider client={posthog}>
        <Component {...pageProps} />
      </PostHogProvider>
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp);
