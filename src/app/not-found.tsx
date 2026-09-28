import Link from "next/link";
export default function NotFound() {
  return (
    <main id="contenido" className="page-error">
      <span className="eyebrow">404 · NOS FALTA ESTE NÚMERO</span>
      <h1>Esta página no apareció.</h1>
      <p>Vuelve al inicio o busca otro sorteo en los resultados.</p>
      <Link href="/" className="button button-dark">
        Volver al inicio
      </Link>
    </main>
  );
}
