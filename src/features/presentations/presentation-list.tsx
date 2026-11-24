import { prisma } from "@/lib/db/prisma";

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
          <h2 className="font-semibold">{p.title}</h2>
          <p className="mt-1 text-sm text-gray-500">
            {p._count.slides} diapositive{p._count.slides > 1 ? "s" : ""}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Modifiée le {p.updatedAt.toLocaleDateString("fr-FR")}
          </p>
        </li>
      ))}
    </ul>
  );
}


