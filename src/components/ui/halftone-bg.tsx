import { HalftoneDots } from "@paper-design/shaders-react";
import { useEffect, useRef, useState } from "react";

interface HalftoneBgProps {
  className?: string;
}

export function HalftoneBg({ className = "" }: HalftoneBgProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 1200, height: 600 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setSize({ width: Math.ceil(width), height: Math.ceil(height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <div ref={containerRef} className="absolute inset-0 opacity-25">
        <HalftoneDots
          width={size.width}
          height={size.height}
          colorBack="#0c0d18"
          colorFront="#a855f7"
          size={0.45}
          radius={1}
          contrast={0.6}
          grid="square"
          type="holes"
          inverted={true}
          grainMixer={0.05}
          grainOverlay={0.15}
          speed={0}
        />
      </div>
      {/* Vignette so the headline and CTAs stay legible over the texture */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(12,13,24,0.85)_0%,rgba(12,13,24,0.55)_45%,rgba(12,13,24,0.2)_100%)]" />
    </div>
  );
}
