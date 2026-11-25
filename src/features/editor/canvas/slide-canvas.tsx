"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Stage, Layer, Rect, Text, Image as KonvaImage } from "react-konva";
import { saveSlide } from "@/features/slides/editor-actions";

const SLIDE_WIDTH = 1920;
const SLIDE_HEIGHT = 1080;

const THEMES = [
  { name: "Océan", background: "#0f2a4a", text: "#ffffff", accent: "#38bdf8" },
  { name: "Soleil", background: "#fff7e6", text: "#3b2300", accent: "#f59e0b" },
  { name: "Forêt", background: "#12372a", text: "#f4f1de", accent: "#7ac74f" },
  { name: "Rose", background: "#ffe4ec", text: "#4a0d2b", accent: "#e11d74" },
];

type Theme = (typeof THEMES)[number];

export type El = {
  id: string;
  type: "text" | "rect" | "image" | "video";
  x: number;
  y: number;
  text: string;
  fontSize: number;
  width: number;
  height: number;
  fill: string;
  src?: string;
};

type Snapshot = {
  background: string;
  elements: El[];
};

type Props = {
  slideId?: string;
  initialBackground?: string | null;
  initialElements?: El[];
};

const base = { text: "", fontSize: 0, width: 0, height: 0 };

function defaultElements(theme: Theme): El[] {
  return [
    { ...base, id: "title", type: "text", x: 160, y: 380, text: "Titre de la diapositive", fontSize: 110, fill: theme.text },
    { ...base, id: "line", type: "rect", x: 160, y: 530, width: 320, height: 12, fill: theme.accent },
    { ...base, id: "subtitle", type: "text", x: 160, y: 580, text: "Sous-titre ou idée principale", fontSize: 52, fill: theme.text },
  ];
}

function cloneElements(list: El[]): El[] {
  return list.map((e) => ({ ...e }));
}

function resizeImageFile(file: File, maxWidth = 1280): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const ratio = img.width > maxWidth ? maxWidth / img.width : 1;
        const w = Math.max(1, Math.round(img.width * ratio));
        const h = Math.max(1, Math.round(img.height * ratio));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(String(reader.result ?? ""));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = reject;
      img.src = String(reader.result ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function CanvasImage({
  el,
  isSelected,
  onSelect,
  onMove,
}: {
  el: El;
  isSelected: boolean;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
}) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!el.src) {
      setImg(null);
      return;
    }
    const image = new window.Image();
    if (!el.src.startsWith("data:")) {
      image.crossOrigin = "anonymous";
    }
    image.onload = () => setImg(image);
    image.onerror = () => setImg(null);
    image.src = el.src;
  }, [el.src]);

  if (!img) {
    return (
      <Rect
        x={el.x}
        y={el.y}
        width={el.width}
        height={el.height}
        fill="#e5e7eb"
        stroke={isSelected ? "#2563eb" : "#9ca3af"}
        strokeWidth={isSelected ? 6 : 2}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragStart={onSelect}
        onDragEnd={(e) => onMove(e.target.x(), e.target.y())}
      />
    );
  }

  return (
    <KonvaImage
      image={img}
      x={el.x}
      y={el.y}
      width={el.width}
      height={el.height}
      stroke={isSelected ? "#2563eb" : undefined}
      strokeWidth={isSelected ? 6 : 0}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragStart={onSelect}
      onDragEnd={(e) => onMove(e.target.x(), e.target.y())}
    />
  );
}

export default function SlideCanvas({ slideId, initialBackground, initialElements }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [scale, setScale] = useState(0.4);
  const [background, setBackground] = useState(initialBackground ?? THEMES[0].background);
  const [elements, setElements] = useState<El[]>(() =>
    initialElements && initialElements.length > 0 ? initialElements : defaultElements(THEMES[0]),
  );
  const [accent, setAccent] = useState(
    () => initialElements?.find((e) => e.type === "rect")?.fill ?? THEMES[0].accent,
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [past, setPast] = useState<Snapshot[]>([]);
  const [future, setFuture] = useState<Snapshot[]>([]);

  function commit(nextBg: string, nextElements: El[]) {
    setPast((prev) => [...prev.slice(-49), { background, elements: cloneElements(elements) }]);
    setFuture([]);
    setBackground(nextBg);
    setElements(nextElements);
    setStatus("idle");
  }

  const undo = useCallback(() => {
    setPast((prev) => {
      if (prev.length === 0) return prev;
      const previous = prev[prev.length - 1];
      setFuture((f) => [{ background, elements: cloneElements(elements) }, ...f.slice(0, 49)]);
      setBackground(previous.background);
      setElements(cloneElements(previous.elements));
      setSelectedId((curr) =>
        curr && previous.elements.some((e) => e.id === curr) ? curr : null,
      );
      setStatus("idle");
      return prev.slice(0, -1);
    });
  }, [background, elements]);

  const redo = useCallback(() => {
    setFuture((prev) => {
      if (prev.length === 0) return prev;
      const next = prev[0];
      setPast((p) => [...p.slice(-49), { background, elements: cloneElements(elements) }]);
      setBackground(next.background);
      setElements(cloneElements(next.elements));
      setSelectedId((curr) =>
        curr && next.elements.some((e) => e.id === curr) ? curr : null,
      );
      setStatus("idle");
      return prev.slice(1);
    });
  }, [background, elements]);

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

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (isInput) return;

      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;

      if (e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey)) {
        e.preventDefault();
        redo();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo]);

  const selected = elements.find((e) => e.id === selectedId) ?? null;

  function update(id: string, patch: Partial<El>) {
    const next = elements.map((e) => (e.id === id ? { ...e, ...patch } : e));
    commit(background, next);
  }

  function applyTheme(theme: Theme) {
    setAccent(theme.accent);
    const next = elements.map((e) => ({
      ...e,
      fill: e.type === "text" ? theme.text : e.type === "rect" ? theme.accent : e.fill,
    }));
    commit(theme.background, next);
  }

  function addText() {
    const id = crypto.randomUUID();
    const color = elements.find((e) => e.type === "text")?.fill ?? "#111111";
    const next: El[] = [
      ...elements,
      { ...base, id, type: "text", x: 300, y: 300, text: "Nouveau texte", fontSize: 72, fill: color },
    ];
    commit(background, next);
    setSelectedId(id);
  }

  function addRect() {
    const id = crypto.randomUUID();
    const next: El[] = [
      ...elements,
      { ...base, id, type: "rect", x: 400, y: 400, width: 400, height: 240, fill: accent },
    ];
    commit(background, next);
    setSelectedId(id);
  }

  function addImageUrl() {
    const url = window.prompt("URL de l'image (https://...):");
    if (!url || !url.trim()) return;
    const id = crypto.randomUUID();
    const next: El[] = [
      ...elements,
      { ...base, id, type: "image", x: 500, y: 260, width: 640, height: 360, fill: "#ffffff", src: url.trim() },
    ];
    commit(background, next);
    setSelectedId(id);
  }

  async function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const dataUrl = await resizeImageFile(file);
    const id = crypto.randomUUID();
    const next: El[] = [
      ...elements,
      { ...base, id, type: "image", x: 500, y: 260, width: 640, height: 360, fill: "#ffffff", src: dataUrl },
    ];
    commit(background, next);
    setSelectedId(id);
  }

  function addVideoUrl() {
    const url = window.prompt("URL de la vidéo (.mp4, .webm, etc.):");
    if (!url || !url.trim()) return;
    const id = crypto.randomUUID();
    const next: El[] = [
      ...elements,
      { ...base, id, type: "video", x: 480, y: 240, width: 720, height: 405, fill: "#000000", src: url.trim() },
    ];
    commit(background, next);
    setSelectedId(id);
  }

  function handleVideoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const blobUrl = URL.createObjectURL(file);
    const id = crypto.randomUUID();
    const next: El[] = [
      ...elements,
      { ...base, id, type: "video", x: 480, y: 240, width: 720, height: 405, fill: "#000000", src: blobUrl },
    ];
    commit(background, next);
    setSelectedId(id);
  }

  function removeSelected() {
    if (!selectedId) return;
    const next = elements.filter((e) => e.id !== selectedId);
    commit(background, next);
    setSelectedId(null);
  }

  async function handleSave() {
    if (!slideId) return;
    setStatus("saving");
    try {
      const result = await saveSlide(slideId, background, elements);
      setStatus(result.ok ? "saved" : "error");
    } catch {
      setStatus("error");
    }
  }

  const videos = elements.filter((e) => e.type === "video");

  return (
    <div>
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageFile}
        className="hidden"
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        onChange={handleVideoFile}
        className="hidden"
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={undo}
          disabled={past.length === 0}
          title="Annuler (Ctrl+Z)"
          className="rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ↶ Annuler
        </button>
        <button
          type="button"
          onClick={redo}
          disabled={future.length === 0}
          title="Rétablir (Ctrl+Y)"
          className="rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ↷ Rétablir
        </button>
        <span className="text-gray-300">|</span>
        <button type="button" onClick={addText} className="rounded-lg bg-black px-3 py-1 text-sm font-medium text-white">
          + Texte
        </button>
        <button type="button" onClick={addRect} className="rounded-lg bg-black px-3 py-1 text-sm font-medium text-white">
          + Rectangle
        </button>
        <button type="button" onClick={addImageUrl} className="rounded-lg bg-black px-3 py-1 text-sm font-medium text-white">
          + Image URL
        </button>
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          className="rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
        >
          📁 Image PC
        </button>
        <button type="button" onClick={addVideoUrl} className="rounded-lg bg-black px-3 py-1 text-sm font-medium text-white">
          + Vidéo URL
        </button>
        <button
          type="button"
          onClick={() => videoInputRef.current?.click()}
          className="rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
        >
          🎬 Vidéo PC
        </button>
        <span className="text-gray-300">|</span>
        {THEMES.map((theme) => (
          <button
            key={theme.name}
            type="button"
            onClick={() => applyTheme(theme)}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
          >
            <span className="inline-block h-4 w-4 rounded-full border border-gray-300" style={{ backgroundColor: theme.accent }} />
            {theme.name}
          </button>
        ))}
        <label className="flex items-center gap-2 text-sm">
          Fond
          <input
            type="color"
            value={background}
            onChange={(e) => commit(e.target.value, elements)}
          />
        </label>
        {slideId && (
          <div className="ml-auto flex items-center gap-3">
            {status === "saved" && <span className="text-sm text-green-600">Enregistré ✓</span>}
            {status === "error" && <span className="text-sm text-red-600">Échec de l’enregistrement</span>}
            <button
              type="button"
              onClick={handleSave}
              disabled={status === "saving"}
              className="rounded-lg bg-blue-600 px-4 py-1 text-sm font-medium text-white disabled:opacity-50"
            >
              {status === "saving" ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        )}
      </div>

      {selected ? (
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm">
          {selected.type === "text" && (
            <>
              <input
                value={selected.text}
                onChange={(e) => update(selected.id, { text: e.target.value })}
                className="min-w-[220px] flex-1 rounded border border-gray-300 px-2 py-1"
              />
              <label className="flex items-center gap-2">
                Taille
                <input
                  type="range"
                  min={30}
                  max={200}
                  value={selected.fontSize}
                  onChange={(e) => update(selected.id, { fontSize: Number(e.target.value) })}
                />
              </label>
            </>
          )}
          {(selected.type === "image" || selected.type === "video") && (
            <input
              value={selected.src ?? ""}
              onChange={(e) => update(selected.id, { src: e.target.value })}
              placeholder={selected.type === "image" ? "URL ou image" : "URL de la vidéo"}
              className="min-w-[260px] flex-1 rounded border border-gray-300 px-2 py-1"
            />
          )}
          {selected.type !== "image" && selected.type !== "video" && (
            <label className="flex items-center gap-2">
              Couleur
              <input type="color" value={selected.fill} onChange={(e) => update(selected.id, { fill: e.target.value })} />
            </label>
          )}
          <button type="button" onClick={removeSelected} className="rounded border border-red-300 px-3 py-1 text-red-600 hover:bg-red-50">
            Supprimer
          </button>
        </div>
      ) : (
        <p className="mb-3 text-sm text-gray-500">Clique sur un élément pour le modifier.</p>
      )}

      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-lg border border-gray-300 shadow-md"
        style={{ aspectRatio: "16 / 9" }}
      >
        <Stage width={SLIDE_WIDTH * scale} height={SLIDE_HEIGHT * scale} scaleX={scale} scaleY={scale}>
          <Layer>
            <Rect
              width={SLIDE_WIDTH}
              height={SLIDE_HEIGHT}
              fill={background}
              onClick={() => setSelectedId(null)}
              onTap={() => setSelectedId(null)}
            />
            {elements.map((el) =>
              el.type === "text" ? (
                <Text
                  key={el.id}
                  x={el.x}
                  y={el.y}
                  text={el.text}
                  fontSize={el.fontSize}
                  fontStyle={el.fontSize >= 100 ? "bold" : "normal"}
                  fill={el.fill}
                  textDecoration={el.id === selectedId ? "underline" : ""}
                  draggable
                  onClick={() => setSelectedId(el.id)}
                  onTap={() => setSelectedId(el.id)}
                  onDragStart={() => setSelectedId(el.id)}
                  onDragEnd={(e) => update(el.id, { x: e.target.x(), y: e.target.y() })}
                />
              ) : el.type === "image" ? (
                <CanvasImage
                  key={el.id}
                  el={el}
                  isSelected={el.id === selectedId}
                  onSelect={() => setSelectedId(el.id)}
                  onMove={(x, y) => update(el.id, { x, y })}
                />
              ) : el.type === "video" ? (
                <Rect
                  key={el.id}
                  x={el.x}
                  y={el.y}
                  width={el.width}
                  height={el.height}
                  fill="rgba(0,0,0,0.01)"
                  stroke={el.id === selectedId ? "#2563eb" : undefined}
                  strokeWidth={el.id === selectedId ? 6 : 0}
                  draggable
                  onClick={() => setSelectedId(el.id)}
                  onTap={() => setSelectedId(el.id)}
                  onDragStart={() => setSelectedId(el.id)}
                  onDragEnd={(e) => update(el.id, { x: e.target.x(), y: e.target.y() })}
                />
              ) : (
                <Rect
                  key={el.id}
                  x={el.x}
                  y={el.y}
                  width={el.width}
                  height={el.height}
                  fill={el.fill}
                  stroke={el.id === selectedId ? "#2563eb" : undefined}
                  strokeWidth={el.id === selectedId ? 6 : 0}
                  draggable
                  onClick={() => setSelectedId(el.id)}
                  onTap={() => setSelectedId(el.id)}
                  onDragStart={() => setSelectedId(el.id)}
                  onDragEnd={(e) => update(el.id, { x: e.target.x(), y: e.target.y() })}
                />
              ),
            )}
          </Layer>
        </Stage>

        {videos.map((v) =>
          v.src ? (
            <video
              key={v.id}
              src={v.src}
              controls
              onClick={() => setSelectedId(v.id)}
              style={{
                position: "absolute",
                left: `${v.x * scale}px`,
                top: `${v.y * scale}px`,
                width: `${v.width * scale}px`,
                height: `${v.height * scale}px`,
                objectFit: "cover",
                border: v.id === selectedId ? "3px solid #2563eb" : "none",
              }}
            />
          ) : null,
        )}
      </div>
    </div>
  );
}
