import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/vote")({
  component: VotePage,
  head: () => ({ meta: [{ title: "Зрительское голосование — YCT" }] }),
});

const AWARDS = [
  {
    key: "glorious" as const,
    name: "Glorious Award",
    description: "Выберите два лучших фильма показа.",
    color: "from-violet-500/20 to-violet-500/5 border-violet-500/30",
    accent: "text-violet-300",
  },
  {
    key: "impact" as const,
    name: "Impact Award",
    description:
      "Выберите два фильма, оставивших глубокое впечатление своим содержанием.",
    color: "from-rose-500/20 to-rose-500/5 border-rose-500/30",
    accent: "text-rose-300",
  },
  {
    key: "tech" as const,
    name: "Tech Award",
    description:
      "Выберите два фильма, заставивших вас задуматься и поразиться, как это было снято / смонтировано.",
    color: "from-sky-500/20 to-sky-500/5 border-sky-500/30",
    accent: "text-sky-300",
  },
] as const;

type AwardKey = (typeof AWARDS)[number]["key"];
type Choices = Record<AwardKey, { first: string; second: string }>;

const VOTED_KEY = "yct_audience_voted_v2";

function getVoterToken(): string {
  const key = "yct_voter_token";
  let token = localStorage.getItem(key);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(key, token);
  }
  return token;
}

function VotePage() {
  const [choices, setChoices] = useState<Choices>({
    glorious: { first: "", second: "" },
    impact: { first: "", second: "" },
    tech: { first: "", second: "" },
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(VOTED_KEY)) setSubmitted(true);
  }, []);

  const { data: films, isLoading } = useQuery({
    queryKey: ["vote-films"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("films")
        .select("id, title")
        .eq("submitted", true)
        .eq("status", "approved")
        .order("title");
      if (error) throw error;
      return data as { id: string; title: string }[];
    },
  });

  const setChoice = (award: AwardKey, rank: "first" | "second", filmId: string) => {
    setChoices((prev) => ({ ...prev, [award]: { ...prev[award], [rank]: filmId } }));
  };

  const submit = async () => {
    for (const award of AWARDS) {
      const c = choices[award.key];
      if (!c.first || !c.second) {
        toast.error(`Выберите оба варианта для ${award.name}`);
        return;
      }
      if (c.first === c.second) {
        toast.error(`В ${award.name} нельзя выбрать один фильм дважды`);
        return;
      }
    }

    setSubmitting(true);
    const token = getVoterToken();

    const rows = AWARDS.flatMap((award) => [
      { award: award.key, choice_rank: 1, film_id: choices[award.key].first, voter_token: token },
      { award: award.key, choice_rank: 2, film_id: choices[award.key].second, voter_token: token },
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("audience_votes").insert(rows);
    setSubmitting(false);

    if (error) {
      if (error.code === "23505") {
        localStorage.setItem(VOTED_KEY, "1");
        setSubmitted(true);
        toast.info("Вы уже проголосовали");
      } else {
        toast.error(error.message);
      }
      return;
    }

    localStorage.setItem(VOTED_KEY, "1");
    setSubmitted(true);
  };

  if (isLoading) {
    return (
      <div className="grid min-h-svh place-items-center text-muted-foreground">
        Загрузка…
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="grid min-h-svh place-items-center px-4">
        <div className="flex max-w-sm flex-col items-center gap-4 text-center">
          <CheckCircle2 className="h-16 w-16 text-emerald-400" />
          <h1 className="font-display text-2xl">Голос учтён!</h1>
          <p className="font-serif text-muted-foreground italic">
            Спасибо за участие в зрительском голосовании YCT.
            Результаты будут объявлены после окончания показа.
          </p>
        </div>
      </div>
    );
  }

  const filmOptions = films ?? [];

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:py-16">
      <div className="mb-8">
        <p className="text-[11px] uppercase tracking-[0.3em] text-accent/80">
          YCT · Зрительский Бланк
        </p>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl">
          Зрительское голосование
        </h1>
        <p className="mt-3 font-serif text-sm italic text-muted-foreground">
          По каждому аворду выберите первый и второй выбор из всех показанных фильмов.
        </p>
      </div>

      <div className="space-y-6">
        {AWARDS.map((award) => (
          <div
            key={award.key}
            className={`rounded-2xl border bg-gradient-to-b p-5 ${award.color}`}
          >
            <h2 className={`font-display text-lg ${award.accent}`}>{award.name}</h2>
            <p className="mt-1 mb-4 font-serif text-sm italic text-muted-foreground">
              {award.description}
            </p>

            <div className="space-y-3">
              {(["first", "second"] as const).map((rank) => (
                <div key={rank}>
                  <label className="mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground">
                    {rank === "first" ? "First choice" : "Second choice"}
                  </label>
                  <select
                    value={choices[award.key][rank]}
                    onChange={(e) => setChoice(award.key, rank, e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-[var(--neon)]"
                  >
                    <option value="">— выберите фильм —</option>
                    {filmOptions.map((f) => (
                      <option
                        key={f.id}
                        value={f.id}
                        disabled={
                          rank === "second"
                            ? f.id === choices[award.key].first
                            : f.id === choices[award.key].second
                        }
                      >
                        {f.title}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Button
        variant="hero"
        size="lg"
        className="mt-8 w-full"
        onClick={submit}
        disabled={submitting}
      >
        {submitting ? "Отправляем…" : "Отправить голос"}
      </Button>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Один голос с одного устройства
      </p>
    </div>
  );
}
