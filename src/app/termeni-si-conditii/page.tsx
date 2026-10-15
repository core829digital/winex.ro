import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/ui/LegalPage";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Termeni și condiții",
  alternates: { canonical: "/termeni-si-conditii" },
};

export default function TermsPage() {
  const c = site.company;
  return (
    <LegalPage title="Termeni și condiții" updated="TODO — data publicării">
      {/* ATENȚIE: model de lucru. Trebuie verificat și aprobat de consultantul juridic al companiei înainte de publicare. */}
      <h2>1. Despre site</h2>
      <p>
        Acest site ({site.domain}) este operat de <b>{site.legalName}</b>, CUI {c.cui}, Reg. Com. {c.regCom}, sediu:{" "}
        {c.address}. Prin accesarea site-ului accepți acești termeni.
      </p>

      <h2>2. Informații despre produse</h2>
      <p>
        Conținutul site-ului are caracter informativ și nu constituie ofertă fermă. Imaginile, culorile și
        specificațiile pot diferi de produsul final. Oferta și contractul se stabilesc individual, în scris.
      </p>

      <h2>3. Configuratorul</h2>
      <p>
        Configurațiile create prin configurator sunt orientative până la confirmarea scrisă a ofertei de către
        Winex. Configuratorul este furnizat în colaborare cu OneSpec; utilizarea lui poate fi supusă și termenilor
        acestui furnizor.
      </p>

      <h2>4. Proprietate intelectuală</h2>
      <p>
        Textele, imaginile, logo-urile și designul site-ului aparțin {site.name} sau licențiatorilor săi și nu pot fi
        copiate sau folosite fără acord scris.
      </p>

      <h2>5. Limitarea răspunderii</h2>
      <p>
        Depunem eforturi pentru acuratețea informațiilor, dar nu garantăm lipsa erorilor sau disponibilitatea
        neîntreruptă a site-ului. Răspunderea este limitată în măsura permisă de lege.
      </p>

      <h2>6. Date personale</h2>
      <p>
        Prelucrarea datelor este descrisă în <Link href="/politica-confidentialitate">Politica de confidențialitate</Link>
        {" "}și <Link href="/politica-cookies">Politica de cookie-uri</Link>.
      </p>

      <h2>7. Soluționarea litigiilor</h2>
      <p>
        Legea aplicabilă este legea română. Consumatorii pot apela la{" "}
        <a href="https://anpc.ro/ce-este-sal/" target="_blank" rel="noopener noreferrer">ANPC – SAL</a> și la{" "}
        <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">platforma SOL</a>.
      </p>
    </LegalPage>
  );
}
