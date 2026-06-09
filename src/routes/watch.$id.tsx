import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Bookmark, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { hasSupabaseConfig, supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { FilmRating } from "@/components/FilmRating";
import { FilmComments } from "@/components/FilmComments";
import { FollowButton } from "@/components/FollowButton";

export const Route = createFileRoute("/watch/$id")({
  component: Watch,
  head: ({ params }) => ({
    meta: [{ title: `Просмотр — YCT` }, { name: "description", content: `Фильм ${params.id}` }],
  }),
});

function Watch() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: film, isLoading } = useQuery({
    queryKey: ["film", id],
    enabled: hasSupabaseConfig,
    queryFn: async () => {
      const { data, error } = await supabase.from("films").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: author } = useQuery({
    enabled: hasSupabaseConfig && !!film?.user_id,
    queryKey: ["profile", film?.user_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name,avatar_url")
        .eq("id", film!.user_id)
        .maybeSingle();
      return data;
    },
  });

  const { data: likeCount } = useQuery({
    queryKey: ["likes", id],
    enabled: hasSupabaseConfig,
    queryFn: async () => {
      const { count } = await supabase
        .from("film_likes")
        .select("*", { count: "exact", head: true })
        .eq("film_id", id);
      return count ?? 0;
    },
  });

  const { data: liked } = useQuery({
    enabled: hasSupabaseConfig && !!user,
    queryKey: ["liked", id, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("film_likes")
        .select("user_id")
        .eq("film_id", id)
        .eq("user_id", user!.id)
        .maybeSingle();
      return !!data;
    },
  });

  const { data: saved } = useQuery({
    enabled: hasSupabaseConfig && !!user,
    queryKey: ["saved", id, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("film_saves")
        .select("user_id")
        .eq("film_id", id)
        .eq("user_id", user!.id)
        .maybeSingle();
      return !!data;
    },
  });

  // Increment views once per mount — guard with a ref to survive React
  // StrictMode's double-invoke in development.
  const viewedRef = useRef(false);
  useEffect(() => {
    if (!hasSupabaseConfig || !film || viewedRef.current) return;
    viewedRef.current = true;
    // Don't count the author's own views.
    if (user && film.user_id === user.id) return;
    supabase
      .from("films")
      .update({ views: (film.views ?? 0) + 1 })
      .eq("id", film.id)
      .then(() => null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [film?.id]);

  const requireAuth = () => {
    if (!user) {
      toast.error("Войдите, чтобы продолжить");
      return false;
    }
    return true;
  };

  const toggleLike = async () => {
    if (!requireAuth()) return;
    if (liked) {
      await supabase.from("film_likes").delete().eq("film_id", id).eq("user_id", user!.id);
    } else {
      await supabase.from("film_likes").insert({ film_id: id, user_id: user!.id });
    }
    qc.invalidateQueries({ queryKey: ["liked", id] });
    qc.invalidateQueries({ queryKey: ["likes", id] });
  };

  const toggleSave = async () => {
    if (!requireAuth()) return;
    if (saved) {
      await supabase.from("film_saves").delete().eq("film_id", id).eq("user_id", user!.id);
      toast.success("Удалено из сохранённых");
    } else {
      await supabase.from("film_saves").insert({ film_id: id, user_id: user!.id });
      toast.success("Сохранено");
    }
    // Invalidate both the per-film saved flag and the dashboard saved-films list.
    qc.invalidateQueries({ queryKey: ["saved", id] });
    qc.invalidateQueries({ queryKey: ["saved-films", user?.id] });
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="aspect-video animate-pulse rounded-2xl bg-white/5" />
      </div>
    );
  }

  if (!film) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-24 text-center">
        <p className="text-muted-foreground">Фильм не найден</p>
        <Button asChild variant="neon" className="mt-6">
          <Link to="/explore">К исследованию</Link>
        </Button>
      </div>
    );
  }

  const videoUrl = supabase.storage.from("films").getPublicUrl(film.video_path).data.publicUrl;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <Link
        to="/explore"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> К списку
      </Link>

      {/* Cinematic player frame */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[var(--shadow-glass)]">
        <video src={videoUrl} controls autoPlay className="aspect-video w-full bg-black" />
        {/* Subtle inner vignette */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 60%, oklch(0 0 0 / 0.55) 100%)",
          }}
        />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-accent/80">Короткий метр</p>
          <h1 className="mt-2 font-display text-3xl sm:text-5xl">{film.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="font-display text-foreground">{author?.display_name ?? "Автор"}</span>
            <span>·</span>
            <span>
              {film.duration_seconds
                ? `${Math.floor(film.duration_seconds / 60)}:${String(film.duration_seconds % 60).padStart(2, "0")}`
                : "—"}
            </span>
            <span>·</span>
            <span>{film.views ?? 0} просмотров</span>
            <span className="ml-2">
              <FollowButton authorId={film.user_id} />
            </span>
          </div>

          {film.description && (
            <p className="mt-6 whitespace-pre-line font-serif text-[17px] italic leading-relaxed text-foreground/85">
              {film.description}
            </p>
          )}

          {film.tags && film.tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {film.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full glass px-3 py-1 text-xs text-muted-foreground"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}

          <div className="mt-6 flex gap-2">
            <Button variant={liked ? "hero" : "neon"} size="lg" onClick={toggleLike}>
              <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
              {likeCount ?? 0}
            </Button>
            <Button variant={saved ? "hero" : "neon"} size="lg" onClick={toggleSave}>
              <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
              Сохранить
            </Button>
          </div>
        </div>

        <aside className="space-y-4">
          <FilmRating filmId={film.id} />
        </aside>
      </div>

      <FilmComments filmId={film.id} />
    </div>
  );
}
