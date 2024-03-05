import { Html, Head, Main, NextScript } from "next/document";
import Script from "next/script";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <Script src="libgambatte.js" strategy="beforeInteractive" />
      </Head>
      <body className="font-mono">
        <Main />
        <footer className="bg-dark shadow dark:bg-gray-800">
          <div className="mx-auto w-full max-w-screen-xl p-4 md:flex md:items-center md:justify-between">
            <span className="text-sm text-gray-500 sm:text-center dark:text-gray-400">
              © 2024{" "}
              <a
                href="https://www.youtube.com/@TiKevin83"
                className="hover:underline"
              >
                TiKevin83 Speedruns
              </a>{" "}
              - Licensed under GPL v3
            </span>
            <ul className="mt-3 flex flex-wrap items-center text-sm font-medium text-gray-500 sm:mt-0 dark:text-gray-400">
              <li>
                <p className="me-4 md:me-6">
                  T3Boy uses Posthog for Anonymous, GDPR compliant analytics
                </p>
              </li>
            </ul>
          </div>
        </footer>
        <NextScript />
      </body>
    </Html>
  );
}
