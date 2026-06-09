import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UserPlus, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export function FollowButton({ authorId }: { authorId: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: count } = useQuery({
    queryKey: ["follows-count", authorId],
    queryFn: async () => {
      const { count } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("author_id", authorId);
      return count ?? 0;
    },
  });

  const { data: following } = useQuery({
    enabled: !!user && user.id !== authorId,
    queryKey: ["following", authorId, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("author_id", authorId)
        .eq("follower_id", user!.id)
        .maybeSingle();
      return !!data;
    },
  });

  if (user?.id === authorId) {
    return (
      <span className="rounded-full glass px-3 py-1 text-xs text-muted-foreground">
        Это ваша работа · {count ?? 0} подписчиков
      </span>
    );
  }

  const toggle = async () => {
    if (!user) {
      toast.error("Войдите, чтобы подписаться");
      return;
    }
    if (following) {
      await supabase.from("follows").delete().eq("author_id", authorId).eq("follower_id", user.id);
      toast.success("Вы отписались");
    } else {
      await supabase.from("follows").insert({ author_id: authorId, follower_id: user.id });
      toast.success("Вы подписаны");
    }
    qc.invalidateQueries({ queryKey: ["following", authorId] });
    qc.invalidateQueries({ queryKey: ["follows-count", authorId] });
  };

  return (
    <Button variant={following ? "glass" : "hero"} size="sm" onClick={toggle}>
      {following ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
      {following ? "Вы подписаны" : "Подписаться"}
      <span className="ml-1 rounded-full bg-black/30 px-2 py-0.5 text-[10px]">{count ?? 0}</span>
    </Button>
  );
}
