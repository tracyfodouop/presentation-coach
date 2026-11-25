"use client";

import { useEffect, useRef, useState } from "react";
import { Stage, Layer, Rect, Text, Group } from "react-konva";

const SLIDE_WIDTH = 1920;
const SLIDE_HEIGHT = 1080;

const THEMES = [
  { name: "Océan", background: "#0f2a4a", text: "#ffffff", accent: "#38bdf8" },
  { name: "Soleil", background: "#fff7e6", text: "#3b2300", accent: "#f59e0b" },
  { name: "Forêt", background: "#12372a", text: "#f4f1de", accent: "#7ac74f" },
  { name: "Rose", background: "#ffe4ec", text: "#4a0d2b", accent: "#e11d74" },
];

export default function SlideCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);
  const [position, setPosition] = useState({ x: 160, y: 380 });
  const [background, setBackground] = useState(THEMES[0].background);
  const [textColor, setTextColor] = useState(THEMES[0].text);
  const [accent, setAccent] = useState(THEMES[0].accent);

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

  function applyTheme(theme: (typeof THEMES)[number]) {
    setBackground(theme.background);
    setTextColor(theme.text);
    setAccent(theme.accent);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {THEMES.map((theme) => (
          <button
            key={theme.name}
            type="button"
            onClick={() => applyTheme(theme)}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
          >
            <span
              className="inline-block h-4 w-4 rounded-full border border-gray-300"
              style={{ backgroundColor: theme.accent }}
            />
            {theme.name}
          </button>
        ))}

        <label className="flex items-center gap-2 text-sm">
          Fond
          <input
            type="color"
            value={background}
            onChange={(e) => setBackground(e.target.value)}
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          Texte
          <input
            type="color"
            value={textColor}
            onChange={(e) => setTextColor(e.target.value)}
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          Accent
          <input
            type="color"
            value={accent}
            onChange={(e) => setAccent(e.target.value)}
          />
        </label>
      </div>

      <div
        ref={containerRef}
        className="w-full overflow-hidden rounded-lg border border-gray-300 shadow-md"
        style={{ aspectRatio: "16 / 9" }}
      >
        <Stage
          width={SLIDE_WIDTH * scale}
          height={SLIDE_HEIGHT * scale}
          scaleX={scale}
          scaleY={scale}
        >
          <Layer>
            <Rect width={SLIDE_WIDTH} height={SLIDE_HEIGHT} fill={background} />
            <Rect width={48} height={SLIDE_HEIGHT} fill={accent} />
            <Group
              x={position.x}
              y={position.y}
              draggable
              onDragEnd={(e) =>
                setPosition({ x: e.target.x(), y: e.target.y() })
              }
            >
              <Text
                text="Titre de la diapositive"
                fontSize={110}
                fontStyle="bold"
                fill={textColor}
              />
              <Rect y={140} width={320} height={12} fill={accent} />
              <Text
                text="Sous-titre ou idée principale"
                y={190}
                fontSize={52}
                fill={textColor}
                opacity={0.8}
              />
            </Group>
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
