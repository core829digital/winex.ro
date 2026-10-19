"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Btn, Card, Field, Input, PageHeader, Skeleton } from "@/components/admin/ui";
import { errMsg, useToast } from "@/components/admin/toast";
import { site } from "@/lib/site";

const FIELDS = [
  ["legalName", "Denumire legală", "S.C. … S.R.L."],
  ["cui", "CUI", "RO12345678"],
  ["regCom", "Nr. Reg. Comerțului", "J2000/000/2000"],
  ["address", "Adresă (sediu / fabrică)", "Str. …, Roman, jud. Neamț"],
  ["phone", "Telefon", "+40 …"],
  ["email", "E-mail de contact", "contact@winex.ro"],
  ["hours", "Program", "Luni–Vineri 08:00–17:00"],
  ["facebook", "Facebook (URL)", "https://facebook.com/…"],
  ["instagram", "Instagram (URL)", "https://instagram.com/…"],
  ["linkedin", "LinkedIn (URL)", "https://linkedin.com/company/…"],
] as const;
type Key = (typeof FIELDS)[number][0];

export default function ContentPage() {
  const data = useQuery(api.settings.getAdmin);
  if (!data) return <Skeleton className="h-96" />;
  return <Form initial={(data.company ?? {}) as Partial<Record<Key, string>>} />;
}

function Form({ initial }: { initial: Partial<Record<Key, string>> }) {
  const save = useMutation(api.settings.saveCompany);
  const toast = useToast();
  const [v, setV] = useState<Record<Key, string>>(() => Object.fromEntries(FIELDS.map(([k]) => [k, initial[k] ?? ""])) as Record<Key, string>);
  const defaults = { legalName: site.company.legalName, cui: site.company.cui, regCom: site.company.regCom, address: site.company.address, phone: site.company.phone, email: site.company.email, hours: site.company.hours } as Record<string, string>;

  return (
    <>
      <PageHeader title="Conținut site" subtitle="Datele societății apar în subsol, pagina Contact și paginile legale. Modificările se văd pe site în cel mult 1 minut." />
      <Card>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            save({ value: v }).then(() => toast("Salvat. Apare pe site în max. 1 minut.")).catch((err) => toast(errMsg(err), "error"));
          }}
        >
          {FIELDS.map(([k, label, ph]) => (
            <Field key={k} label={label} hint={!v[k] && defaults[k] ? `Implicit: ${defaults[k]}` : undefined}>
              <Input value={v[k]} onChange={(e) => setV((s) => ({ ...s, [k]: e.target.value }))} placeholder={ph} maxLength={400} />
            </Field>
          ))}
          <div className="sm:col-span-2"><Btn variant="primary" type="submit">Salvează</Btn></div>
        </form>
      </Card>
    </>
  );
}
