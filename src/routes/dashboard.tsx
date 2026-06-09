import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Trash2,
  Upload,
  Film as FilmIcon,
  Eye,
  Heart,
  Pencil,
  Bookmark,
  Globe,
  MapPin,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  CalendarClock,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { FilmCard } from "@/components/FilmCard";
import { EditProfileDialog } from "@/components/EditProfileDialog";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Кабинет — YCT" }] }),
});

function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"library" | "saved">("library");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  const { data: profile, isLoading: profileLoading } = useQuery({
    enabled: !!user,
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: films, isLoading: filmsLoading } = useQuery({
    enabled: !!user,
    queryKey: ["my-films", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("films")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: saved, isLoading: savedLoading } = useQuery({
    enabled: !!user,
    queryKey: ["saved-films", user?.id],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("film_saves")
        .select("film_id, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const ids = (rows ?? []).map((r) => r.film_id);
      if (!ids.length) return [];
      const { data: f } = await supabase.from("films").select("*").in("id", ids);
      return f ?? [];
    },
  });

  const { data: followers } = useQuery({
    enabled: !!user,
    queryKey: ["my-followers", user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("author_id", user!.id);
      return count ?? 0;
    },
  });

  const totalViews = films?.reduce((s, f) => s + (f.views ?? 0), 0) ?? 0;

  const handleDelete = async (id: string, videoPath: string, thumbPath: string | null) => {
    if (!confirm("Удалить этот фильм?")) return;
    await supabase.storage.from("films").remove([videoPath]).catch(() => null);
    if (thumbPath) await supabase.storage.from("thumbs").remove([thumbPath]).catch(() => null);
    const { error } = await supabase.from("films").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Удалено");
    qc.invalidateQueries({ queryKey: ["my-films"] });
    qc.invalidateQueries({ queryKey: ["films-all"] });
    qc.invalidateQueries({ queryKey: ["films-featured"] });
  };

  // Show skeleton while auth or initial data is loading — prevents content
  // flashing/disappearing on refresh.
  if (loading || (user && (profileLoading || filmsLoading))) {
    return <DashboardSkeleton />;
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      {/* Profile header */}
      <div className="glass relative mb-10 overflow-hidden rounded-3xl p-6 sm:p-8">
        <div className="pointer-events-none absolute inset-0 [background:var(--gradient-primary)] opacity-10" />
        <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl [background:var(--gradient-primary)] font-display text-3xl text-primary-foreground shadow-[var(--shadow-neon)]">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              (profile?.display_name ?? user.email ?? "?")[0]?.toUpperCase()
            )}
          </div>
          <div className="flex-1">
            <h1 className="font-display text-3xl">{profile?.display_name ?? "Автор"}</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            {profile?.bio && (
              <p className="mt-2 max-w-2xl font-serif italic text-foreground/80">{profile.bio}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
              {profile?.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-accent" /> {profile.location}
                </span>
              )}
              {profile?.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 hover:text-accent"
                >
                  <Globe className="h-3.5 w-3.5 text-accent" /> {profile.website.replace(/^https?:\/\//, "")}
                </a>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <Stat icon={<FilmIcon className="h-4 w-4" />} label="Фильмов" value={films?.length ?? 0} />
              <Stat icon={<Eye className="h-4 w-4" />} label="Просмотров" value={totalViews} />
              <Stat icon={<Users className="h-4 w-4" />} label="Подписчиков" value={followers ?? 0} />
              <Stat icon={<Heart className="h-4 w-4" />} label="Автор с" value={new Date(user.created_at).getFullYear()} />
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <EditProfileDialog
              profile={profile}
              trigger={
                <Button variant="glass" size="sm">
                  <Pencil className="h-4 w-4" /> Редактировать
                </Button>
              }
            />
            <Button asChild variant="hero" size="lg">
              <Link to="/upload">
                <Upload className="h-4 w-4" /> Загрузить фильм
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <ApplicationStatusBlock films={films ?? []} />

      {/* Tabs */}
      <div className="mb-6 flex items-center gap-2">
        <TabButton active={tab === "library"} onClick={() => setTab("library")} icon={<FilmIcon className="h-4 w-4" />}>
          Моя библиотека
        </TabButton>
        <TabButton active={tab === "saved"} onClick={() => setTab("saved")} icon={<Bookmark className="h-4 w-4" />}>
          Сохранённые
        </TabButton>
      </div>

      {tab === "library" &&
        (films && films.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {films.map((f) => (
              <div key={f.id} className="group relative">
                <FilmCard film={f} />
                <button
                  onClick={() => handleDelete(f.id, f.video_path, f.thumb_path)}
                  className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-black/60 text-destructive opacity-0 backdrop-blur transition-opacity hover:bg-black/80 group-hover:opacity-100"
                  aria-label="Удалить"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState text="Пока ни одной работы." cta="Загрузить первый фильм" />
        ))}

      {tab === "saved" &&
        (savedLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="aspect-video animate-pulse rounded-xl bg-white/5" />
            ))}
          </div>
        ) : saved && saved.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {saved.map((f) => (
              <FilmCard key={f.id} film={f} />
            ))}
          </div>
        ) : (
          <div className="glass rounded-3xl p-12 text-center">
            <Bookmark className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-4 font-serif italic text-muted-foreground">
              Ничего не сохранено. Откройте фильм и нажмите «В закладки».
            </p>
          </div>
        ))}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-all ${
        active
          ? "glass text-foreground shadow-[var(--shadow-neon)]"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon} {children}
    </button>
  );
}

function EmptyState({ text, cta }: { text: string; cta: string }) {
  return (
    <div className="glass rounded-3xl p-12 text-center">
      <FilmIcon className="mx-auto h-10 w-10 text-muted-foreground" />
      <p className="mt-4 font-serif italic text-muted-foreground">{text}</p>
      <Button asChild variant="hero" size="lg" className="mt-6">
        <Link to="/upload">{cta}</Link>
      </Button>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <span className="text-accent">{icon}</span>
      <span className="font-display text-foreground">{value}</span>
      <span>{label}</span>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="glass mb-10 h-44 animate-pulse rounded-3xl bg-white/5" />
      <div className="glass mb-6 h-28 animate-pulse rounded-2xl bg-white/5" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="aspect-video animate-pulse rounded-xl bg-white/5" />
        ))}
      </div>
    </div>
  );
}

type FilmRow = {
  id: string;
  title: string;
  status: string | null;
  submitted: boolean | null;
  submitted_at: string | null;
  moderation_note: string | null;
  created_at: string;
};

function ApplicationStatusBlock({ films }: { films: FilmRow[] }) {
  // Most recent submitted application; otherwise most recent draft
  const submitted = films.find((f) => f.submitted);
  const draft = films.find((f) => !f.submitted);
  const app = submitted ?? draft;

  if (!app) {
    return (
      <div className="glass mb-8 flex flex-col items-start justify-between gap-4 rounded-2xl p-6 sm:flex-row sm:items-center">
        <div className="flex items-start gap-4">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent/15 text-accent">
            <FileText className="h-5 w-5" />
          </span>
          <div>
            <p className="font-display text-lg">Заявка не подана</p>
            <p className="text-sm text-muted-foreground">
              Подайте заявку до окончания приёма — все данные сохранятся в кабинете.
            </p>
          </div>
        </div>
        <Button asChild variant="hero" size="lg">
          <Link to="/upload">Подать заявку</Link>
        </Button>
      </div>
    );
  }

  const status = app.status ?? "pending";
  const map: Record<string, { label: string; tone: string; icon: React.ReactNode }> = {
    pending: { label: "На модерации", tone: "text-amber-300", icon: <Clock className="h-4 w-4" /> },
    approved: { label: "Принята", tone: "text-green-400", icon: <CheckCircle2 className="h-4 w-4" /> },
    rejected: { label: "Отклонена", tone: "text-destructive", icon: <XCircle className="h-4 w-4" /> },
  };
  const s = map[status] ?? map.pending;
  const isDraft = !app.submitted;

  return (
    <div className="glass mb-8 rounded-2xl p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent/15 text-accent">
            <FileText className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Моя заявка</p>
            <p className="mt-1 font-display text-lg">{app.title}</p>
            <div className={`mt-2 inline-flex items-center gap-2 text-sm ${s.tone}`}>
              {s.icon} {isDraft ? "Черновик" : s.label}
            </div>
            {app.submitted_at && (
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarClock className="h-3 w-3" />
                Отправлено: {new Date(app.submitted_at).toLocaleString("ru-RU")}
              </p>
            )}
            {app.moderation_note && (
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                Комментарий модератора: {app.moderation_note}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="glass" size="sm">
            <Link to="/watch/$id" params={{ id: app.id }}>Открыть</Link>
          </Button>
          {isDraft && (
            <Button asChild variant="hero" size="sm">
              <Link to="/upload">Продолжить заявку</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
