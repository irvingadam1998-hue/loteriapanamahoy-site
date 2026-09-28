import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr/ArrowUpRight";
export const metadata = {
  alternates: { canonical: "/contacto" },
  title: "Contacto",
  description:
    "Reporta un error en los resultados de lotería publicados en Suerte Panamá o consulta los canales oficiales de la LNB.",
};
export default function ContactPage() {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  const valid = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  return (
    <main id="contenido" className="container page-content">
      <article className="article-layout">
        <div className="page-heading">
          <span className="eyebrow">HABLEMOS</span>
          <h1>Cada detalle cuenta.</h1>
          <p>Ayúdanos a mantener los resultados claros y correctos.</p>
        </div>
        <div className="article-body">
          <h2>¿Encontraste un error?</h2>
          <p>
            Indica la modalidad, la fecha, el número del sorteo y un enlace a la
            fuente oficial para que podamos revisarlo. No envíes tu cédula,
            datos bancarios ni fotografías con información personal.
          </p>
          {valid ? (
            <a className="button button-dark" href={`mailto:${email}`}>
              Escribir a {email} <ArrowUpRight size={16} weight="duotone" />
            </a>
          ) : (
            <p className="notice">
              El canal de contacto de Suerte Panamá estará disponible
              próximamente. Mientras tanto, puedes verificar los resultados en
              la fuente oficial.
            </p>
          )}
          <h2>Consultas sobre cobro de premios</h2>
          <p>
            Los premios los valida la Lotería Nacional de Beneficencia. Para
            información oficial, visita{" "}
            <a
              href="https://www.lnb.gob.pa/"
              target="_blank"
              rel="noopener noreferrer"
            >
              lnb.gob.pa
            </a>
            .
          </p>
          <h2>Publicidad</h2>
          <p>
            Suerte Panamá dispone de espacios identificados para anunciantes. Si
            el correo de contacto ya está disponible, puedes escribirnos con el
            asunto «Publicidad».
          </p>
        </div>
      </article>
    </main>
  );
}
