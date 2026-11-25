"use client";

import { useEffect, useRef, type KeyboardEvent, type MouseEvent } from "react";
import { MotionConfig, motion, useMotionValue, type PanInfo } from "motion/react";
import { DEFENSE_LIMITS } from "@/lib/data";
import { formatMeters, type XY } from "@/lib/geo";

interface ZoneHandleProps {
  /** The point the bench moves the zone away from: the sample home, or the raw-file guess for uploads. */
  home: XY;
  /** zoneAngle(seed): the same secret direction applyDefenses uses. */
  angle: number;
  /** Current offset in meters (the live slider value, not the deferred one). */
  centerOffset: number;
  /** maxOffset(zoneRadius): home must stay inside the zone. */
  offsetMax: number;
  /** One plot unit (viewBox width / 160), used for marker sizes. */
  unit: number;
  onOffset: (meters: number) => void;
  /** Tells the plot to hold its viewBox while a pan is in progress. */
  onPanChange?: (panning: boolean) => void;
}

const STEP = DEFENSE_LIMITS.centerOffset.step;

// Motion M5: opacity and stroke width only, linear, 280 ms. No scale, no translate.
const HOVER = { duration: 0.28, ease: "linear" } as const;

/**
 * Kit signature 2: the privacy-zone center on Fig. 1, draggable along the one secret
 * direction the defense model uses. Dragging it, or pressing the arrow keys while it has
 * focus, sets centerOffset; the bench re-measures and cell B and the roll call update.
 */
export function ZoneHandle({ home, angle, centerOffset, offsetMax, unit, onOffset, onPanChange }: ZoneHandleProps) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const at = (d: number) => ({ x: home.x + cos * d, y: -(home.y + sin * d) });

  const start = at(centerOffset);
  const x = useMotionValue(start.x);
  const y = useMotionValue(start.y);
  const panning = useRef(false);
  const lastSent = useRef(centerOffset);
  const groupRef = useRef<SVGGElement>(null);

  // Follow the slider, the presets and the keyboard whenever no pan is in progress.
  useEffect(() => {
    lastSent.current = centerOffset;
    if (panning.current) return;
    x.set(home.x + cos * centerOffset);
    y.set(-(home.y + sin * centerOffset));
  }, [centerOffset, home.x, home.y, cos, sin, x, y]);

  /** Page point to meters along the ray from home, clamped to [0, offsetMax]. */
  const project = (pageX: number, pageY: number): number | null => {
    const svg = groupRef.current?.ownerSVGElement;
    const ctm = svg?.getScreenCTM();
    if (!ctm) return null;
    const p = new DOMPoint(pageX - window.scrollX, pageY - window.scrollY).matrixTransform(ctm.inverse());
    // The plot draws world y as -y, so flip it back before projecting.
    const d = (p.x - home.x) * cos + (-p.y - home.y) * sin;
    return Math.min(offsetMax, Math.max(0, d));
  };

  const send = (d: number) => {
    const next = Math.min(offsetMax, Math.max(0, Math.round(d / STEP) * STEP));
    if (next === lastSent.current) return;
    lastSent.current = next;
    onOffset(next);
  };

  const onPanStart = () => {
    panning.current = true;
    onPanChange?.(true);
  };

  const onPan = (_e: PointerEvent, info: PanInfo) => {
    const d = project(info.point.x, info.point.y);
    if (d === null) return;
    const p = at(d);
    x.set(p.x);
    y.set(p.y);
    send(d);
  };

  const onPanEnd = (_e: PointerEvent, info: PanInfo) => {
    const d = project(info.point.x, info.point.y);
    panning.current = false;
    onPanChange?.(false);
    const final = d === null ? lastSent.current : Math.min(offsetMax, Math.max(0, Math.round(d / STEP) * STEP));
    const p = at(final);
    x.set(p.x);
    y.set(p.y);
    send(final);
  };

  const onKeyDown = (e: KeyboardEvent<SVGGElement>) => {
    let next: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") next = centerOffset + STEP;
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = centerOffset - STEP;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = offsetMax;
    if (next === null) return;
    e.preventDefault();
    send(next);
  };

  // Click-to-step: a click anywhere on the guide line puts the center at that point.
  const onGuideClick = (e: MouseEvent<SVGLineElement>) => {
    const d = project(e.pageX, e.pageY);
    if (d !== null) send(d);
  };

  const end = at(offsetMax);

  return (
    <MotionConfig reducedMotion="user">
      <g>
        <line
          x1={home.x}
          y1={-home.y}
          x2={end.x}
          y2={end.y}
          className="stroke-gold"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1={home.x}
          y1={-home.y}
          x2={end.x}
          y2={end.y}
          stroke="transparent"
          strokeWidth={24}
          vectorEffect="non-scaling-stroke"
          style={{ cursor: "pointer" }}
          onClick={onGuideClick}
          aria-hidden="true"
        />
        <motion.g
          ref={groupRef}
          tabIndex={0}
          role="slider"
          aria-label="Zone center distance from home"
          aria-valuemin={0}
          aria-valuemax={offsetMax}
          aria-valuenow={centerOffset}
          aria-valuetext={`${formatMeters(centerOffset)} from home`}
          className="peer stroke-gold outline-none focus-visible:stroke-primary"
          style={{ touchAction: "none", cursor: "grab" }}
          strokeWidth={1.5}
          opacity={0.9}
          whileHover={{ opacity: 1, strokeWidth: 2.5 }}
          whileFocus={{ opacity: 1, strokeWidth: 2.5 }}
          transition={HOVER}
          onPanStart={onPanStart}
          onPan={onPan}
          onPanEnd={onPanEnd}
          onKeyDown={onKeyDown}
        >
          {/* A 44 px hit area at any plot scale: a transparent stroke drawn in screen pixels. */}
          <motion.circle cx={x} cy={y} r={unit * 0.4} stroke="transparent" strokeWidth={44} vectorEffect="non-scaling-stroke" fill="none" />
          <motion.circle cx={x} cy={y} r={unit * 2.2} className="fill-background" vectorEffect="non-scaling-stroke" />
          <motion.circle cx={x} cy={y} r={unit * 0.6} className="fill-gold" stroke="none" />
        </motion.g>
        <motion.circle
          cx={x}
          cy={y}
          r={unit * 3.6}
          fill="none"
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
          className="pointer-events-none stroke-gold opacity-0 peer-focus-visible:opacity-100"
          aria-hidden="true"
        />
      </g>
    </MotionConfig>
  );
}
