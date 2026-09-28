import Link from "next/link";
export const metadata = {
  alternates: { canonical: "/privacidad" },
  title: "Privacidad y cookies",
  description:
    "Conoce cómo Suerte Panamá procesa tu consulta de lotería, protege tu privacidad y gestiona las preferencias de publicidad.",
};
export default function PrivacyPage() {
  return (
    <main id="contenido" className="container page-content">
      <article className="article-layout">
        <div className="page-heading">
          <span className="eyebrow">TUS DATOS, CON CLARIDAD</span>
          <h1>Privacidad y cookies.</h1>
          <p>Última actualización: 27 de septiembre de 2026.</p>
        </div>
        <div className="article-body">
          <h2>Tu consulta</h2>
          <p>
            El número del boleto, sus letras, serie, folio y cantidad de
            fracciones se envían al servidor únicamente para compararlos con el
            sorteo seleccionado. La aplicación no guarda estas consultas en su
            base de datos ni exige crear una cuenta.
          </p>
          <h2>Información técnica</h2>
          <p>
            El proveedor de alojamiento puede registrar información técnica de
            las peticiones, como dirección IP, fecha, ruta solicitada y
            navegador. No enviamos los números del comprobador en la URL. El
            administrador debe revisar la retención y el acceso a los registros
            de su proveedor de alojamiento.
          </p>
          <h2>Cookies de administración</h2>
          <p>
            El panel utiliza una cookie de sesión necesaria, protegida contra
            acceso desde JavaScript. La sesión dura hasta ocho horas y se revoca
            al cerrar sesión. Las consultas públicas no requieren esta cookie.
          </p>
          <h2>Preferencias y anuncios</h2>
          <p>
            Si el propietario habilita Google AdSense, se ofrece elegir entre
            aceptar publicidad o mantener solo lo necesario. Guardamos esa
            elección en el almacenamiento local del navegador. El código
            publicitario de Google solo se carga después de aceptar.
          </p>
          <p>
            Google y sus socios pueden utilizar cookies e identificadores para
            mostrar y medir anuncios. Consulta{" "}
            <a
              href="https://policies.google.com/technologies/partner-sites"
              target="_blank"
              rel="noopener noreferrer"
            >
              cómo utiliza Google los datos de sus sitios asociados
            </a>
            . Puedes cambiar tu decisión desde el botón de preferencias que
            aparece cuando la publicidad está configurada. Al rechazar, la
            página se recarga para dejar de cargar anuncios; también puedes
            borrar las cookies existentes desde tu navegador.
          </p>
          <h2>Contacto y solicitudes</h2>
          <p>
            Para reportar un problema de privacidad o solicitar información,
            utiliza la <Link href="/contacto">página de contacto</Link>. La web
            no comercializa los números que introduces.
          </p>
        </div>
      </article>
    </main>
  );
}
