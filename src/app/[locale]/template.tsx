/** Il template si rimonta a ogni navigazione: applica l'ingresso morbido di pagina. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-in">{children}</div>;
}
