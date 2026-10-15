import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

const paths = ["", "/despre-noi", "/fabrica", "/configurator", "/contact", "/politica-confidentialitate", "/termeni-si-conditii", "/politica-cookies"];

export default function sitemap(): MetadataRoute.Sitemap {
  return paths.map((p) => ({ url: `${site.url}${p}`, changeFrequency: p === "" ? "weekly" : "monthly", priority: p === "" ? 1 : 0.7 }));
}
