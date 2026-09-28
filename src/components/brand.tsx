import Link from "next/link";
import { Ticket } from "@phosphor-icons/react/dist/ssr/Ticket";
export function Clover({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="30"
      height="30"
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M16 16C5-1 1 12 8 15c-13 3-2 17 8 1Zm0 0c-1-20 17-15 10-5 13-1 8 17-10 5Z"
        fill="currentColor"
      />
      <path
        d="M16 16c3 5 4 9 3 13"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      className={`brand ${light ? "brand-light" : ""}`}
      aria-label="Suerte Panamá, inicio"
    >
      <span className="brand-symbol">
        <Ticket size={25} weight="duotone" />
      </span>
      <span>
        suerte<span className="brand-country">PANAMÁ</span>
      </span>
      <span className="brand-dot">.</span>
    </Link>
  );
}
