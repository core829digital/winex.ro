import { readFile } from "node:fs/promises";
import { join } from "node:path";
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
  const logo = `data:image/png;base64,${(await readFile(join(process.cwd(), "public/brand/winex-logo.png"))).toString("base64")}`;
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
          background: "#ffffff",
          color: "#1f2328",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt="" width={294} height={80} />
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>{t("tagline")}</div>
          <div style={{ fontSize: 30, color: "#667085" }}>{hero("trust2")}</div>
        </div>
        <div style={{ display: "flex", height: 4, width: "100%", background: "linear-gradient(90deg,#cc1f2b,#ffffff)" }} />
      </div>
    ),
    size,
  );
}
