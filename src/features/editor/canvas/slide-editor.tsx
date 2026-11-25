"use client";

import dynamic from "next/dynamic";
import type { El } from "./slide-canvas";

const SlideCanvas = dynamic(() => import("./slide-canvas"), { ssr: false });

export default function SlideEditor(props: {
  slideId: string;
  initialBackground: string | null;
  initialElements: El[];
}) {
  return <SlideCanvas {...props} />;
}
