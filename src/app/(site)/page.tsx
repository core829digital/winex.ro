import { Hero } from "@/components/home/Hero";
import { Materials } from "@/components/home/Materials";
import { Energy } from "@/components/home/Energy";
import { Process } from "@/components/home/Process";
import { ConfiguratorCta } from "@/components/home/ConfiguratorCta";
import { NewsletterSection } from "@/components/home/NewsletterSection";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Materials />
      <Energy />
      <Process />
      <ConfiguratorCta />
      <NewsletterSection />
    </>
  );
}
