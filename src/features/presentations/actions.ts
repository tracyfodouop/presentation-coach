"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";

const DEMO_EMAIL = "demo@presentation-coach.local";

export async function createPresentation(formData: FormData) {
  const rawTitle = String(formData.get("title") ?? "").trim().slice(0, 120);
  const title = rawTitle || "Présentation sans titre";

  const owner = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: { email: DEMO_EMAIL, name: "Utilisateur démo" },
  });

  await prisma.presentation.create({
    data: {
      title,
      ownerId: owner.id,
      slides: { create: { position: 0 } },
    },
  });

  revalidatePath("/dashboard");
}
