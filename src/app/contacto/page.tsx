import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr/ArrowUpRight";
import { publicSocialMetadata } from "@/lib/seo";
const contactTitle = "Contacto y soporte";
const contactDescription =
  "Contacta a loteriapanamahoy.site para reportar errores o pedir soporte sobre las consultas de resultados.";
export const metadata = {
  alternates: { canonical: "/contacto" },
  title: contactTitle,
  description: contactDescription,
  ...publicSocialMetadata(contactTitle, contactDescription, "/contacto"),
};
export default function ContactPage() {
  const email =
    process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() ||
    "soporte@loteriapanamahoy.site";
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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
              Para soporte y consultas, escríbenos a{" "}
              <a href={`mailto:${email}`}>{email}</a>.
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
          <h2>Privacidad y datos personales</h2>
          <p>
            Para ejercer derechos sobre tus datos, escribe al correo de soporte
            indicando el derecho solicitado y cómo podemos verificar tu
            solicitud. No incluyas contraseñas, datos bancarios ni información
            de terceros. Consulta nuestra {" "}
            <a href="/privacidad">política de privacidad</a>.
          </p>
          <h2>Publicidad</h2>
          <p>
            loteriapanamahoy.site dispone de espacios identificados para
            anunciantes. Escríbenos a{" "}
            <a href={`mailto:${email}?subject=Publicidad`}>{email}</a> con el
            asunto «Publicidad».
          </p>
        </div>
      </article>
    </main>
  );
}
