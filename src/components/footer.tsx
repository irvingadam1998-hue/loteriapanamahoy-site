import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr/ArrowUpRight";
import { Heart } from "@phosphor-icons/react/dist/ssr/Heart";
import { Brand } from "./brand";
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <div>
            <Brand light />
            <p>
              Resultados claros, a la vista.
              <br />
              La tranquilidad de comprobarlo.
            </p>
          </div>
          <div>
            <span className="footer-heading">EXPLORA</span>
            <Link href="/resultados">Resultados</Link>
            <Link href="/#comprobar">Comprobar mi número</Link>
            <Link href="/como-funciona">Cómo funciona</Link>
          </div>
          <div>
          <span className="footer-heading">LOTERIAPANAMAHOY.SITE</span>
            <Link href="/contacto">Contacto</Link>
            <a href="mailto:soporte@loteriapanamahoy.site">Soporte por correo</a>
            <Link href="/privacidad">Privacidad y cookies</Link>
            <Link href="/terminos">Términos de uso</Link>
          </div>
          <div className="footer-note">
            <span className="footer-heading">INFORMACIÓN CLARA</span>
            <p>
              Somos un sitio independiente, sin afiliación con la Lotería
              Nacional de Beneficencia. Verifica tus premios con la fuente
              oficial.
            </p>
            <a
              href="https://www.lnb.gob.pa/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Visitar la LNB <ArrowUpRight size={14} weight="duotone" />
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} loteriapanamahoy.site</span>
          <span>
            Hecho con <Heart size={12} weight="duotone" /> para Panamá
          </span>
          <span>Información independiente · Confirma en la LNB</span>
        </div>
      </div>
    </footer>
  );
}
