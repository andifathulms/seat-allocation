import { useEffect, useRef, useState } from 'react';

/** DESIGN.md §6.2, cubic-bezier(.32,.72,0,1), evaluated rather than declared. */
export function easeMigrate(t: number): number {
  return cubicBezier(0.32, 0.72, 0, 1, t);
}

export function easeStep(t: number): number {
  return cubicBezier(0.4, 0, 0.2, 1, t);
}

/**
 * Solves y for x on a cubic Bézier with fixed endpoints (0,0) and (1,1), by
 * Newton with a bisection fallback. Twelve iterations is well inside the budget
 * for one call per frame.
 */
function cubicBezier(x1: number, y1: number, x2: number, y2: number, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;

  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const slopeX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;

  let t = x;
  for (let i = 0; i < 8; i++) {
    const dx = sampleX(t) - x;
    if (Math.abs(dx) < 1e-6) break;
    const d = slopeX(t);
    if (Math.abs(d) < 1e-6) break;
    t -= dx / d;
  }
  t = Math.min(Math.max(t, 0), 1);
  return ((ay * t + by) * t + cy) * t;
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(prefersReducedMotion);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return reduced;
}

/**
 * Drives one value from 0 to 1 over a duration, cancellable mid-flight. One rAF
 * loop, no library. A duration of 0 — a discrete change under reduced motion, or
 * any change while a continuous control is being dragged — writes the end state
 * immediately and never schedules a frame.
 *
 * The caller receives progress through a ref rather than through state, because
 * the Chamber writes transforms to the DOM directly and must not re-render 580
 * components per frame.
 */
export function useProgress(
  key: unknown,
  duration: number,
  onFrame: (progress: number) => void,
): void {
  const frame = useRef(0);
  const callback = useRef(onFrame);
  callback.current = onFrame;

  useEffect(() => {
    if (duration <= 0) {
      callback.current(1);
      return;
    }
    const started = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - started) / duration, 1);
      callback.current(progress);
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    };
    callback.current(0);
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [key, duration]);
}

export function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Interpolates two hex triplets in sRGB. Used only for the seat cross-fade. */
export function mixHex(a: string, b: string, t: number): string {
  if (t <= 0) return a;
  if (t >= 1) return b;
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const r = Math.round(mix((pa >> 16) & 255, (pb >> 16) & 255, t));
  const g = Math.round(mix((pa >> 8) & 255, (pb >> 8) & 255, t));
  const bl = Math.round(mix(pa & 255, pb & 255, t));
  return `#${((r << 16) | (g << 8) | bl).toString(16).padStart(6, '0')}`;
}
