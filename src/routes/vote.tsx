import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, Lock, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VOTING_OPEN } from "@/lib/tournament";

export const Route = createFileRoute("/vote")({
  component: VotePage,
  validateSearch: (search: Record<string, unknown>) => ({
    session: search.session != null ? Number(search.session) : undefined,
  }),
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
    description: "Выберите два фильма, оставивших глубокое впечатление своим содержанием.",
    color: "from-rose-500/20 to-rose-500/5 border-rose-500/30",
    accent: "text-rose-300",
  },
  {
    key: "tech" as const,
    name: "Tech Award",
    description: "Выберите два фильма, заставивших вас задуматься и поразиться, как это было снято / смонтировано.",
    color: "from-sky-500/20 to-sky-500/5 border-sky-500/30",
    accent: "text-sky-300",
  },
] as const;

type AwardKey = (typeof AWARDS)[number]["key"];
type Choices = Record<AwardKey, { first: string; second: string }>;

function VotePage() {
  const { session } = Route.useSearch();
  const { user, loading } = useAuth();

  if (!VOTING_OPEN) {
    return (
      <div className="grid min-h-svh place-items-center px-4">
        <div className="flex max-w-sm flex-col items-center gap-4 text-center">
          <Lock className="h-16 w-16 text-muted-foreground" />
          <h1 className="font-display text-2xl">Голосование завершено</h1>
          <p className="font-serif text-muted-foreground italic">
            Зрительское голосование YCT закрыто. Спасибо всем, кто принял участие!
          </p>
        </div>
      </div>
    );
  }

  if (!session || isNaN(session)) {
    return (
      <div className="grid min-h-svh place-items-center px-4">
        <div className="flex max-w-sm flex-col items-center gap-4 text-center">
          <Lock className="h-16 w-16 text-muted-foreground" />
          <h1 className="font-display text-2xl">Ссылка недействительна</h1>
          <p className="font-serif text-muted-foreground italic">
            Отсканируйте QR-код вашего сеанса.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid min-h-svh place-items-center text-muted-foreground">
        Загрузка…
      </div>
    );
  }

  if (!user) {
    return <AuthForm sessionNumber={session} />;
  }

  return <BallotForm sessionNumber={session} userId={user.id} />;
}

/* ------------------------------------------------------------------ */
/* Inline auth (login + register)                                       */
/* ------------------------------------------------------------------ */

function AuthForm({ sessionNumber }: { sessionNumber: number }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) toast.error(error.message);
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) toast.error(error.message);
        else toast.success("Аккаунт создан! Можно голосовать.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-svh place-items-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-accent/80">
            YCT · Сеанс {sessionNumber}
          </p>
          <h1 className="mt-2 font-display text-2xl">
            {mode === "login" ? "Вход" : "Регистрация"}
          </h1>
          <p className="mt-1 font-serif text-sm italic text-muted-foreground">
            {mode === "login"
              ? "Войдите, чтобы проголосовать за фильмы вашего сеанса."
              : "Создайте аккаунт зрителя — это займёт 30 секунд."}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground">
              Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@mail.com"
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground">
              Пароль
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>
          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={busy}>
            <LogIn className="mr-2 h-4 w-4" />
            {busy ? "…" : mode === "login" ? "Войти" : "Создать аккаунт"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {mode === "login" ? "Нет аккаунта?" : "Уже есть аккаунт?"}{" "}
          <button
            type="button"
            className="text-accent underline underline-offset-2"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
          >
            {mode === "login" ? "Зарегистрироваться" : "Войти"}
          </button>
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Ballot form (shown after auth)                                       */
/* ------------------------------------------------------------------ */

function BallotForm({ sessionNumber, userId }: { sessionNumber: number; userId: string }) {
  const [choices, setChoices] = useState<Choices>({
    glorious: { first: "", second: "" },
    impact: { first: "", second: "" },
    tech: { first: "", second: "" },
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const { data: films, isLoading: filmsLoading } = useQuery({
    queryKey: ["vote-films", sessionNumber],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("films")
        .select("id, title")
        .eq("submitted", true)
        .eq("session_number", sessionNumber)
        .order("title");
      if (error) throw error;
      return (data ?? []) as { id: string; title: string }[];
    },
  });

  // Check if this user already voted
  const { isLoading: checkLoading } = useQuery({
    queryKey: ["vote-check", userId],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("audience_votes")
        .select("id")
        .eq("user_id", userId)
        .limit(1);
      if (data && data.length > 0) setDone(true);
      return data;
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

    const rows = AWARDS.flatMap((award) => [
      { award: award.key, choice_rank: 1, film_id: choices[award.key].first, user_id: userId, session_number: sessionNumber },
      { award: award.key, choice_rank: 2, film_id: choices[award.key].second, user_id: userId, session_number: sessionNumber },
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("audience_votes").insert(rows);
    setSubmitting(false);

    if (error) {
      if (error.code === "23505") {
        setDone(true);
        toast.info("Вы уже проголосовали");
      } else {
        toast.error(error.message);
      }
      return;
    }

    setDone(true);
  };

  if (filmsLoading || checkLoading) {
    return (
      <div className="grid min-h-svh place-items-center text-muted-foreground">
        Загрузка…
      </div>
    );
  }

  if (done) {
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

  if (filmOptions.length === 0) {
    return (
      <div className="grid min-h-svh place-items-center px-4">
        <p className="text-muted-foreground">Фильмы для этого сеанса ещё не назначены.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:py-16">
      <div className="mb-8">
        <p className="text-[11px] uppercase tracking-[0.3em] text-accent/80">
          YCT · Зрительский Бланк · Сеанс {sessionNumber}
        </p>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl">
          Зрительское голосование
        </h1>
        <p className="mt-3 font-serif text-sm italic text-muted-foreground">
          По каждому аворду выберите первый и второй выбор из фильмов вашего сеанса.
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
        Один голос с одного аккаунта
      </p>
    </div>
  );
}
