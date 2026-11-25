"use client";

import { useEffect, useRef, useState } from "react";
import { Stage, Layer, Rect, Text } from "react-konva";

const SLIDE_WIDTH = 1920;
const SLIDE_HEIGHT = 1080;

export default function SlideCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);
  const [position, setPosition] = useState({ x: 200, y: 200 });

  useEffect(() => {
    function resize() {
      if (containerRef.current) {
        setScale(containerRef.current.offsetWidth / SLIDE_WIDTH);
      }
    }
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden rounded-lg border border-gray-300 shadow-sm"
      style={{ aspectRatio: "16 / 9" }}
    >
      <Stage
        width={SLIDE_WIDTH * scale}
        height={SLIDE_HEIGHT * scale}
        scaleX={scale}
        scaleY={scale}
      >
        <Layer>
          <Rect width={SLIDE_WIDTH} height={SLIDE_HEIGHT} fill="#ffffff" />
          <Text
            text="Titre de la diapositive"
            x={position.x}
            y={position.y}
            fontSize={96}
            fontStyle="bold"
            fill="#111111"
            draggable
            onDragEnd={(e) => setPosition({ x: e.target.x(), y: e.target.y() })}
          />
        </Layer>
      </Stage>
    </div>
  );
}
