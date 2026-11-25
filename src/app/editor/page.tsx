"use client";

import dynamic from "next/dynamic";

const SlideCanvas = dynamic(
  () => import("@/features/editor/canvas/slide-canvas"),
  { ssr: false },
);

export default function EditorPage() {
  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="mb-4 text-2xl font-bold">Éditeur</h1>
      <SlideCanvas />
    </main>
  );
}
