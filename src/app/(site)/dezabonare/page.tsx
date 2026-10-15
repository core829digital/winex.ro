import type { Metadata } from "next";
import { Suspense } from "react";
import { UnsubscribeForm } from "@/components/forms/UnsubscribeForm";

export const metadata: Metadata = {
  title: "Dezabonare newsletter",
  robots: { index: false, follow: false },
};

export default function UnsubscribePage() {
  return (
    <section className="grid min-h-[80dvh] place-items-center px-4 pt-32">
      <div className="glass-strong w-full max-w-md rounded-[2rem] p-8 text-center sm:p-10">
        <h1 className="text-3xl font-extrabold">Dezabonare</h1>
        <Suspense>
          <UnsubscribeForm />
        </Suspense>
      </div>
    </section>
  );
}
