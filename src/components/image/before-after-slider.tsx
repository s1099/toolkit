import { ChevronsLeftRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type BeforeAfterSliderProps = {
  beforeSrc: string;
  afterSrc: string;
  initialPosition?: number; // 0..1
};

export function BeforeAfterSlider(props: BeforeAfterSliderProps) {
  const { beforeSrc, afterSrc, initialPosition = 0.5 } = props;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<number>(initialPosition);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setPosition(initialPosition);
  }, [initialPosition]);

  const clamp = useCallback((val: number) => Math.min(1, Math.max(0, val)), []);

  const updateFromClientX = useCallback(
    (clientX: number) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const next = (clientX - rect.left) / rect.width;
      setPosition(clamp(next));
    },
    [clamp]
  );

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    setIsDragging(true);
    updateFromClientX(e.clientX);
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: PointerEvent) => updateFromClientX(e.clientX);
    const onUp = () => setIsDragging(false);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [isDragging, updateFromClientX]);

  const leftPercent = useMemo(() => position * 100, [position]);

  return (
    <section
      ref={containerRef}
      className="relative w-full min-h-[260px] md:min-h-[420px] overflow-hidden rounded-md border bg-muted/30 select-none"
      onPointerDown={onPointerDown}
      aria-label="Before and after comparison. Drag the handle to reveal."
    >
      <img
        src={beforeSrc}
        alt="Before"
        className="absolute inset-0 h-full w-full object-contain"
        draggable={false}
      />

      <img
        src={afterSrc}
        alt="After"
        className="absolute inset-0 h-full w-full object-contain"
        style={{ clipPath: `inset(0 ${100 - leftPercent}% 0 0)` }}
        draggable={false}
      />

      <div
        className="absolute top-0 bottom-0 w-0.5 bg-border"
        style={{ left: `calc(${leftPercent}% - 1px)` }}
        aria-hidden
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-background/80 backdrop-blur border shadow-sm flex items-center justify-center cursor-col-resize">
            <ChevronsLeftRight className="h-4 w-4" />
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute left-3 top-3 rounded-md bg-background/80 px-2 py-1 text-xs font-medium shadow-sm border">
        Before
      </div>
      <div className="pointer-events-none absolute right-3 top-3 rounded-md bg-background/80 px-2 py-1 text-xs font-medium shadow-sm border">
        After
      </div>
    </section>
  );
}
