import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import SlideEditor from "@/features/editor/canvas/slide-editor";

async function EditorLoader({
  params,
}: {
  params: Promise<{ id: string; slideId: string }>;
}) {
  const { id, slideId } = await params;

  const slide = await prisma.slide.findFirst({
    where: { id: slideId, presentationId: id },
    include: { elements: { orderBy: { zIndex: "asc" } } },
  });
  if (!slide) notFound();

  const elements = slide.elements.map((e) => {
    const p = (e.props ?? {}) as { text?: string; fontSize?: number; fill?: string };
    return {
      id: e.id,
      type: e.type === "TEXT" ? ("text" as const) : ("rect" as const),
      x: e.x,
      y: e.y,
      width: e.width,
      height: e.height,
      text: p.text ?? "",
      fontSize: p.fontSize ?? 0,
      fill: p.fill ?? "#000000",
    };
  });

  return (
    <main className="mx-auto max-w-5xl p-6">
      <Link href={`/presentations/${id}`} className="text-sm text-gray-500 hover:underline">
        ← Retour aux diapositives
      </Link>
      <h1 className="mb-4 mt-2 text-2xl font-bold">Éditeur</h1>
      <SlideEditor
        slideId={slide.id}
        initialBackground={slide.background}
        initialElements={elements}
      />
    </main>
  );
}

export default function SlideEditorPage({
  params,
}: {
  params: Promise<{ id: string; slideId: string }>;
}) {
  return (
    <Suspense fallback={<p className="p-6 text-gray-500">Chargement…</p>}>
      <EditorLoader params={params} />
    </Suspense>
  );
}
