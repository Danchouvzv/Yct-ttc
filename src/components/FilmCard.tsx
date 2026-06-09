import { Link } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export function FilmCard({ film }: { film: Tables<"films"> }) {
  const thumbUrl = film.thumb_path
    ? supabase.storage.from("thumbs").getPublicUrl(film.thumb_path).data.publicUrl
    : null;
  const videoUrl = supabase.storage.from("films").getPublicUrl(film.video_path).data.publicUrl;

  const videoRef = useRef<HTMLVideoElement>(null);
  const [hovering, setHovering] = useState(false);

  const onEnter = () => {
    setHovering(true);
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.min(2, (film.duration_seconds ?? 30) / 4);
    v.play().catch(() => undefined);
  };
  const onLeave = () => {
    setHovering(false);
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    v.currentTime = 0;
  };

  return (
    <Link
      to="/watch/$id"
      params={{ id: film.id }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className="group block overflow-hidden rounded-xl border border-white/5 bg-black/40 transition-all duration-500 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[var(--shadow-neon)]"
    >
      <div className="relative aspect-video overflow-hidden bg-black">
        {thumbUrl ? (
          <img
            src={thumbUrl}
            alt={film.title}
            className={`h-full w-full object-cover transition-all duration-700 ${hovering ? "opacity-0 scale-105" : "opacity-100 scale-100 group-hover:scale-[1.03]"}`}
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 [background:var(--gradient-primary)] opacity-60" />
        )}

        {/* Hover preview video */}
        <video
          ref={videoRef}
          src={videoUrl}
          muted
          playsInline
          preload="none"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${hovering ? "opacity-100" : "opacity-0"}`}
        />

        {/* Letterbox overlay */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-4 bg-black/95" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-4 bg-black/95" />

        {/* Bottom shade */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0" />

        {/* Duration */}
        <div className="absolute bottom-6 left-3 flex items-center gap-1.5 rounded bg-black/60 px-2 py-0.5 text-[11px] font-medium tracking-wide backdrop-blur">
          <Play className="h-3 w-3 fill-current text-accent" />
          {film.duration_seconds
            ? `${Math.round(film.duration_seconds / 60)} мин`
            : "Короткий метр"}
        </div>

        {/* Views */}
        <div className="absolute top-6 right-3 rounded bg-black/60 px-2 py-0.5 text-[11px] text-muted-foreground backdrop-blur">
          {film.views ?? 0} просм.
        </div>
      </div>

      <div className="p-4">
        <h3 className="line-clamp-1 font-display text-base tracking-tight">{film.title}</h3>
        {film.description && (
          <p className="mt-1 line-clamp-2 font-serif text-sm italic text-muted-foreground">
            {film.description}
          </p>
        )}
      </div>
    </Link>
  );
}
