import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/vote/$filmId")({
  component: VotePage,
  head: () => ({ meta: [{ title: "Зрительское голосование — YCT" }] }),
});

const AWARDS = [
  {
    key: "impact" as const,
    name: "Impact Award",
    description:
      "Фильм с сильным социальным или эмоциональным посланием — меняет взгляд зрителя на мир.",
  },
  {
    key: "tech" as const,
    name: "Tech Award",
    description:
      "Лучшая техническая реализация: операторская работа, монтаж, звук, общее качество съёмки.",
  },
];

function getVoterToken(): string {
  const key = "yct_voter_token";
  let token = localStorage.getItem(key);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(key, token);
  }
  return token;
}

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
          className="text-2xl transition-transform hover:scale-110 focus:outline-none"
          aria-label={`${n} из 5`}
        >
          <Star
            className={`h-8 w-8 transition-colors ${
              n <= (hovered || value)
                ? "fill-accent text-accent"
                : "text-white/20"
            }`}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="ml-2 self-center text-sm text-muted-foreground">
          {value} / 5
        </span>
      )}
    </div>
  );
}

function VotePage() {
  const { filmId } = Route.useParams();
  const [scores, setScores] = useState<Record<string, number>>({ impact: 0, tech: 0 });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const alreadyVotedKey = `yct_voted_${filmId}`;

  useEffect(() => {
    if (localStorage.getItem(alreadyVotedKey)) setSubmitted(true);
  }, [alreadyVotedKey]);

  const { data: film, isLoading } = useQuery({
    queryKey: ["film-vote", filmId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("films")
        .select("id, title, description")
        .eq("id", filmId as string)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const submit = async () => {
    const missing = AWARDS.filter((a) => !scores[a.key]);
    if (missing.length) {
      toast.error(`Оцените все критерии: ${missing.map((a) => a.name).join(", ")}`);
      return;
    }
    setSubmitting(true);
    const token = getVoterToken();
    const rows = AWARDS.map((a) => ({
      film_id: filmId,
      award: a.key,
      score: scores[a.key],
      voter_token: token,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("audience_votes").insert(rows);
    setSubmitting(false);

    if (error) {
      if (error.code === "23505") {
        // unique violation — already voted
        localStorage.setItem(alreadyVotedKey, "1");
        setSubmitted(true);
        toast.info("Вы уже голосовали за этот фильм");
      } else {
        toast.error(error.message);
      }
      return;
    }

    localStorage.setItem(alreadyVotedKey, "1");
    setSubmitted(true);
  };

  if (isLoading) {
    return (
      <div className="grid min-h-svh place-items-center text-muted-foreground">
        Загрузка…
      </div>
    );
  }

  if (!film) {
    return (
      <div className="grid min-h-svh place-items-center text-muted-foreground">
        Фильм не найден
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
            Спасибо за оценку фильма <strong className="text-foreground">«{film.title}»</strong>.
            Ваш голос будет учтён при подведении итогов.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:py-16">
      {/* Film info */}
      <div className="mb-8">
        <p className="text-[11px] uppercase tracking-[0.3em] text-accent/80">
          Зрительское голосование · YCT
        </p>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl">{film.title}</h1>
        {film.description && (
          <p className="mt-3 font-serif text-sm italic leading-relaxed text-muted-foreground line-clamp-3">
            {film.description}
          </p>
        )}
      </div>

      {/* Award ratings */}
      <div className="space-y-6">
        {AWARDS.map((award) => (
          <div
            key={award.key}
            className="glass rounded-2xl p-5"
          >
            <div className="mb-1 flex items-center gap-2">
              <span className="font-display text-lg">{award.name}</span>
            </div>
            <p className="mb-4 font-serif text-sm italic text-muted-foreground">
              {award.description}
            </p>
            <StarRating
              value={scores[award.key]}
              onChange={(v) => setScores((s) => ({ ...s, [award.key]: v }))}
            />
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
        Один голос с одного устройства за фильм
      </p>
    </div>
  );
}
