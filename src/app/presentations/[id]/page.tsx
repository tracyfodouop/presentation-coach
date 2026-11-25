import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import {
  addSlide,
  deleteSlide,
  duplicateSlide,
} from "@/features/slides/actions";

async function PresentationView({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const presentation = await prisma.presentation.findUnique({
    where: { id },
    include: { slides: { orderBy: { position: "asc" } } },
  });
  if (!presentation) notFound();

  const onlyOne = presentation.slides.length <= 1;

  return (
    <main className="mx-auto max-w-5xl p-6">
      <Link href="/dashboard" className="text-sm text-gray-500 hover:underline">
        ← Retour aux présentations
      </Link>

      <div className="mt-2 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{presentation.title}</h1>
        <form action={addSlide.bind(null, presentation.id)}>
          <button
            type="submit"
            className="rounded-lg bg-black px-4 py-2 font-medium text-white"
          >
            Ajouter une diapositive
          </button>
        </form>
      </div>

      <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {presentation.slides.map((slide, index) => (
          <li key={slide.id}>
            <Link
              href={`/presentations/${presentation.id}/slides/${slide.id}`}
              className="flex aspect-video items-center justify-center rounded-lg border border-gray-300 bg-white text-3xl font-semibold text-gray-300 shadow-sm hover:border-gray-500"
            >
              {index + 1}
            </Link>
            <div className="mt-2 flex gap-2 text-sm">
              <form action={duplicateSlide.bind(null, slide.id)}>
                <button
                  type="submit"
                  className="rounded border border-gray-300 px-3 py-1 hover:bg-gray-50"
                >
                  Dupliquer
                </button>
              </form>
              <form action={deleteSlide.bind(null, slide.id)}>
                <button
                  type="submit"
                  disabled={onlyOne}
                  className="rounded border border-gray-300 px-3 py-1 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Supprimer
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}

export default function PresentationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<p className="p-6 text-gray-500">Chargement…</p>}>
      <PresentationView params={params} />
    </Suspense>
  );
}
