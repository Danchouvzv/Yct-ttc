import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/hooks/use-auth";
import { Navbar } from "@/components/Navbar";
import { CinematicDecor } from "@/components/CinematicDecor";
import { I18nProvider } from "@/i18n";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl text-gradient">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Кадр не найден</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Этой страницы нет в монтажном листе.
        </p>
        <a
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-xl px-5 py-2 text-sm font-medium [background:var(--gradient-primary)] shadow-[var(--shadow-neon)]"
        >
          На главную
        </a>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "YCT — Платформа короткометражного кино" },
      {
        name: "description",
        content:
          "YCT — международный турнир короткометражного кино для команд, которые снимают истории на 5–12 минут.",
      },
      { property: "og:title", content: "YCT — Платформа короткометражного кино" },
      { property: "og:description", content: "Международный турнир короткого метра: команды, темы, заявки и призовой фонд." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "YCT — Платформа короткометражного кино" },
      { name: "twitter:description", content: "Международный турнир короткого метра: команды, темы, заявки и призовой фонд." },
      { property: "og:image", content: "/images/yct-hero-cinema.png" },
      { name: "twitter:image", content: "/images/yct-hero-cinema.png" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=DM+Sans:wght@400;500;600&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&display=swap",
      },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const [qc] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data stays "fresh" for 3 minutes — avoids re-fetching on every
            // SPA navigation or component remount while the session is alive.
            staleTime: 3 * 60 * 1000,
            // Keep unused data in cache for 10 minutes.
            gcTime: 10 * 60 * 1000,
            // Don't silently retry auth failures — surface them immediately.
            // Per-query overrides can bump this for non-auth queries.
            retry: false,
            // Always refetch on window focus so returning to the tab after
            // a long absence shows fresh data.
            refetchOnWindowFocus: true,
            // Refetch on mount so navigating back to a page always gets
            // fresh data from the server (respects staleTime).
            refetchOnMount: true,
          },
        },
      }),
  );
  return (
    <QueryClientProvider client={qc}>
      <I18nProvider>
        <AuthProvider>
          <div className="film-grain film-vignette">
            <CinematicDecor />
            <Navbar />
            <main className="relative">
              <Outlet />
            </main>
            <Toaster richColors position="top-center" />
          </div>
        </AuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
