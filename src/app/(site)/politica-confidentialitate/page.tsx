import type { Metadata } from "next";
import { LegalPage } from "@/components/ui/LegalPage";
import { getCompany } from "@/lib/company";

export const metadata: Metadata = {
  title: "Politica de confidențialitate",
  alternates: { canonical: "/politica-confidentialitate" },
};

export default async function PrivacyPage() {
  const c = await getCompany();
  return (
    <LegalPage title="Politica de confidențialitate" updated="TODO — data publicării">
      {/* ATENȚIE: model de lucru. Trebuie verificat și aprobat de consultantul juridic al companiei înainte de publicare. */}
      <h2>1. Operatorul de date</h2>
      <p>
        Operatorul datelor cu caracter personal este <b>{c.legalName}</b>, CUI {c.cui}, Reg. Com. {c.regCom},
        cu sediul în {c.address}. Contact: {c.email}, {c.phone}.
      </p>

      <h2>2. Ce date prelucrăm și de ce</h2>
      <ul>
        <li>
          <b>Formularul de contact / cerere de ofertă:</b> nume, e-mail, telefon (opțional), conținutul mesajului.
          Scop: răspunsul la solicitare și pregătirea ofertei. Temei: măsuri precontractuale la cererea persoanei
          vizate și interesul legitim (art. 6 alin. 1 lit. b și f GDPR).
        </li>
        <li>
          <b>Newsletter:</b> adresa de e-mail. Scop: trimiterea de comunicări comerciale. Temei: consimțământul
          (art. 6 alin. 1 lit. a GDPR), retractabil oricând.
        </li>
        <li>
          <b>Statistici anonime ale site-ului:</b> pagini vizitate, clicuri pe butoane/linkuri, tipul dispozitivului,
          țara și sursa de trafic. Nu folosim cookie-uri și nu stocăm nimic pe dispozitivul tău. Identificatorul de
          vizitator este un cod anonim, calculat zilnic, care nu poate fi folosit pentru a te identifica și se
          schimbă în fiecare zi. Respectăm semnalele „Do Not Track” și „Global Privacy Control”. Scop: înțelegerea și
          îmbunătățirea site-ului. Temei: interes legitim. Evenimentele detaliate se șterg după 3 zile; rămân doar
          totaluri agregate.
        </li>
        <li>
          <b>Date tehnice:</b> adresa IP este folosită temporar pentru securitate și prevenirea abuzurilor (limitarea
          cererilor). Temei: interes legitim.
        </li>
      </ul>

      <h2>3. Destinatari</h2>
      <p>Datele sunt prelucrate prin furnizori care acționează ca persoane împuternicite:</p>
      <ul>
        <li>Convex, Inc. — stocarea mesajelor, a abonaților și a statisticilor anonime;</li>
        <li>Resend, Inc. — trimiterea și livrarea e-mailurilor;</li>
        <li>Furnizorul de găzduire al site-ului (TODO — ex. Vercel Inc.);</li>
        <li>OneSpec — doar dacă folosești configuratorul online, conform politicii lor.</li>
      </ul>
      <p>
        Unii furnizori pot prelucra date în afara Spațiului Economic European; transferurile se bazează pe Clauze
        Contractuale Standard și/sau pe Cadrul de confidențialitate UE–SUA, după caz.
      </p>

      <h2>4. Perioada de stocare</h2>
      <p>
        Mesajele de contact: până la 24 de luni de la ultima interacțiune, dacă nu se încheie un contract. Abonarea la
        newsletter: până la retragerea consimțământului. Datele din relații contractuale: conform obligațiilor legale
        (inclusiv contabile și fiscale).
      </p>

      <h2>5. Drepturile tale</h2>
      <p>
        Ai dreptul de acces, rectificare, ștergere, restricționare, portabilitate și opoziție, precum și dreptul de a
        retrage consimțământul. Ne poți scrie la {c.email}. Ai dreptul de a depune plângere la{" "}
        <a href="https://www.dataprotection.ro" target="_blank" rel="noopener noreferrer">
          Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP)
        </a>
        .
      </p>

      <h2>6. Securitate</h2>
      <p>
        Folosim conexiuni criptate (HTTPS), acces restricționat la date și măsuri tehnice împotriva abuzurilor. Nu
        vindem datele tale.
      </p>

      <h2>7. Modificări</h2>
      <p>Putem actualiza această politică; versiunea curentă este întotdeauna cea publicată pe această pagină.</p>
    </LegalPage>
  );
}
