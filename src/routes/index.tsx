import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarClock,
  Clapperboard,
  Coins,
  FileDown,
  Film as FilmIcon,
  Globe2,
  Play,
  Sparkles,
  Trophy,
  Upload,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { FilmCard } from "@/components/FilmCard";
import { useReveal } from "@/hooks/use-reveal";
import { useI18n } from "@/i18n";
import { formatDeadline } from "@/lib/tournament";

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
      <section className="hero-frame relative -mt-[72px] overflow-hidden px-4 pb-12 pt-28 sm:px-6 lg:pb-16 lg:pt-36">
        <div className="sprocket pointer-events-none absolute left-0 right-0 top-[92px] h-3 opacity-45" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-background to-transparent" />

        <div className="relative mx-auto flex min-h-[560px] max-w-7xl flex-col justify-end">
          <div className="animate-fade-up max-w-3xl pb-8">
            <span className="eyebrow">
              <Trophy className="h-3.5 w-3.5 text-accent" />
              {t("hero_kicker")}
            </span>
            <h1 className="mt-6 max-w-4xl font-display text-5xl leading-[1.02] sm:text-7xl lg:text-8xl">
              <span className="text-gradient">{t("hero_title_a")}</span>
              <br />
              <em className="font-serif italic font-normal text-foreground/95">
                {t("hero_title_b")}
              </em>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-xl">
              {t("hero_sub")} Команды снимают короткий метр, проходят отбор и борются за призовой фонд.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Button asChild variant="hero" size="xl">
                <Link to="/signup">
                  <Upload className="h-5 w-5" />
                  {t("hero_cta_join")}
                </Link>
              </Button>
              <Button asChild variant="neon" size="xl">
                <Link to="/tournament">
                  <Play className="h-5 w-5" />
                  Правила турнира
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-2 lg:grid-cols-4">
            <HeroMetric label="Призовой фонд" value={t("ti_prize_amount")} />
            <HeroMetric label="Команда" value="3-7 человек" />
            <HeroMetric label="Хронометраж" value="5-12 минут" />
            <HeroMetric label="Дедлайн" value={formatDeadline("ru")} />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 pt-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="surface reveal p-6 sm:p-8">
          <span className="eyebrow">
            <Trophy className="h-3.5 w-3.5 text-accent" />
            YCT 2026
          </span>
          <h2 className="mt-4 max-w-2xl font-display text-3xl leading-tight sm:text-5xl">
            Турнир для команд, которые могут снять историю быстро, честно и выразительно.
          </h2>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
            YCT собирает начинающих авторов вокруг короткого формата: понятные правила, две темы,
            дедлайн, модерация работ и публичный показ лучших фильмов.
          </p>
        </div>
        <div className="surface reveal grid content-between gap-6 p-6 sm:p-8">
          <div>
            <p className="text-[11px] uppercase text-accent">Прием заявок</p>
            <p className="mt-2 font-display text-2xl">{formatDeadline("ru")}</p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              После дедлайна раздел с фильмами откроется для просмотра и отбора.
            </p>
          </div>
          <Button asChild variant="glass" size="lg" className="justify-between">
            <Link to="/upload">
              Перейти к заявке
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6">
        <div className="mb-10 reveal">
          <p className="text-[11px] uppercase text-accent/80">Основное</p>
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

        <div className="surface reveal mt-6 flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 place-items-center bg-accent/15 text-accent">
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

      <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6">
        <div className="surface reveal p-8 sm:p-12">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <span className="eyebrow">
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
              <div className="border-l border-white/10 pl-5">
                <div>
                  <p className="text-[10px] uppercase text-accent/80">{t("tc_winter_kicker")}</p>
                  <h3 className="mt-1 font-display text-lg">{t("tc_winter_title")}</h3>
                </div>
              </div>
              <div className="border-l border-white/10 pl-5">
                <div>
                  <p className="text-[10px] uppercase text-accent/80">{t("tc_summer_kicker")}</p>
                  <h3 className="mt-1 font-display text-lg flex items-center gap-2">
                    {t("tc_summer_title")} <Globe2 className="h-4 w-4 text-accent" />
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32">
        <div className="mb-10 flex items-end justify-between reveal">
          <div>
            <p className="text-[11px] uppercase text-accent/80">{t("featured_kicker")}</p>
            <h2 className="mt-2 font-display text-3xl sm:text-5xl">{t("nav_explore")}</h2>
          </div>
          <Link to="/explore" className="inline-flex items-center gap-2 text-sm text-accent hover:underline">
            Открыть
            <ArrowRight className="h-4 w-4" />
          </Link>
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
          <div className="surface reveal p-12 text-center">
            <FilmIcon className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">
              Фильмы появятся после модерации и открытия раздела.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-lg text-foreground">{value}</p>
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
    <div className="surface reveal p-6 transition-all duration-500 hover:-translate-y-1">
      <Icon className={`h-6 w-6 ${accent ? "text-accent" : "text-foreground/80"}`} />
      <p className="mt-3 text-[10px] uppercase text-muted-foreground">{title}</p>
      {big ? (
        <p className={`mt-2 font-display text-3xl ${accent ? "text-gradient" : ""}`}>{body}</p>
      ) : (
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
      )}
      {sponsors && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="aspect-[3/2] border border-dashed border-white/10 bg-white/[0.02]" />
          ))}
        </div>
      )}
    </div>
  );
}
