export function CinematicDecor() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Top-right film strip */}
      <svg
        className="absolute -right-10 top-24 h-80 w-44 opacity-[0.10] animate-float"
        viewBox="0 0 100 220"
        fill="none"
      >
        <rect x="10" y="0" width="80" height="220" rx="4" stroke="currentColor" className="text-foreground/40" />
        {Array.from({ length: 9 }).map((_, i) => (
          <rect
            key={i}
            x="22"
            y={8 + i * 24}
            width="56"
            height="18"
            rx="1"
            fill="currentColor"
            className="text-foreground/10"
          />
        ))}
        {Array.from({ length: 9 }).map((_, i) => (
          <g key={`p-${i}`}>
            <rect x="13" y={14 + i * 24} width="6" height="6" rx="1" fill="currentColor" className="text-foreground/40" />
            <rect x="81" y={14 + i * 24} width="6" height="6" rx="1" fill="currentColor" className="text-foreground/40" />
          </g>
        ))}
      </svg>

      {/* Bottom-left clapperboard */}
      <svg
        className="absolute -bottom-8 -left-8 h-72 w-72 opacity-[0.07]"
        viewBox="0 0 200 200"
        fill="none"
      >
        <rect x="20" y="70" width="160" height="110" rx="4" stroke="currentColor" className="text-foreground/60" />
        <path d="M20 70 L180 70 L160 40 L100 50 L40 40 Z" stroke="currentColor" className="text-foreground/60" />
        <path d="M40 40 L60 70 M80 45 L100 70 M120 47 L140 70 M160 40 L180 70"
          stroke="currentColor" className="text-foreground/60" />
      </svg>

      {/* Subtle scanline */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent 0 2px, oklch(1 0 0 / 0.5) 2px 3px)",
        }}
      />
    </div>
  );
}
