import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { analyzePresentation } from "@/features/coach/analyze";

async function CoachView({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const presentation = await prisma.presentation.findUnique({
    where: { id },
    include: {
      slides: {
        orderBy: { position: "asc" },
        include: { elements: { orderBy: { zIndex: "asc" } } },
      },
    },
  });
  if (!presentation) notFound();

  const result = analyzePresentation(
    presentation.slides.map((s) => ({
      background: s.background,
      elements: s.elements.map((e) => {
        const p = (e.props ?? {}) as { text?: string; fontSize?: number; fill?: string };
        return {
          type: e.type === "TEXT" ? ("text" as const) : ("rect" as const),
          text: p.text ?? "",
          fontSize: p.fontSize ?? 0,
          fill: p.fill ?? "#000000",
        };
      }),
    })),
  );

  const color =
    result.score >= 85
      ? "text-green-600"
      : result.score >= 70
        ? "text-lime-600"
        : result.score >= 50
          ? "text-orange-500"
          : "text-red-600";

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Link
        href={`/presentations/${presentation.id}`}
        className="text-sm text-gray-500 hover:underline"
      >
        ← Retour à la présentation
      </Link>

      <h1 className="mt-2 text-2xl font-bold">Coach : {presentation.title}</h1>

      <div className="my-6 flex items-center gap-6 rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className={`text-6xl font-bold ${color}`}>
          {result.score}
          <span className="text-2xl text-gray-400">/100</span>
        </div>
        <p className={`text-xl font-semibold ${color}`}>{result.label}</p>
      </div>

      <ul className="space-y-3">
        {result.tips.map((tip, i) => (
          <li
            key={i}
            className={`rounded-lg border p-3 text-sm ${
              tip.level === "good"
                ? "border-green-200 bg-green-50 text-green-900"
                : "border-orange-200 bg-orange-50 text-orange-900"
            }`}
          >
            <span className="mr-2 font-bold">{tip.level === "good" ? "✓" : "!"}</span>
            {tip.text}
          </li>
        ))}
      </ul>
    </main>
  );
}

export default function CoachPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<p className="p-6 text-gray-500">Analyse en cours…</p>}>
      <CoachView params={params} />
    </Suspense>
  );
}
