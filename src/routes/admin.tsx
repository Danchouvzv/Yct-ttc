import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Shield,
  Users,
  Film as FilmIcon,
  Download,
  Search,
  ExternalLink,
  Check,
  X,
  Ban,
  Trash2,
  UserPlus,
  UserMinus,
  Mail,
  Copy,
  Tv2,
  Star,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({ meta: [{ title: "Админ-панель — YCT" }] }),
});

type Film = {
  id: string;
  user_id: string;
  title: string;
  theme: string | null;
  genres: string[] | null;
  status: "pending" | "approved" | "rejected" | "disqualified";
  moderation_note: string | null;
  created_at: string;
  submitted: boolean;
  submitted_at: string | null;
  video_path: string | null;
  thumb_path: string | null;
  description: string | null;
  conditions_log: string | null;
  portfolio_reach: string | null;
  portfolio_connect: string | null;
  portfolio_doc_path: string | null;
  participants: unknown;
};
type DisplayStatus = Film["status"] | "draft";
type Profile = {
  id: string;
  team_name: string | null;
  display_name: string | null;
  email?: string | null;
  country: string | null;
  city: string | null;
  language: string | null;
  created_at: string;
};
type Role = { user_id: string; role: "admin" | "moderator" | "user" };

function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading || roleLoading) return;
    if (!user) navigate({ to: "/login" });
    else if (!isAdmin) navigate({ to: "/" });
  }, [user, isAdmin, authLoading, roleLoading, navigate]);

  if (authLoading || roleLoading || !user || !isAdmin) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-muted-foreground">
        Проверка доступа…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <header className="mb-8 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl [background:var(--gradient-primary)] shadow-[var(--shadow-neon)]">
          <Shield className="h-5 w-5 text-primary-foreground" />
        </span>
        <div>
          <h1 className="font-display text-2xl">Админ-панель</h1>
          <p className="text-sm text-muted-foreground">Управление турниром YCT</p>
        </div>
      </header>

      <Tabs defaultValue="films" className="w-full">
        <TabsList className="grid w-full max-w-4xl grid-cols-6">
          <TabsTrigger value="films">
            <FilmIcon className="mr-1 h-4 w-4" />
            Фильмы
          </TabsTrigger>
          <TabsTrigger value="teams">
            <Users className="mr-1 h-4 w-4" />
            Команды
          </TabsTrigger>
          <TabsTrigger value="contacts">
            <Mail className="mr-1 h-4 w-4" />
            Контакты
          </TabsTrigger>
          <TabsTrigger value="screening">
            <Tv2 className="mr-1 h-4 w-4" />
            Скрининг
          </TabsTrigger>
          <TabsTrigger value="roles">
            <Shield className="mr-1 h-4 w-4" />
            Роли
          </TabsTrigger>
          <TabsTrigger value="export">
            <Download className="mr-1 h-4 w-4" />
            Экспорт
          </TabsTrigger>
        </TabsList>

        <TabsContent value="films" className="mt-6">
          <FilmsTab />
        </TabsContent>
        <TabsContent value="teams" className="mt-6">
          <TeamsTab />
        </TabsContent>
        <TabsContent value="contacts" className="mt-6">
          <ContactsTab />
        </TabsContent>
        <TabsContent value="screening" className="mt-6">
          <ScreeningTab />
        </TabsContent>
        <TabsContent value="roles" className="mt-6">
          <RolesTab currentUserId={user.id} />
        </TabsContent>
        <TabsContent value="export" className="mt-6">
          <ExportTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ============================== FILMS ============================== */

const STATUS_STYLES: Record<DisplayStatus, string> = {
  draft: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  approved: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  rejected: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  disqualified: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
};
const STATUS_LABEL: Record<DisplayStatus, string> = {
  draft: "Черновик",
  pending: "На модерации",
  approved: "Одобрен",
  rejected: "Отклонён",
  disqualified: "Дисквалифицирован",
};

function getDisplayStatus(film: Film): DisplayStatus {
  return film.submitted ? film.status : "draft";
}

function getSubmissionMeta(film: Film): { award_order?: string[]; helpers?: string[] } {
  if (!film.conditions_log) return {};
  try {
    const meta = JSON.parse(film.conditions_log) as {
      award_order?: unknown;
      helpers?: unknown;
    };
    return {
      award_order: Array.isArray(meta.award_order)
        ? meta.award_order.filter((item): item is string => typeof item === "string")
        : [],
      helpers: Array.isArray(meta.helpers)
        ? meta.helpers.filter((item): item is string => typeof item === "string")
        : [],
    };
  } catch {
    return {};
  }
}

function FilmsTab() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | DisplayStatus>("pending");

  const { data: films, isLoading } = useQuery({
    queryKey: ["admin-films"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("films")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Film[];
    },
  });

  const pendingCount = useMemo(
    () => (films ?? []).filter((f) => f.status === "pending" && f.submitted).length,
    [films],
  );

  const filtered = useMemo(() => {
    const list = films ?? [];
    return list.filter((f) => {
      if (statusFilter !== "all" && getDisplayStatus(f) !== statusFilter) return false;
      if (q && !f.title.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [films, q, statusFilter]);

  async function updateStatus(id: string, status: Film["status"], note?: string) {
    const { error } = await supabase
      .from("films")
      .update({
        status,
        moderation_note: note ?? null,
        moderated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Статус обновлён");
    qc.invalidateQueries({ queryKey: ["admin-films"] });
  }

  async function removeFilm(id: string) {
    const { error } = await supabase.from("films").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Фильм удалён");
    qc.invalidateQueries({ queryKey: ["admin-films"] });
  }

  return (
    <div className="space-y-4">
      {pendingCount > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          🔔 Новых заявок на модерации: <b>{pendingCount}</b>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск по названию…"
            className="pl-9"
          />
        </div>
        <div className="flex gap-1">
          {(["all", "draft", "pending", "approved", "rejected", "disqualified"] as const).map(
            (s) => (
              <Button
                key={s}
                size="sm"
                variant={statusFilter === s ? "default" : "outline"}
                onClick={() => setStatusFilter(s)}
              >
                {s === "all" ? "Все" : STATUS_LABEL[s as DisplayStatus]}
                {s === "pending" && pendingCount > 0 && (
                  <span className="ml-1 rounded-full bg-amber-500/30 px-1.5 text-[10px]">
                    {pendingCount}
                  </span>
                )}
              </Button>
            ),
          )}
        </div>
      </div>

      <div className="rounded-xl glass overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead>Тема</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Подача</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Загрузка…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Ничего не найдено
                </TableCell>
              </TableRow>
            )}
            {filtered.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="font-medium">{f.title}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{f.theme ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={STATUS_STYLES[getDisplayStatus(f)]}>
                    {STATUS_LABEL[getDisplayStatus(f)]}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {f.submitted
                    ? f.submitted_at
                      ? new Date(f.submitted_at).toLocaleDateString()
                      : "да"
                    : "черновик"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <FilmDetailsDialog film={f} onUpdate={updateStatus} />
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Одобрить"
                      onClick={() => updateStatus(f.id, "approved")}
                    >
                      <Check className="h-4 w-4 text-emerald-400" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Отклонить"
                      onClick={() => updateStatus(f.id, "rejected")}
                    >
                      <X className="h-4 w-4 text-rose-400" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Дисквалификация"
                      onClick={() => updateStatus(f.id, "disqualified")}
                    >
                      <Ban className="h-4 w-4 text-zinc-400" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" title="Удалить">
                          <Trash2 className="h-4 w-4 text-rose-500" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Удалить фильм?</AlertDialogTitle>
                          <AlertDialogDescription>
                            «{f.title}» будет удалён безвозвратно.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Отмена</AlertDialogCancel>
                          <AlertDialogAction onClick={() => removeFilm(f.id)}>
                            Удалить
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function FilmDetailsDialog({
  film,
  onUpdate,
}: {
  film: Film;
  onUpdate: (id: string, s: Film["status"], note?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(film.moderation_note ?? "");

  const videoUrl = film.video_path
    ? supabase.storage.from("films").getPublicUrl(film.video_path).data.publicUrl
    : null;
  const portfolioUrl = film.portfolio_doc_path
    ? supabase.storage.from("portfolios").getPublicUrl(film.portfolio_doc_path).data.publicUrl
    : null;
  const submissionMeta = getSubmissionMeta(film);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Детали
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{film.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <Info label="Тема" value={film.theme} />
            <Info label="Жанры" value={(film.genres ?? []).join(", ") || "—"} />
            <Info label="Статус" value={STATUS_LABEL[getDisplayStatus(film)]} />
            <Info label="Подано" value={film.submitted ? "да" : "нет"} />
          </div>

          <div>
            <div className="text-xs uppercase text-muted-foreground mb-1">Описание</div>
            <p className="whitespace-pre-wrap">{film.description || "—"}</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <div className="text-xs uppercase text-muted-foreground mb-1">Портфолио: Reach</div>
              <p className="whitespace-pre-wrap">{film.portfolio_reach || "—"}</p>
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground mb-1">Портфолио: Connect</div>
              <p className="whitespace-pre-wrap">{film.portfolio_connect || "—"}</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Info
              label="Порядок наград"
              value={(submissionMeta.award_order ?? []).join(" → ") || "—"}
            />
            <Info label="Помощники" value={(submissionMeta.helpers ?? []).join(", ") || "—"} />
          </div>

          <div className="flex flex-wrap gap-2">
            {videoUrl && (
              <Button asChild size="sm" variant="outline">
                <a href={videoUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-1 h-3 w-3" />
                  Видео
                </a>
              </Button>
            )}
            <Button asChild size="sm" variant="outline">
              <Link to="/watch/$id" params={{ id: film.id }}>
                Открыть страницу
              </Link>
            </Button>
            {portfolioUrl && (
              <Button asChild size="sm" variant="outline">
                <a href={portfolioUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-1 h-3 w-3" />
                  Портфолио-док
                </a>
              </Button>
            )}
          </div>

          <div>
            <div className="text-xs uppercase text-muted-foreground mb-1">Участники</div>
            <pre className="rounded-lg bg-black/30 p-3 text-xs overflow-x-auto">
              {JSON.stringify(film.participants, null, 2)}
            </pre>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase text-muted-foreground">Заметка модератора</label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Причина решения…"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="default"
                onClick={() => {
                  onUpdate(film.id, "approved", note);
                  setOpen(false);
                }}
              >
                <Check className="mr-1 h-4 w-4" />
                Одобрить
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  onUpdate(film.id, "rejected", note);
                  setOpen(false);
                }}
              >
                <X className="mr-1 h-4 w-4" />
                Отклонить
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  onUpdate(film.id, "disqualified", note);
                  setOpen(false);
                }}
              >
                <Ban className="mr-1 h-4 w-4" />
                Дисквалификация
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  onUpdate(film.id, "pending", note);
                  setOpen(false);
                }}
              >
                Вернуть на модерацию
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Info({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="text-sm">{value ?? "—"}</div>
    </div>
  );
}

/* ============================== TEAMS ============================== */

function TeamsTab() {
  const [q, setQ] = useState("");
  const { data: profiles, isLoading } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Profile[];
    },
  });

  const filtered = useMemo(() => {
    const list = profiles ?? [];
    if (!q) return list;
    const lower = q.toLowerCase();
    return list.filter(
      (p) =>
        (p.team_name ?? "").toLowerCase().includes(lower) ||
        (p.display_name ?? "").toLowerCase().includes(lower) ||
        (p.email ?? "").toLowerCase().includes(lower) ||
        (p.country ?? "").toLowerCase().includes(lower) ||
        (p.city ?? "").toLowerCase().includes(lower),
    );
  }, [profiles, q]);

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Поиск команд…"
          className="pl-9"
        />
      </div>

      <div className="rounded-xl glass overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Команда</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Страна / Город</TableHead>
              <TableHead>Язык</TableHead>
              <TableHead>Регистрация</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Загрузка…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Нет команд
                </TableCell>
              </TableRow>
            )}
            {filtered.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">
                  {p.team_name ?? p.display_name ?? "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {p.email ? (
                    <a href={`mailto:${p.email}`} className="hover:text-accent underline-offset-2 hover:underline">
                      {p.email}
                    </a>
                  ) : "—"}
                </TableCell>
                <TableCell className="text-sm">
                  {[p.country, p.city].filter(Boolean).join(", ") || "—"}
                </TableCell>
                <TableCell className="text-sm uppercase text-muted-foreground">
                  {p.language ?? "—"}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(p.created_at).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">Всего команд: {filtered.length}</p>
    </div>
  );
}

/* ============================== CONTACTS ============================== */

type ParticipantRow = { full_name?: string; email?: string; role?: string };

function ContactsTab() {
  const [q, setQ] = useState("");

  const { data: films, isLoading: filmsLoading } = useQuery({
    queryKey: ["admin-contacts-films"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("films")
        .select("id, title, user_id, participants, submitted")
        .eq("submitted", true);
      if (error) throw error;
      return data as { id: string; title: string; user_id: string; participants: unknown; submitted: boolean }[];
    },
  });

  const { data: profiles, isLoading: profilesLoading } = useQuery({
    queryKey: ["admin-contacts-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, team_name, display_name")
        .not("team_name", "is", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as { id: string; team_name: string | null; display_name: string | null }[];
    },
  });

  const rows = useMemo(() => {
    if (!profiles) return [];
    // Build a map: user_id → participant emails from submitted film
    const filmEmailMap = new Map<string, { filmTitle: string; emails: string[] }>();
    for (const film of films ?? []) {
      const parts = Array.isArray(film.participants) ? (film.participants as ParticipantRow[]) : [];
      const emails = parts.map((p) => p.email).filter((e): e is string => Boolean(e));
      filmEmailMap.set(film.user_id, { filmTitle: film.title, emails });
    }
    return profiles.map((p) => {
      const teamName = p.team_name ?? p.display_name ?? "—";
      const filmData = filmEmailMap.get(p.id);
      return {
        teamName,
        filmTitle: filmData?.filmTitle ?? null,
        emails: filmData?.emails ?? [],
      };
    });
  }, [films, profiles]);

  const filtered = useMemo(() => {
    if (!q) return rows;
    const lower = q.toLowerCase();
    return rows.filter(
      (r) =>
        r.teamName.toLowerCase().includes(lower) ||
        (r.filmTitle ?? "").toLowerCase().includes(lower) ||
        r.emails.some((e) => e.toLowerCase().includes(lower)),
    );
  }, [rows, q]);

  const allEmails = useMemo(() => [...new Set(rows.flatMap((r) => r.emails))], [rows]);

  const copyAll = () => {
    navigator.clipboard.writeText(allEmails.join(", "));
    toast.success(`Скопировано ${allEmails.length} email`);
  };

  const isLoading = filmsLoading || profilesLoading;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск по команде или email…"
            className="pl-9"
          />
        </div>
        <Button size="sm" variant="outline" onClick={copyAll} disabled={allEmails.length === 0}>
          <Copy className="mr-1 h-4 w-4" />
          Скопировать все ({allEmails.length})
        </Button>
      </div>

      <div className="rounded-xl glass overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Команда</TableHead>
              <TableHead>Email участников</TableHead>
              <TableHead>Заявка</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                  Загрузка…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                  Нет зарегистрированных команд
                </TableCell>
              </TableRow>
            )}
            {filtered.map((row, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium">{row.teamName}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {row.emails.length === 0 ? (
                      <span className="text-muted-foreground text-sm">—</span>
                    ) : (
                      row.emails.map((email) => (
                        <a
                          key={email}
                          href={`mailto:${email}`}
                          className="text-sm text-accent hover:underline underline-offset-2"
                        >
                          {email}
                        </a>
                      ))
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {row.filmTitle ? (
                    <span className="text-emerald-400">{row.filmTitle}</span>
                  ) : (
                    <span className="opacity-50">нет заявки</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">
        Команд: {filtered.length} · Уникальных email: {allEmails.length}
      </p>
    </div>
  );
}

/* ============================== ROLES ============================== */

function RolesTab({ currentUserId }: { currentUserId: string }) {
  const qc = useQueryClient();
  const [q, setQ] = useState("");

  const { data: profiles } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Profile[];
    },
  });

  const { data: roles } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("user_id, role");
      if (error) throw error;
      return data as Role[];
    },
  });

  const adminSet = useMemo(
    () => new Set((roles ?? []).filter((r) => r.role === "admin").map((r) => r.user_id)),
    [roles],
  );

  const filtered = useMemo(() => {
    const list = profiles ?? [];
    if (!q) return list;
    const lower = q.toLowerCase();
    return list.filter(
      (p) =>
        (p.team_name ?? "").toLowerCase().includes(lower) ||
        (p.display_name ?? "").toLowerCase().includes(lower),
    );
  }, [profiles, q]);

  async function grant(userId: string) {
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
    if (error) return toast.error(error.message);
    toast.success("Роль admin выдана");
    qc.invalidateQueries({ queryKey: ["admin-roles"] });
  }
  async function revoke(userId: string) {
    if (userId === currentUserId) return toast.error("Нельзя снять роль с себя");
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", "admin");
    if (error) return toast.error(error.message);
    toast.success("Роль admin снята");
    qc.invalidateQueries({ queryKey: ["admin-roles"] });
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Поиск…"
          className="pl-9"
        />
      </div>
      <div className="rounded-xl glass overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Пользователь</TableHead>
              <TableHead>Команда</TableHead>
              <TableHead>Роль</TableHead>
              <TableHead className="text-right">Действие</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => {
              const isAdmin = adminSet.has(p.id);
              return (
                <TableRow key={p.id}>
                  <TableCell>{p.display_name ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {p.team_name ?? "—"}
                  </TableCell>
                  <TableCell>
                    {isAdmin ? (
                      <Badge className="bg-primary/20 text-primary border border-primary/40">
                        admin
                      </Badge>
                    ) : (
                      <Badge variant="outline">user</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {isAdmin ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => revoke(p.id)}
                        disabled={p.id === currentUserId}
                      >
                        <UserMinus className="mr-1 h-4 w-4" />
                        Снять admin
                      </Button>
                    ) : (
                      <Button size="sm" variant="default" onClick={() => grant(p.id)}>
                        <UserPlus className="mr-1 h-4 w-4" />
                        Сделать admin
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/* ============================== SCREENING ============================== */

const SCREENING_AWARDS = [
  { key: "impact", name: "Impact Award", color: "text-violet-400" },
  { key: "tech",   name: "Tech Award",   color: "text-sky-400"    },
] as const;

function ScreeningTab() {
  const [selectedFilmId, setSelectedFilmId] = useState<string>("");

  const { data: films, isLoading: filmsLoading } = useQuery({
    queryKey: ["screening-films"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("films")
        .select("id, title")
        .eq("submitted", true)
        .order("title");
      if (error) throw error;
      return data as { id: string; title: string }[];
    },
  });

  const { data: votes, isLoading: votesLoading, refetch } = useQuery({
    queryKey: ["screening-votes", selectedFilmId],
    enabled: Boolean(selectedFilmId),
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("audience_votes")
        .select("award, score")
        .eq("film_id", selectedFilmId);
      if (error) throw error;
      return (data ?? []) as { award: string; score: number }[];
    },
  });

  const voteUrl =
    selectedFilmId
      ? `${typeof window !== "undefined" ? window.location.origin : ""}/vote/${selectedFilmId}`
      : "";

  // Aggregate: per award → count + avg
  const stats = SCREENING_AWARDS.map((a) => {
    const awardVotes = (votes ?? []).filter((v) => v.award === a.key);
    const avg = awardVotes.length
      ? awardVotes.reduce((s, v) => s + v.score, 0) / awardVotes.length
      : null;
    return { ...a, count: awardVotes.length, avg };
  });

  const totalVoters = selectedFilmId
    ? new Set((votes ?? []).map((_, i) => i)).size / SCREENING_AWARDS.length // rough unique estimate
    : 0;

  return (
    <div className="space-y-6">
      {/* Film selector */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <h2 className="font-display text-lg flex items-center gap-2">
          <Tv2 className="h-5 w-5 text-accent" />
          Выберите фильм для показа
        </h2>
        <select
          value={selectedFilmId}
          onChange={(e) => setSelectedFilmId(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-[var(--neon)]"
        >
          <option value="">— выберите фильм —</option>
          {filmsLoading && <option disabled>Загрузка…</option>}
          {(films ?? []).map((f) => (
            <option key={f.id} value={f.id}>
              {f.title}
            </option>
          ))}
        </select>
      </div>

      {selectedFilmId && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* QR code */}
          <div className="glass rounded-2xl p-6 flex flex-col items-center gap-4">
            <h3 className="font-display text-base self-start">QR для зрителей</h3>
            <div className="rounded-xl bg-white p-4">
              <QRCodeSVG value={voteUrl} size={200} />
            </div>
            <p className="text-xs text-center text-muted-foreground break-all">{voteUrl}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(voteUrl);
                toast.success("Ссылка скопирована");
              }}
            >
              <Copy className="mr-1 h-4 w-4" />
              Скопировать ссылку
            </Button>
          </div>

          {/* Vote results */}
          <div className="glass rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base">Результаты голосования</h3>
              <Button size="sm" variant="ghost" onClick={() => refetch()} disabled={votesLoading}>
                Обновить
              </Button>
            </div>

            {votesLoading ? (
              <p className="text-sm text-muted-foreground">Загрузка…</p>
            ) : (
              <>
                {stats.map((s) => (
                  <div key={s.key} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className={`font-medium ${s.color}`}>{s.name}</span>
                      <span className="text-muted-foreground">{s.count} голосов</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2 flex-1 rounded-full bg-white/10">
                        <div
                          className="h-2 rounded-full bg-accent transition-all"
                          style={{ width: s.avg ? `${(s.avg / 5) * 100}%` : "0%" }}
                        />
                      </div>
                      <span className="w-10 text-right text-sm font-display">
                        {s.avg !== null ? s.avg.toFixed(1) : "—"}
                      </span>
                      <div className="flex">
                        {[1,2,3,4,5].map((n) => (
                          <Star
                            key={n}
                            className={`h-3.5 w-3.5 ${n <= Math.round(s.avg ?? 0) ? "fill-accent text-accent" : "text-white/20"}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground pt-2 border-t border-white/10">
                  Проголосовало устройств: ~{Math.round((votes ?? []).length / SCREENING_AWARDS.length)}
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* All films results table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-display text-base">Сводная таблица по всем фильмам</h3>
        </div>
        <AllFilmsResults films={films ?? []} />
      </div>
    </div>
  );
}

function AllFilmsResults({ films }: { films: { id: string; title: string }[] }) {
  const { data: allVotes, isLoading } = useQuery({
    queryKey: ["all-audience-votes"],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("audience_votes")
        .select("film_id, award, score");
      if (error) throw error;
      return (data ?? []) as { film_id: string; award: string; score: number }[];
    },
  });

  const rows = films.map((f) => {
    const fv = (allVotes ?? []).filter((v) => v.film_id === f.id);
    const perAward = SCREENING_AWARDS.map((a) => {
      const av = fv.filter((v) => v.award === a.key);
      return {
        key: a.key,
        name: a.name,
        color: a.color,
        avg: av.length ? av.reduce((s, v) => s + v.score, 0) / av.length : null,
        count: av.length,
      };
    });
    const totalScore = perAward.every((a) => a.avg !== null)
      ? perAward.reduce((s, a) => s + (a.avg ?? 0), 0) / perAward.length
      : null;
    return { film: f, perAward, totalScore, voters: Math.round(fv.length / SCREENING_AWARDS.length) };
  });

  // Sort by totalScore desc
  rows.sort((a, b) => (b.totalScore ?? -1) - (a.totalScore ?? -1));

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>#</TableHead>
          <TableHead>Фильм</TableHead>
          {SCREENING_AWARDS.map((a) => (
            <TableHead key={a.key} className={a.color}>{a.name}</TableHead>
          ))}
          <TableHead>Итог</TableHead>
          <TableHead className="text-right">Зрит.</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading && (
          <TableRow>
            <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
              Загрузка…
            </TableCell>
          </TableRow>
        )}
        {!isLoading && rows.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
              Нет фильмов
            </TableCell>
          </TableRow>
        )}
        {rows.map((row, idx) => (
          <TableRow key={row.film.id}>
            <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
            <TableCell className="font-medium">{row.film.title}</TableCell>
            {row.perAward.map((a) => (
              <TableCell key={a.key} className="text-sm">
                {a.avg !== null ? (
                  <span className={`font-display ${a.color}`}>{a.avg.toFixed(1)}</span>
                ) : (
                  <span className="text-muted-foreground/50">—</span>
                )}
              </TableCell>
            ))}
            <TableCell>
              {row.totalScore !== null ? (
                <span className="font-display text-accent">{row.totalScore.toFixed(1)}</span>
              ) : (
                <span className="text-muted-foreground/50">—</span>
              )}
            </TableCell>
            <TableCell className="text-right text-muted-foreground text-sm">
              {row.voters || "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/* ============================== EXPORT ============================== */

function ExportTab() {
  const downloadCsv = (filename: string, rows: Record<string, unknown>[]) => {
    if (!rows.length) return toast.error("Нет данных");
    const headers = Object.keys(rows[0]);
    const escape = (v: unknown) => {
      if (v === null || v === undefined) return "";
      const s = typeof v === "object" ? JSON.stringify(v) : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [
      headers.join(","),
      ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
    ].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportTeams = async () => {
    const { data, error } = await supabase.from("profiles").select("*");
    if (error) return toast.error(error.message);
    downloadCsv(`teams_${new Date().toISOString().slice(0, 10)}.csv`, data ?? []);
  };
  const exportFilms = async () => {
    const { data, error } = await supabase.from("films").select("*");
    if (error) return toast.error(error.message);
    downloadCsv(`films_${new Date().toISOString().slice(0, 10)}.csv`, data ?? []);
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <button
        onClick={exportTeams}
        className="rounded-2xl glass p-6 text-left transition hover:bg-white/5"
      >
        <Users className="h-6 w-6 text-primary" />
        <div className="mt-3 font-display text-lg">Команды (CSV)</div>
        <p className="mt-1 text-sm text-muted-foreground">
          Все зарегистрированные команды со страной, городом, языком.
        </p>
      </button>
      <button
        onClick={exportFilms}
        className="rounded-2xl glass p-6 text-left transition hover:bg-white/5"
      >
        <FilmIcon className="h-6 w-6 text-primary" />
        <div className="mt-3 font-display text-lg">Фильмы (CSV)</div>
        <p className="mt-1 text-sm text-muted-foreground">
          Все заявки фильмов со статусами и метаданными.
        </p>
      </button>
    </div>
  );
}
