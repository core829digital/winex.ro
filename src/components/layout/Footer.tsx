import Link from "next/link";
import { legalNav, nav, site } from "@/lib/site";
import { Logo } from "@/components/ui/Logo";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative mt-12 px-3 pb-6 sm:px-6">
      <div className="glass mx-auto max-w-6xl rounded-[2rem] p-8 sm:p-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <Logo />
            <p className="mt-5 max-w-xs text-sm text-ink-soft">{site.tagline}</p>
            <p className="mt-5 text-sm text-ink-mute">
              {site.city}, {site.country}
            </p>
          </div>

          <div>
            <h3 className="eyebrow !text-ink-mute">Navigare</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {nav.map((i) => (
                <li key={i.href}>
                  <Link className="text-ink-soft transition hover:text-red-deep" href={i.href}>
                    {i.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="eyebrow !text-ink-mute">Legal</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {legalNav.map((i) => (
                <li key={i.href}>
                  <Link className="text-ink-soft transition hover:text-red-deep" href={i.href}>
                    {i.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  className="text-ink-soft transition hover:text-red-deep"
                  href="https://anpc.ro/ce-este-sal/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ANPC — SAL
                </a>
              </li>
              <li>
                <a
                  className="text-ink-soft transition hover:text-red-deep"
                  href="https://ec.europa.eu/consumers/odr"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Platforma SOL (UE)
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="eyebrow !text-ink-mute">Contact</h3>
            <address className="mt-4 space-y-2.5 text-sm not-italic text-ink-soft">
              <p>{site.company.address}</p>
              <p>{site.company.phone}</p>
              <p>{site.company.email}</p>
            </address>
          </div>
        </div>

        <div className="hairline mt-10" />
        <div className="mt-6 flex flex-col gap-2 text-xs text-ink-mute sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {site.name}. Toate drepturile rezervate.
          </p>
          <p>CUI: {site.company.cui} · Reg. Com.: {site.company.regCom}</p>
        </div>
      </div>
    </footer>
  );
}
