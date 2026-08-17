import { useRef, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Pointer/touch driven 3D tilt wrapper.
 * Purely presentational: children keep their own layout.
 */
export function Tilt3D({
  children,
  className,
  intensity = 10,
  lift = 14,
  glare = true,
}: {
  children: ReactNode;
  className?: string;
  intensity?: number;
  lift?: number;
  glare?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const active = useMotionValue(0);

  const spring = { stiffness: 220, damping: 22, mass: 0.5 };
  const rotateY = useSpring(useTransform(px, [0, 1], [-intensity, intensity]), spring);
  const rotateX = useSpring(useTransform(py, [0, 1], [intensity, -intensity]), spring);
  const z = useSpring(useTransform(active, [0, 1], [0, lift]), spring);
  const glareOpacity = useSpring(useTransform(active, [0, 1], [0, 0.35]), spring);
  const glareX = useTransform(px, (v) => `${v * 100}%`);
  const glareY = useTransform(py, (v) => `${v * 100}%`);

  const move = (clientX: number, clientY: number) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    px.set(Math.min(1, Math.max(0, (clientX - r.left) / r.width)));
    py.set(Math.min(1, Math.max(0, (clientY - r.top) / r.height)));
  };

  const reset = () => {
    px.set(0.5);
    py.set(0.5);
    active.set(0);
  };

  return (
    <div ref={ref} className={cn("perspective-deep", className)}>
      <motion.div
        style={{ rotateX, rotateY, z, transformStyle: "preserve-3d" }}
        onPointerMove={(e) => {
          if (e.pointerType === "mouse") {
            active.set(1);
            move(e.clientX, e.clientY);
          }
        }}
        onPointerEnter={() => active.set(1)}
        onPointerLeave={reset}
        onTouchStart={(e) => {
          const t = e.touches[0];
          if (t) {
            active.set(1);
            move(t.clientX, t.clientY);
          }
        }}
        onTouchMove={(e) => {
          const t = e.touches[0];
          if (t) move(t.clientX, t.clientY);
        }}
        onTouchEnd={reset}
        className="relative h-full [transform-style:preserve-3d]"
      >
        {children}
        {glare && (
          <motion.span
            aria-hidden
            style={{
              opacity: glareOpacity,
              background: useTransform(
                [glareX, glareY],
                ([x, y]) =>
                  `radial-gradient(120px circle at ${x} ${y}, color-mix(in oklab, var(--color-primary) 55%, white), transparent 70%)`,
              ),
            }}
            className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] mix-blend-soft-light"
          />
        )}
      </motion.div>
    </div>
  );
}
