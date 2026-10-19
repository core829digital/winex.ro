import type { Metadata, Viewport } from "next";
import "../globals.css";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { AdminProviders } from "@/components/admin/AdminProviders";

export const metadata: Metadata = {
  title: { default: "Winex Admin", template: "%s · Winex Admin" },
  robots: { index: false, follow: false, nocache: true },
  manifest: "/admin.webmanifest",
  appleWebApp: { capable: true, title: "Winex Admin", statusBarStyle: "default" },
  icons: { apple: "/admin-icon-192.png" },
};

export const viewport: Viewport = { themeColor: "#dc2430", width: "device-width", initialScale: 1 };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return (
      <html lang="ro"><body><main className="grid min-h-dvh place-items-center p-6">
        <div className="max-w-md rounded-3xl border border-black/10 p-8">
          <h1 className="text-2xl font-extrabold">Configurare necesară</h1>
          <p className="mt-3 text-ink-soft">
            Variabila <code>NEXT_PUBLIC_CONVEX_URL</code> lipsește. Urmează pașii din README (secțiunea Admin) și
            repornește aplicația.
          </p>
        </div>
      </main></body></html>
    );
  }
  return (
    <html lang="ro">
      <body className="min-h-dvh overflow-x-clip">
        <ConvexAuthNextjsServerProvider>
          <AdminProviders>{children}</AdminProviders>
        </ConvexAuthNextjsServerProvider>
      </body>
    </html>
  );
}
