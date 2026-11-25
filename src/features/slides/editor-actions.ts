"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";

type SavedElement = {
  type: "text" | "rect";
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontSize: number;
  fill: string;
};

const COLOR = /^#[0-9a-fA-F]{6}$/;

function num(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export async function saveSlide(
  slideId: string,
  background: string,
  elements: SavedElement[],
) {
  if (!Array.isArray(elements) || elements.length > 200) {
    return { ok: false as const };
  }

  const slide = await prisma.slide.findUnique({ where: { id: slideId } });
  if (!slide) return { ok: false as const };

  await prisma.$transaction([
    prisma.slideElement.deleteMany({ where: { slideId } }),
    prisma.slide.update({
      where: { id: slideId },
      data: {
        background: COLOR.test(background) ? background : "#ffffff",
        elements: {
          create: elements.map((e, index) => ({
            type: e.type === "text" ? ("TEXT" as const) : ("SHAPE" as const),
            x: num(e.x),
            y: num(e.y),
            width: num(e.width),
            height: num(e.height),
            zIndex: index,
            props: {
              text: String(e.text ?? "").slice(0, 2000),
              fontSize: num(e.fontSize),
              fill: COLOR.test(e.fill) ? e.fill : "#000000",
            },
          })),
        },
      },
    }),
    prisma.presentation.update({
      where: { id: slide.presentationId },
      data: { revision: { increment: 1 } },
    }),
  ]);

  revalidatePath(`/presentations/${slide.presentationId}`);
  return { ok: true as const };
}
