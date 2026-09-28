"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="contenido" className="page-error">
      <h1>No pudimos cargar la página.</h1>
      <p>Intenta de nuevo dentro de un momento.</p>
      <button onClick={reset} className="button button-dark">
        Volver a intentar
      </button>
    </main>
  );
}
