"use client";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Cookie } from "@phosphor-icons/react/dist/ssr/Cookie";
import { SlidersHorizontal } from "@phosphor-icons/react/dist/ssr/SlidersHorizontal";
const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
const validClient = /^ca-pub-\d{16}$/.test(client || "");
declare global {
  interface Window {
    adsbygoogle?: (Record<string, unknown>[] & {
      requestNonPersonalizedAds?: number;
    });
  }
}
function readChoice() {
  try {
    return localStorage.getItem("suerte-ads-choice");
  } catch {
    return "denied";
  }
}
export function AdProvider() {
  const [choice, setChoice] = useState<string | null>("pending");
  useEffect(() => {
    setChoice(readChoice());
  }, []);
  function choose(value: string) {
    try {
      localStorage.setItem("suerte-ads-choice", value);
    } catch {
      /* ads stay disabled without storage */
    }
    setChoice(value);
    window.dispatchEvent(new Event("suerte-consent"));
    if (value === "denied") window.location.reload();
  }
  if (!validClient) return null;
  return (
    <>
      {choice === "accepted" && (
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}
          crossOrigin="anonymous"
          strategy="lazyOnload"
          onReady={() => {
            const queue = (window.adsbygoogle = window.adsbygoogle || []);
            queue.requestNonPersonalizedAds = 1;
            window.dispatchEvent(new Event("suerte-ads-ready"));
          }}
        />
      )}
      {!choice && (
        <aside
          className="cookie-banner"
          aria-label="Preferencias de publicidad"
        >
          <Cookie size={24} weight="duotone" />
          <div>
            <strong>Publicidad y vistas</strong>
            <p>
              Una cookie cuenta las vistas de cada sorteo. También puedes permitir anuncios no personalizados de Google para ayudar a mantener gratuita la web.{" "}
              <Link href="/privacidad">Ver privacidad</Link>.
            </p>
          </div>
          <button
            className="button button-outline"
            onClick={() => choose("denied")}
          >
            Sin anuncios
          </button>
          <button
            className="button button-dark"
            onClick={() => choose("accepted")}
          >
            Permitir anuncios
          </button>
        </aside>
      )}
      <button
        className="cookie-settings"
        onClick={() => setChoice(null)}
        aria-label="Configurar cookies"
      >
        <SlidersHorizontal size={17} weight="duotone" />
      </button>
    </>
  );
}
export function AdSlot({
  position = "top",
}: {
  position?: "top" | "sidebar" | "bottom";
}) {
  const slot = {
    top: process.env.NEXT_PUBLIC_ADSENSE_TOP_SLOT,
    sidebar: process.env.NEXT_PUBLIC_ADSENSE_SIDEBAR_SLOT,
    bottom: process.env.NEXT_PUBLIC_ADSENSE_BOTTOM_SLOT,
  }[position];
  const [enabled, setEnabled] = useState(false);
  const pushed = useRef(false);
  useEffect(() => {
    const sync = () =>
      setEnabled(validClient && !!slot && readChoice() === "accepted");
    sync();
    window.addEventListener("suerte-consent", sync);
    return () => window.removeEventListener("suerte-consent", sync);
  }, [slot]);
  useEffect(() => {
    const push = () => {
      if (enabled && !pushed.current) {
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          pushed.current = true;
        } catch {
          /* An ad blocker must never break the checker. */
        }
      }
    };
    push();
    window.addEventListener("suerte-ads-ready", push);
    return () => window.removeEventListener("suerte-ads-ready", push);
  }, [enabled]);
  return (
    <aside
      className={`ad-slot ad-${position}`}
      aria-label="Espacio publicitario"
    >
      <span className="ad-label">PUBLICIDAD</span>
      {enabled ? (
        <ins
          className="adsbygoogle"
          style={{
            display: "block",
            minHeight: position === "sidebar" ? 250 : 90,
          }}
          data-ad-client={client}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      ) : (
        <div className="ad-placeholder">
          <span>Un espacio para conectar con Panamá</span>
          <span>
            {position === "sidebar" ? "300 × 250" : "ESPACIO PUBLICITARIO"}
          </span>
        </div>
      )}
    </aside>
  );
}
