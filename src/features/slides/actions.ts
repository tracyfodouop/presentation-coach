"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";

function refresh(presentationId: string) {
  revalidatePath(`/presentations/${presentationId}`);
  revalidatePath("/dashboard");
}

export async function addSlide(presentationId: string) {
  const last = await prisma.slide.findFirst({
    where: { presentationId },
    orderBy: { position: "desc" },
  });

  await prisma.$transaction([
    prisma.slide.create({
      data: { presentationId, position: (last?.position ?? -1) + 1 },
    }),
    prisma.presentation.update({
      where: { id: presentationId },
      data: { revision: { increment: 1 } },
    }),
  ]);

  refresh(presentationId);
}

export async function deleteSlide(slideId: string) {
  const slide = await prisma.slide.findUnique({ where: { id: slideId } });
  if (!slide) return;

  const count = await prisma.slide.count({
    where: { presentationId: slide.presentationId },
  });
  if (count <= 1) return;

  await prisma.$transaction([
    prisma.slide.delete({ where: { id: slideId } }),
    prisma.slide.updateMany({
      where: {
        presentationId: slide.presentationId,
        position: { gt: slide.position },
      },
      data: { position: { decrement: 1 } },
    }),
    prisma.presentation.update({
      where: { id: slide.presentationId },
      data: { revision: { increment: 1 } },
    }),
  ]);

  refresh(slide.presentationId);
}

export async function duplicateSlide(slideId: string) {
  const slide = await prisma.slide.findUnique({
    where: { id: slideId },
    include: { elements: true },
  });
  if (!slide) return;

  await prisma.$transaction([
    prisma.slide.updateMany({
      where: {
        presentationId: slide.presentationId,
        position: { gt: slide.position },
      },
      data: { position: { increment: 1 } },
    }),
    prisma.slide.create({
      data: {
        presentationId: slide.presentationId,
        position: slide.position + 1,
        notes: slide.notes,
        background: slide.background,
        elements: {
          create: slide.elements.map((e) => ({
            type: e.type,
            x: e.x,
            y: e.y,
            width: e.width,
            height: e.height,
            rotation: e.rotation,
            zIndex: e.zIndex,
            props: e.props as Prisma.InputJsonValue,
            assetId: e.assetId,
          })),
        },
      },
    }),
    prisma.presentation.update({
      where: { id: slide.presentationId },
      data: { revision: { increment: 1 } },
    }),
  ]);

  refresh(slide.presentationId);
}
