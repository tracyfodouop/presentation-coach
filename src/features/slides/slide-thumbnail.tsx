type PreviewElement = {
  id: string;
  type: "TEXT" | "SHAPE" | string;
  x: number;
  y: number;
  width: number;
  height: number;
  props: unknown;
};

type SlideThumbnailProps = {
  index: number;
  background: string | null;
  elements: PreviewElement[];
};

const SLIDE_W = 1920;
const SLIDE_H = 1080;

export default function SlideThumbnail({
  index,
  background,
  elements,
}: SlideThumbnailProps) {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-gray-300 shadow-sm transition group-hover:border-gray-500">
      <div
        className="relative origin-top-left"
        style={{
          width: `${SLIDE_W}px`,
          height: `${SLIDE_H}px`,
          backgroundColor: background ?? "#ffffff",
          transform: "scale(0.16)",
        }}
      >
        {elements.map((el) => {
          const p = (el.props ?? {}) as {
            text?: string;
            fontSize?: number;
            fill?: string;
          };
          const fill = p.fill ?? "#000000";

          if (el.type === "TEXT") {
            return (
              <div
                key={el.id}
                style={{
                  position: "absolute",
                  left: `${el.x}px`,
                  top: `${el.y}px`,
                  fontSize: `${p.fontSize ?? 40}px`,
                  fontWeight: (p.fontSize ?? 0) >= 100 ? 700 : 400,
                  color: fill,
                  lineHeight: 1.15,
                  whiteSpace: "pre-wrap",
                }}
              >
                {p.text ?? ""}
              </div>
            );
          }

          return (
            <div
              key={el.id}
              style={{
                position: "absolute",
                left: `${el.x}px`,
                top: `${el.y}px`,
                width: `${el.width}px`,
                height: `${el.height}px`,
                backgroundColor: fill,
              }}
            />
          );
        })}
      </div>

      <span className="absolute bottom-2 right-2 rounded bg-black/65 px-2 py-0.5 text-xs font-semibold text-white">
        {index + 1}
      </span>
    </div>
  );
}
