import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { deletePresentation, renamePresentation } from "./actions";
import DeleteButton from "./delete-button";

export async function PresentationList() {
  const presentations = await prisma.presentation.findMany({
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { slides: true } } },
  });

  if (presentations.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500">
        Aucune présentation pour le moment. Créez la première ci-dessus.
      </p>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {presentations.map((p) => (
        <li key={p.id} className="rounded-lg border border-gray-200 p-4 shadow-sm">
          <Link href={`/presentations/${p.id}`} className="block hover:underline">
            <h2 className="font-semibold">{p.title}</h2>
            <p className="mt-1 text-sm text-gray-500">
              {p._count.slides} diapositive{p._count.slides > 1 ? "s" : ""}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Modifiée le {p.updatedAt.toLocaleDateString("fr-FR")}
            </p>
          </Link>

          <form action={renamePresentation.bind(null, p.id)} className="mt-3 flex gap-2">
            <input
              name="title"
              defaultValue={p.title}
              maxLength={120}
              className="min-w-0 flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
            />
            <button
              type="submit"
              className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
            >
              Renommer
            </button>
          </form>

          <form action={deletePresentation.bind(null, p.id)} className="mt-2">
            <DeleteButton />
          </form>
        </li>
      ))}
    </ul>
  );
}
