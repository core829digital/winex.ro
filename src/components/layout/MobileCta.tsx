"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { ButtonLink } from "@/components/ui/Button";

/** Barra CTA fissa solo su mobile; nascosta nel configuratore e nel pannello (stesso scopo della pagina). */
export function MobileCta() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  if (pathname === "/configurator") return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 md:hidden">
      <ButtonLink href="/configurator" className="w-full" arrow>
        {t("cta")}
      </ButtonLink>
    </div>
  );
}
