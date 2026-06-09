import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

type CommentRow = {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
};

export function FilmComments({ filmId }: { filmId: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const { data: comments } = useQuery({
    queryKey: ["comments", filmId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("film_comments")
        .select("id,user_id,body,created_at")
        .eq("film_id", filmId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as CommentRow[];
    },
  });

  const userIds = Array.from(new Set((comments ?? []).map((c) => c.user_id)));
  const { data: profiles } = useQuery({
    enabled: userIds.length > 0,
    queryKey: ["comment-profiles", filmId, userIds.join(",")],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id,display_name,avatar_url")
        .in("id", userIds);
      return data ?? [];
    },
  });

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Войдите, чтобы комментировать");
      return;
    }
    const text = body.trim();
    if (text.length < 1) return;
    if (text.length > 2000) {
      toast.error("Максимум 2000 символов");
      return;
    }
    setSending(true);
    const { error } = await supabase
      .from("film_comments")
      .insert({ film_id: filmId, user_id: user.id, body: text });
    setSending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setBody("");
    qc.invalidateQueries({ queryKey: ["comments", filmId] });
  };

  const onDelete = async (id: string) => {
    const { error } = await supabase.from("film_comments").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    qc.invalidateQueries({ queryKey: ["comments", filmId] });
  };

  return (
    <section className="mt-12">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="font-display text-2xl">Обсуждение</h2>
        <span className="text-xs text-muted-foreground">{comments?.length ?? 0} комментариев</span>
      </div>

      <form onSubmit={onSubmit} className="glass rounded-xl p-4">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={user ? "Поделитесь впечатлением…" : "Войдите, чтобы оставить комментарий"}
          disabled={!user || sending}
          rows={3}
          maxLength={2000}
          className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">{body.length}/2000</span>
          <Button type="submit" variant="hero" size="sm" disabled={!user || sending || !body.trim()}>
            {sending ? "Отправка…" : "Отправить"}
          </Button>
        </div>
      </form>

      <ul className="mt-6 space-y-4">
        {comments?.map((c) => {
          const p = profiles?.find((x) => x.id === c.user_id);
          const name = p?.display_name ?? "Зритель";
          const initials = name.slice(0, 2).toUpperCase();
          return (
            <li key={c.id} className="flex gap-3 reveal is-visible">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold">
                {p?.avatar_url ? (
                  <img src={p.avatar_url} alt={name} className="h-full w-full rounded-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-display text-sm">{name}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
                  {user?.id === c.user_id && (
                    <button
                      onClick={() => onDelete(c.id)}
                      className="ml-auto text-muted-foreground hover:text-destructive"
                      aria-label="Удалить"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <p className="mt-1 whitespace-pre-line font-serif text-[15px] italic leading-relaxed text-foreground/90">
                  {c.body}
                </p>
              </div>
            </li>
          );
        })}
        {comments?.length === 0 && (
          <li className="text-center text-sm font-serif italic text-muted-foreground">
            Будьте первым, кто оставит впечатление.
          </li>
        )}
      </ul>
    </section>
  );
}
