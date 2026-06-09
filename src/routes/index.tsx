import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Play, Upload, Sparkles, Trophy, Users, Coins, Clapperboard,
  Globe2, FileDown, Snowflake, Sun, Film as FilmIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { FilmCard } from "@/components/FilmCard";
import { useReveal } from "@/hooks/use-reveal";
import { useI18n } from "@/i18n";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "YCT — International Film Tournament" },
      { name: "description", content: "International short-film tournament. Build a team, shoot a film, win the prize." },
    ],
  }),
});

function Index() {
  useReveal();
  const { t } = useI18n();

  const { data: films } = useQuery({
    queryKey: ["films-featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("films")
        .select("*")
        .eq("submitted", true)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data;
    },
  });

  const { data: teamCount } = useQuery({
    queryKey: ["team-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .not("team_name", "is", null);
      return count ?? 0;
    },
  });

  return (
    <div className="relative">
      {/* HERO */}
      <section className="letterbox relative mx-auto mt-6 max-w-7xl overflow-hidden rounded-2xl border border-white/5 bg-black/30 px-4 pt-24 pb-28 sm:px-10 sm:pt-32 sm:pb-36">
        <div className="sprocket pointer-events-none absolute left-0 right-0 top-14 h-3 opacity-60" />
        <div className="sprocket pointer-events-none absolute left-0 right-0 bottom-14 h-3 opacity-60" />

        <div className="mx-auto max-w-3xl text-center animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
            <Trophy className="h-3.5 w-3.5 text-accent" />
            {t("hero_kicker")}
          </span>
          <h1 className="mt-6 font-display text-5xl leading-[1.02] sm:text-7xl">
            <span className="text-gradient">{t("hero_title_a")}</span>
            <br />
            <em className="font-serif italic font-normal text-foreground/90">{t("hero_title_b")}</em>
          </h1>
          <p className="mx-auto mt-6 max-w-xl font-serif text-lg italic text-muted-foreground sm:text-xl">
            {t("hero_sub")}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button asChild variant="hero" size="xl" className="animate-pulse-neon">
              <Link to="/signup">
                <Upload className="h-5 w-5" />
                {t("hero_cta_join")}
              </Link>
            </Button>
            <Button asChild variant="neon" size="xl">
              <Link to="/explore">
                <Play className="h-5 w-5" />
                {t("hero_cta_explore")}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* TOURNAMENT INFO GRID */}
      <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
        <div className="mb-10 reveal">
          <p className="text-[11px] uppercase tracking-[0.3em] text-accent/80">YCT 2026</p>
          <h2 className="mt-2 font-display text-3xl sm:text-5xl">{t("ti_title")}</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <InfoCard icon={Sparkles} title={t("ti_themes")} body={t("ti_themes_body")} />
          <InfoCard icon={Users} title={t("ti_who")} body={t("ti_who_body")} />
          <InfoCard
            icon={Trophy}
            title={t("ti_teams")}
            body={`${teamCount ?? 0}`}
            big
          />
          <InfoCard icon={Coins} title={t("ti_prize")} body={t("ti_prize_amount")} big accent />
          <InfoCard icon={Clapperboard} title={t("ti_format")} body={t("ti_format_body")} />
          <InfoCard icon={Sparkles} title={t("ti_bonus")} body={t("ti_bonus_body")} />
          <InfoCard icon={Sparkles} title={t("ti_ai")} body={t("ti_ai_body")} />
          <InfoCard icon={Sparkles} title={t("ti_forbidden")} body={t("ti_forbidden_body")} />
          <InfoCard icon={Globe2} title={t("ti_sponsors")} body={t("ti_sponsors_body")} sponsors />
        </div>

        {/* Regulations download */}
        <div className="mt-6 glass flex flex-col items-start gap-4 rounded-2xl p-6 sm:flex-row sm:items-center sm:justify-between reveal">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-accent/15 text-accent">
              <FileDown className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-lg">{t("ti_download")}</p>
              <p className="text-sm text-muted-foreground">PDF · YCT 2026</p>
            </div>
          </div>
          <Button variant="glass" size="lg" disabled>
            {t("ti_download_soon")}
          </Button>
        </div>
      </section>

      {/* CTA: register / login */}
      <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6">
        <div className="glass relative overflow-hidden rounded-3xl p-8 sm:p-14 reveal">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full [background:var(--gradient-primary)] opacity-20 blur-3xl" />
          <div className="relative flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl">
                <span className="text-gradient">{t("hero_cta_join")}</span>
              </h2>
              <p className="mt-2 max-w-xl font-serif italic text-muted-foreground">
                {t("hero_sub")}
              </p>
            </div>
            <div className="flex gap-3">
              <Button asChild variant="hero" size="lg">
                <Link to="/signup">{t("nav_submit")}</Link>
              </Button>
              <Button asChild variant="glass" size="lg">
                <Link to="/login">{t("nav_login")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* TOURNAMENT CREATORS */}
      <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6">
        <div className="glass relative overflow-hidden rounded-3xl p-8 sm:p-14 reveal">
          <div className="relative grid gap-10 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                <Trophy className="h-3.5 w-3.5 text-accent" />
                {t("tc_kicker")}
              </span>
              <h2 className="mt-5 font-display text-4xl leading-tight sm:text-5xl">
                <span className="text-gradient">{t("tc_title_a")}</span>{" "}
                <em className="font-serif italic font-normal text-foreground/90">{t("tc_title_b")}</em>
              </h2>
              <p className="mt-5 max-w-xl font-serif text-lg italic text-muted-foreground">
                {t("tc_sub")}
              </p>
            </div>
            <div className="grid gap-4 self-center">
              <div className="glass flex items-start gap-4 rounded-2xl p-5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent">
                  <Snowflake className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-accent/80">{t("tc_winter_kicker")}</p>
                  <h3 className="mt-1 font-display text-lg">{t("tc_winter_title")}</h3>
                </div>
              </div>
              <div className="glass flex items-start gap-4 rounded-2xl p-5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/20 text-primary-foreground">
                  <Sun className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-accent/80">{t("tc_summer_kicker")}</p>
                  <h3 className="mt-1 font-display text-lg flex items-center gap-2">
                    {t("tc_summer_title")} <Globe2 className="h-4 w-4 text-accent" />
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED submitted films */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32">
        <div className="mb-10 flex items-end justify-between reveal">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-accent/80">{t("featured_kicker")}</p>
            <h2 className="mt-2 font-display text-3xl sm:text-5xl">{t("nav_explore")}</h2>
          </div>
          <Link to="/explore" className="text-sm text-accent hover:underline">→</Link>
        </div>

        {films && films.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {films.map((f, i) => (
              <div key={f.id} className="reveal" style={{ transitionDelay: `${i * 60}ms` }}>
                <FilmCard film={f} />
              </div>
            ))}
          </div>
        ) : (
          <div className="glass rounded-2xl p-12 text-center reveal">
            <FilmIcon className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-4 font-serif italic text-muted-foreground">—</p>
          </div>
        )}
      </section>
    </div>
  );
}

function InfoCard({
  icon: Icon, title, body, big, accent, sponsors,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  big?: boolean;
  accent?: boolean;
  sponsors?: boolean;
}) {
  return (
    <div className="reveal glass rounded-2xl p-6 transition-all duration-500 hover:-translate-y-1 hover:shadow-[var(--shadow-neon)]">
      <Icon className={`h-6 w-6 ${accent ? "text-accent" : "text-foreground/80"}`} />
      <p className="mt-3 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{title}</p>
      {big ? (
        <p className={`mt-2 font-display text-3xl ${accent ? "text-gradient" : ""}`}>{body}</p>
      ) : (
        <p className="mt-2 font-serif italic text-sm text-muted-foreground">{body}</p>
      )}
      {sponsors && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="aspect-[3/2] rounded-md border border-dashed border-white/10 bg-white/[0.02]" />
          ))}
        </div>
      )}
    </div>
  );
}
