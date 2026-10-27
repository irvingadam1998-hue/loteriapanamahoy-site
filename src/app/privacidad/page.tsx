import Link from "next/link";
import { publicSocialMetadata } from "@/lib/seo";
const privacyTitle = "Privacidad y cookies";
const privacyDescription =
  "Conoce cómo loteriapanamahoy.site procesa las consultas y gestiona las preferencias de publicidad.";
export const metadata = {
  alternates: { canonical: "/privacidad" },
  title: privacyTitle,
  description: privacyDescription,
  ...publicSocialMetadata(privacyTitle, privacyDescription, "/privacidad"),
};
export default function PrivacyPage() {
  return (
    <main id="contenido" className="container page-content">
      <article className="article-layout">
        <div className="page-heading">
          <span className="eyebrow">TUS DATOS, CON CLARIDAD</span>
          <h1>Privacidad y cookies.</h1>
          <p>Última actualización: 26 de octubre de 2026.</p>
          <p>
            loteriapanamahoy.site es un sitio independiente. Para
            consultas sobre privacidad puedes escribir a través de la {" "}
            <Link href="/contacto">página de contacto</Link>.
          </p>
        </div>
        <div className="article-body">
          <h2>Tu consulta</h2>
          <p>
            Los números y datos del boleto se usan únicamente para compararlos
            con el sorteo que eliges. No se guardan en una base de datos ni se
            necesita una cuenta para usar el comprobador.
          </p>
          <h2>Información de conexión</h2>
          <p>
            Los servicios que mantienen la web pueden procesar información
            técnica básica de conexión para operarla y protegerla. Esa
            información no aparece en el historial público de sorteos.
          </p>
          <h2>Vistas de los sorteos</h2>
          <p>
            Para mostrar cuántos navegadores consultaron cada resultado,
            guardamos una cookie con un identificador aleatorio durante un año.
            Contamos una vista por navegador y sorteo. No guardamos tu nombre,
            tu boleto ni el número consultado para este contador.
          </p>
          <h2>Preferencias y anuncios</h2>
          <p>
            Si el propietario habilita Google AdSense, se ofrece elegir entre
            permitir anuncios no personalizados o mantener solo lo necesario.
            Guardamos la elección en el almacenamiento local del navegador; no
            es una cookie. El código de Google AdSense solo se carga después de
            aceptar y se solicita publicidad no personalizada. Si rechazas, no
            cargamos ese código publicitario.
          </p>
          <p>
            Google y sus socios pueden utilizar cookies e identificadores para
            mostrar y medir anuncios y pueden procesar identificadores del
            dispositivo e información de la solicitud. Consulta{" "}
            <a
              href="https://policies.google.com/technologies/partner-sites"
              target="_blank"
              rel="noopener noreferrer"
            >
              cómo utiliza Google los datos de sus sitios asociados
            </a>
            . Puedes cambiar tu decisión con el botón de preferencias. Al
            retirar el consentimiento dejamos de cargar anuncios en las
            siguientes solicitudes; no podemos borrar desde este sitio cookies
            que Google ya haya guardado. También puedes administrar anuncios
            personalizados en{" "}
            <a href="https://adssettings.google.com/" target="_blank" rel="noopener noreferrer">
              la configuración de anuncios de Google
            </a>
            .
          </p>
          <h2>Consultas e historial</h2>
          <p>
            El sitio no ofrece cuentas ni crea perfiles de clientes. El número
            que escribes se usa para comparar con el sorteo elegido y no se
            guarda en el historial. El historial muestra resultados publicados,
            no consultas de visitantes.
          </p>
          <h2>Tus derechos</h2>
          <p>
            Si el sitio trata algún dato personal tuyo, conforme a la Ley 81 de
            2019 y su reglamentación puedes solicitar
            acceso, rectificación, cancelación, oposición o portabilidad de tus
            datos personales, así como retirar un consentimiento cuando
            corresponda. Envía una solicitud
            mediante la {" "}
            <Link href="/contacto">página de contacto</Link>, indica el derecho
            que quieres ejercer y aporta solo la información razonable para
            verificar la solicitud. También puedes acudir a la Dirección de
            Protección de Datos Personales de la ANTAI. Consulta la {" "}
            <a href="https://antai.gob.pa/preguntas-frecuentes-de-proteccion-de-datos-personales/" target="_blank" rel="noopener noreferrer">
              guía de derechos de la ANTAI
            </a>{" "}
            y la {" "}
            <a href="https://antai.gob.pa/legislacion/" target="_blank" rel="noopener noreferrer">
              legislación oficial
            </a>
            .
          </p>
          <h2>Contacto</h2>
          <p>
            Para reportar un problema de privacidad utiliza la {" "}
            <Link href="/contacto">página de contacto</Link>. La web no
            comercializa los números que introduces.
          </p>
        </div>
      </article>
    </main>
  );
}
