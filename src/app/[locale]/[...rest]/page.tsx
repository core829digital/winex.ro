import { notFound } from "next/navigation";

/** Qualsiasi URL non riconosciuto sotto /{lingua}/… mostra la 404 localizzata. */
export default function CatchAll() {
  notFound();
}
