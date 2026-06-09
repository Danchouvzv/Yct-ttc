import { useMemo, useState } from "react";
import { Star } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export function FilmRating({ filmId }: { filmId: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [hover, setHover] = useState<number | null>(null);

  const { data: ratings } = useQuery({
    queryKey: ["ratings", filmId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("film_ratings")
        .select("rating,user_id")
        .eq("film_id", filmId);
      if (error) throw error;
      return data;
    },
  });

  const avg = useMemo(() => {
    if (!ratings?.length) return 0;
    return ratings.reduce((s, r) => s + r.rating, 0) / ratings.length;
  }, [ratings]);

  const myRating = useMemo(
    () => ratings?.find((r) => r.user_id === user?.id)?.rating ?? 0,
    [ratings, user?.id],
  );

  const setRating = async (value: number) => {
    if (!user) {
      toast.error("Войдите, чтобы оценить");
      return;
    }
    const { error } = await supabase
      .from("film_ratings")
      .upsert({ film_id: filmId, user_id: user.id, rating: value });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Спасибо за оценку");
    qc.invalidateQueries({ queryKey: ["ratings", filmId] });
  };

  const display = hover ?? myRating;

  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Рейтинг</p>
        <p className="font-display text-sm">
          {avg ? avg.toFixed(1) : "—"}
          <span className="text-muted-foreground"> / 5 · {ratings?.length ?? 0}</span>
        </p>
      </div>
      <div className="mt-3 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(null)}
            onClick={() => setRating(n)}
            aria-label={`${n} из 5`}
            className="p-1"
          >
            <Star
              className={`h-6 w-6 transition-all ${
                n <= display ? "text-accent fill-current drop-shadow-[0_0_8px_var(--neon)]" : "text-muted-foreground/40"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
