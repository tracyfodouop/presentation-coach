import { Suspense } from "react";
import { createPresentation } from "@/features/presentations/actions";
import { PresentationList } from "@/features/presentations/presentation-list";

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-bold">Mes présentations</h1>

      <form action={createPresentation} className="my-6 flex gap-2">
        <input
          name="title"
          placeholder="Titre de la présentation"
          maxLength={120}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
        />
        <button
          type="submit"
          className="rounded-lg bg-black px-4 py-2 font-medium text-white"
        >
          Nouvelle présentation
        </button>
      </form>

      <Suspense fallback={<p className="text-gray-500">Chargement…</p>}>
        <PresentationList />
      </Suspense>
    </main>
  );
}
