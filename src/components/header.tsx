"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr/ArrowUpRight";
import { List } from "@phosphor-icons/react/dist/ssr/List";
import { X } from "@phosphor-icons/react/dist/ssr/X";
import { useState } from "react";
import { Brand } from "./brand";
export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const links = [
    { href: "/", label: "Inicio" },
    { href: "/resultados", label: "Resultados" },
    { href: "/como-funciona", label: "Cómo funciona" },
  ];
  return (
    <>
      <div className="utility-bar">
        <div className="container">
          <span>
            RESULTADOS INFORMATIVOS <span aria-hidden="true">/</span> PANAMÁ
          </span>
          <span>Consulta gratuita · Sin registro</span>
        </div>
      </div>
      <header className="site-header">
        <div className="container header-inner">
          <Brand />
          <nav
            className={open ? "main-nav is-open" : "main-nav"}
            aria-label="Navegación principal"
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={pathname === link.href ? "active" : ""}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <Link className="header-check" href="/#comprobar">
            Revisar mi número <ArrowUpRight size={16} weight="duotone" />
          </Link>
          <button
            className="menu-toggle"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X weight="duotone" /> : <List weight="duotone" />}
          </button>
        </div>
      </header>
    </>
  );
}
