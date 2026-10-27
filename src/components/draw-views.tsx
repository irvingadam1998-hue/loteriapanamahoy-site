"use client";

import { useEffect, useRef, useState } from "react";

export function DrawViews({ id, initialViews }: { id: string; initialViews: number }) {
  const [views, setViews] = useState(initialViews);
  const requested = useRef(false);

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;
    fetch(`/api/draws/${encodeURIComponent(id)}/views`, { method: "POST", cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<{views: number}> : null)
      .then((result) => { if (result) setViews(result.views); })
      .catch(() => undefined);
  }, [id]);

  return <span className="badge badge-soft badge-sm draw-views" aria-live="polite">{new Intl.NumberFormat("es-PA").format(views)} {views === 1 ? "vista" : "vistas"}</span>;
}
