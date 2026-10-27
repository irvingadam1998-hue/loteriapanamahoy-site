import { NextResponse } from "next/server";
import { getDraws, StorageError } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Public mobile API: expose only published draw information. */
export async function GET() {
  try {
    const draws = await getDraws();
    const published = draws
      .filter((draw) => draw.status === "published")
      .map((draw) => ({
        id: draw.id,
        kind: draw.kind,
        title: draw.title,
        number: draw.number,
        date: draw.date,
        time: draw.time,
        status: draw.status,
        first: draw.first,
        second: draw.second,
        third: draw.third,
        letters: draw.letters,
        series: draw.series,
        folio: draw.folio,
        billDigits: draw.billDigits,
        rulesVerified: draw.rulesVerified,
        sourceUrl: draw.sourceUrl,
        isDemo: draw.isDemo,
        views: draw.views || 0,
        requiresLetters: draw.rules.some(
          (rule) => rule.ticket === "billete" && rule.match === "letters",
        ),
        requiresSeriesFolio: draw.rules.some(
          (rule) => rule.ticket === "billete" && rule.match === "series-folio",
        ),
      }));

    return NextResponse.json(published, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof StorageError
            ? "No se pudieron cargar los resultados. Inténtalo de nuevo más tarde."
            : "No se pudieron cargar los resultados.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
