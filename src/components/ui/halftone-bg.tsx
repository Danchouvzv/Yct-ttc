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
    <div ref={containerRef} className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <HalftoneDots
        width={size.width}
        height={size.height}
        colorBack="#0c0d18"
        colorFront="#a855f7"
        size={0.8}
        radius={1}
        contrast={1}
        grid="square"
        type="holes"
        inverted={true}
        grainMixer={0.05}
        grainOverlay={0.3}
        speed={0}
      />
    </div>
  );
}
