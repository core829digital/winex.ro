import { ImageResponse } from "next/og";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";

export const alt = "Winex";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Immagine di condivisione (Open Graph / Twitter) generata per ogni lingua, senza asset esterni. */
export default async function OgImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = hasLocale(routing.locales, raw) ? raw : routing.defaultLocale;
  const [t, hero] = await Promise.all([getTranslations({ locale, namespace: "common" }), getTranslations({ locale, namespace: "hero" })]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#14161a",
          color: "#f3f4f6",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 64, height: 8, background: "#cc1f2b" }} />
          <div style={{ fontSize: 30, letterSpacing: 6, fontWeight: 700 }}>WINEX</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>{t("tagline")}</div>
          <div style={{ fontSize: 30, color: "#aab1bb" }}>{hero("trust2")}</div>
        </div>
        <div style={{ display: "flex", height: 4, width: "100%", background: "linear-gradient(90deg,#cc1f2b,#14161a)" }} />
      </div>
    ),
    size,
  );
}
