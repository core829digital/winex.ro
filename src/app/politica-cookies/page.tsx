import type { Metadata } from "next";
import { LegalPage } from "@/components/ui/LegalPage";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Politica de cookie-uri",
  alternates: { canonical: "/politica-cookies" },
};

export default function CookiesPage() {
  return (
    <LegalPage title="Politica de cookie-uri" updated="TODO — data publicării">
      {/* ATENȚIE: model de lucru. Dacă se adaugă analytics/marketing, adăugați bannerul de consimțământ și actualizați lista. */}
      <h2>1. Ce sunt cookie-urile</h2>
      <p>Cookie-urile sunt fișiere mici stocate în browser, folosite pentru funcționarea și îmbunătățirea unui site.</p>

      <h2>2. Ce folosim pe {site.domain}</h2>
      <p>
        În prezent, site-ul <b>nu folosește cookie-uri de analiză sau de marketing</b>. Nu este necesar un
        consimțământ pentru funcționarea tehnică a site-ului.
      </p>

      <h2>3. Servicii terțe</h2>
      <p>
        Pagina de configurator încarcă un serviciu extern (OneSpec) într-un cadru încorporat. Acesta poate seta
        propriile cookie-uri sau tehnologii similare, conform politicii furnizorului.
      </p>

      <h2>4. Gestionarea cookie-urilor</h2>
      <p>
        Poți șterge sau bloca cookie-urile din setările browserului. Blocarea poate afecta funcționarea unor servicii
        terțe.
      </p>

      <h2>5. Modificări</h2>
      <p>Dacă vom introduce instrumente de analiză sau marketing, vom solicita consimțământul înainte de activare.</p>
    </LegalPage>
  );
}
