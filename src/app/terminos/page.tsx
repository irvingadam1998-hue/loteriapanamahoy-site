export const metadata = {
  alternates: { canonical: "/terminos" },
  title: "Términos de uso",
  description:
    "Lee las condiciones del comprobador de lotería de Suerte Panamá y el alcance informativo de los resultados y premios publicados.",
};
export default function TermsPage() {
  return (
    <main id="contenido" className="container page-content">
      <article className="article-layout">
        <div className="page-heading">
          <span className="eyebrow">PARA QUE ESTEMOS EN LA MISMA PÁGINA</span>
          <h1>Términos de uso.</h1>
          <p>Última actualización: 27 de septiembre de 2026.</p>
        </div>
        <div className="article-body">
          <h2>Un servicio de información</h2>
          <p>
            Suerte Panamá permite consultar resultados publicados manualmente y
            comparar números de billetes o chances con un plan de premios
            registrado. Es un sitio independiente, sin afiliación ni
            representación de la Lotería Nacional de Beneficencia de Panamá.
          </p>
          <h2>Resultados y premios</h2>
          <p>
            Las consultas son orientativas. La exactitud depende de los datos
            publicados, de las reglas verificadas por el administrador y de la
            información que introduces. El resultado oficial, el boleto original
            y la validación de la LNB prevalecen ante cualquier diferencia.
          </p>
          <p>
            El resultado «sin premio» solo se muestra cuando no hay
            coincidencias en el plan marcado como completo. Si faltan reglas o
            datos relevantes, se indica que la revisión está incompleta. No
            deseches tu boleto basándote exclusivamente en esta página.
          </p>
          <h2>Datos de demostración</h2>
          <p>
            Los sorteos marcados como DEMO y sus importes son ficticios. Sirven
            para mostrar cómo funciona la web y no representan premios reales ni
            derechos de cobro.
          </p>
          <h2>Uso del servicio</h2>
          <p>
            La consulta es gratuita. No vendemos boletos, no recibimos apuestas,
            no cobramos ni transferimos premios. No publiques datos sensibles ni
            intentes acceder sin autorización al panel administrativo.
          </p>
          <h2>Disponibilidad y publicidad</h2>
          <p>
            Los resultados pueden tardar en publicarse y el servicio puede
            interrumpirse por mantenimiento. La web puede mostrar publicidad
            identificada como tal. Los anuncios no forman parte de los
            resultados ni de la validación del boleto.
          </p>
          <h2>Fuente oficial</h2>
          <p>
            Verifica la información de tus sorteos en{" "}
            <a
              href="https://www.lnb.gob.pa/"
              target="_blank"
              rel="noopener noreferrer"
            >
              la Lotería Nacional de Beneficencia
            </a>
            .
          </p>
        </div>
      </article>
    </main>
  );
}
