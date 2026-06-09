import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Film, X, Clapperboard, CalendarClock, Sparkles } from "lucide-react";
import { hasSupabaseConfig, supabase } from "@/integrations/supabase/client";
import { FilmCard } from "@/components/FilmCard";
import { useReveal } from "@/hooks/use-reveal";
import { useI18n } from "@/i18n";
import { Button } from "@/components/ui/button";
import { isSubmissionsOpen, formatDeadline, timeUntilDeadline } from "@/lib/tournament";

export const Route = createFileRoute("/explore")({
  component: Explore,
  head: () => ({
    meta: [
      { title: "Explore — YCT" },
      { name: "description", content: "All YCT community shorts — search by title and tags." },
    ],
  }),
});

function Explore() {
  if (isSubmissionsOpen()) return <ComingSoon />;
  return <FilmsList />;
}

function ComingSoon() {
  useReveal();
  const left = timeUntilDeadline();
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center px-4 py-16 sm:px-6">
      <div className="reveal w-full text-center">
        <span className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
          <Clapperboard className="h-3.5 w-3.5 text-accent" />
          Coming soon
        </span>
        <h1 className="mt-6 font-display text-5xl leading-tight sm:text-6xl">
          <span className="text-gradient">Раздел с фильмами</span>{" "}
          <em className="font-serif italic font-normal">скоро откроется</em>
        </h1>
        <p className="mx-auto mt-5 max-w-xl font-serif italic text-muted-foreground">
          Раздел с фильмами откроется после окончания приёма заявок. А пока — соберите команду и
          подайте свою.
        </p>

        <div className="mx-auto mt-10 grid max-w-md grid-cols-3 gap-3">
          <Tile value={left.days} label="дней" />
          <Tile value={left.hours} label="часов" />
          <Tile value={left.minutes} label="минут" />
        </div>

        <div className="mt-6 inline-flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarClock className="h-3.5 w-3.5 text-accent" />
          Приём заявок до {formatDeadline("ru")}
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button asChild variant="hero" size="xl">
            <Link to="/upload">Подать заявку</Link>
          </Button>
          <Button asChild variant="glass" size="xl">
            <Link to="/tournament">
              <Sparkles className="h-4 w-4" /> Правила турнира
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function Tile({ value, label }: { value: number; label: string }) {
  return (
    <div className="glass rounded-2xl p-4">
      <p className="font-display text-4xl text-gradient">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</p>
    </div>
  );
}

function FilmsList() {
  useReveal();
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const [tag, setTag] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["films-all"],
    enabled: hasSupabaseConfig,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("films")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const allTags = useMemo(() => {
    const set = new Set<string>();
    (data ?? []).forEach((f) => f.tags?.forEach((t) => set.add(t)));
    return Array.from(set).slice(0, 24);
  }, [data]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (data ?? []).filter((f) => {
      const matchesText =
        !needle ||
        f.title.toLowerCase().includes(needle) ||
        (f.description ?? "").toLowerCase().includes(needle) ||
        (f.tags ?? []).some((t) => t.toLowerCase().includes(needle));
      const matchesTag = !tag || (f.tags ?? []).includes(tag);
      return matchesText && matchesTag;
    });
  }, [data, q, tag]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8 reveal">
        <p className="text-[11px] uppercase tracking-[0.3em] text-accent/80">
          {t("explore_kicker")}
        </p>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl text-gradient">
          {t("explore_title")}
        </h1>
        <p className="mt-2 font-serif italic text-muted-foreground">{t("explore_sub")}</p>
      </div>

      <div className="reveal glass mb-6 flex items-center gap-3 rounded-xl px-4 py-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("explore_search_ph")}
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
        />
        {q && (
          <button onClick={() => setQ("")} aria-label={t("explore_clear")}>
            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>

      {allTags.length > 0 && (
        <div className="reveal mb-10 flex flex-wrap gap-2">
          {allTags.map((t) => (
            <button
              key={t}
              onClick={() => setTag(tag === t ? null : t)}
              className={`rounded-full border px-3 py-1 text-xs transition-all ${
                tag === t
                  ? "border-primary/60 bg-primary/15 text-foreground shadow-[0_0_18px_-4px_var(--neon)]"
                  : "border-white/10 bg-white/5 text-muted-foreground hover:text-foreground"
              }`}
            >
              #{t}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-video animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      ) : isError ? (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-sm text-destructive">
            Не удалось загрузить фильмы: {(error as Error)?.message ?? "ошибка"}
          </p>
          <Button variant="glass" size="sm" className="mt-4" onClick={() => refetch()}>
            Повторить
          </Button>
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((f, i) => (
            <div key={f.id} className="reveal" style={{ transitionDelay: `${i * 50}ms` }}>
              <FilmCard film={f} />
            </div>
          ))}
        </div>
      ) : (
        <div className="glass rounded-2xl p-16 text-center">
          <Film className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-4 font-serif italic text-muted-foreground">
            {q || tag ? t("explore_no_results") : t("explore_empty")}
          </p>
        </div>
      )}
    </div>
  );
}
