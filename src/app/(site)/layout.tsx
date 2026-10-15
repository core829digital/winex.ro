import { site } from "@/lib/site";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { EnergyFlow } from "@/components/visual/EnergyFlow";
import { Tracker } from "@/components/layout/Tracker";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: site.name,
  url: site.url,
  description: site.description,
  address: { "@type": "PostalAddress", addressLocality: site.city, addressCountry: "RO" },
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-red focus:px-5 focus:py-3 focus:text-white"
      >
        Sari la conținut
      </a>
      <EnergyFlow />
      <SmoothScroll />
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <Tracker />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </>
  );
}
