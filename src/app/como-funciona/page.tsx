import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import { publicSocialMetadata } from "@/lib/seo";
const guideTitle = "Cómo comprobar un billete o chance en Panamá";
const guideDescription =
  "Aprende a consultar sorteos de Panamá, conservar los ceros iniciales y entender las coincidencias de tu billete o chance.";
export const metadata = {
  alternates: { canonical: "/como-funciona" },
  title: guideTitle,
  description: guideDescription,
  ...publicSocialMetadata(guideTitle, guideDescription, "/como-funciona"),
};
export default function GuidePage() {
  return (
    <main id="contenido" className="container page-content">
      <article className="article-layout">
        <div className="page-heading">
          <span className="eyebrow">TU GUÍA, SIN COMPLICACIONES</span>
          <h1>Un número. Unos segundos.</h1>
          <p>Todo lo que necesitas para entender tu consulta.</p>
        </div>
        <div className="article-body">
          <section className="guide-step">
            <span>01</span>
            <div>
              <h2>Encuentra tu sorteo</h2>
              <p>
                Busca la modalidad y la fecha impresas en tu boleto. En
                loteriapanamahoy.site puedes consultar Dominical, Miércolito,
                Gordito del Zodíaco, Extraordinario y sorteos especiales que haya publicado
                el sitio.
              </p>
              <p>
                Los resultados se cargan manualmente. La ausencia de un
                resultado no significa que no haya premio: vuelve a consultar
                después de su publicación.
              </p>
            </div>
          </section>
          <section className="guide-step">
            <span>02</span>
            <div>
              <h2>Introduce tu número completo</h2>
              <p>
                Selecciona «Billete» para números de cuatro cifras (cinco en el
                Extraordinario) o «Chance» para números de dos cifras. Conserva
                los ceros iniciales: 0027 es un billete de cuatro cifras y 07 es
                un chance de dos.
              </p>
              <p>
                En «Fracciones, letras y más» indica cuántos pedazos tienes del
                mismo número y con las mismas letras, serie y folio. Si tus
                fracciones tienen datos distintos, compruébalas por separado.
              </p>
            </div>
          </section>
          <section className="guide-step">
            <span>03</span>
            <div>
              <h2>Lee tu resultado</h2>
              <p>
                El comprobador compara tu boleto con las reglas cargadas para
                ese sorteo: número exacto, primeras o últimas cifras,
                aproximaciones e incentivos por letras, serie o folio, según
                corresponda.
              </p>
              <ul>
                <li>
                  <strong>Con premio:</strong> mostramos las coincidencias y el
                  importe orientativo para tus fracciones.
                </li>
                <li>
                  <strong>Sin premio:</strong> no hay coincidencias en el plan
                  registrado y verificado como completo.
                </li>
                <li>
                  <strong>Revisión incompleta:</strong> faltan datos del boleto
                  o el plan aún no está verificado. No podemos descartar un
                  premio.
                </li>
              </ul>
            </div>
          </section>
          <h2>Si tu número tiene premio</h2>
          <p>
            Conserva el boleto original y comprueba los resultados y el importe
            con la Lotería Nacional de Beneficencia. loteriapanamahoy.site es
            un sitio independiente que muestra resultados informativos: no paga
            premios, no vende lotería y no solicita documentos ni datos bancarios.
          </p>
          <p>
            Consulta los requisitos de cobro en{" "}
            <a
              href="https://www.panamadigital.gob.pa/InformacionTramite/pago-de-premios"
              target="_blank"
              rel="noopener noreferrer"
            >
              Panamá Digital
            </a>{" "}
            y la información del sorteo en la{" "}
            <a
              href="https://www.lnb.gob.pa/"
              target="_blank"
              rel="noopener noreferrer"
            >
              web de la LNB
            </a>
            .
          </p>
          <h2>Una consulta gratuita y privada</h2>
          <p>
            No necesitas registrarte. Procesamos tu número para responder a la
            consulta y no lo guardamos en la base de datos. Los espacios
            publicitarios ayudan a sostener la web cuando la publicidad está
            habilitada.
          </p>
          <Link href="/#comprobar" className="button button-dark">
            Comprobar mi número <ArrowRight size={16} weight="duotone" />
          </Link>
        </div>
      </article>
    </main>
  );
}
