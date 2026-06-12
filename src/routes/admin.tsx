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
} from "lucide-react";
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
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="films">
            <FilmIcon className="mr-1 h-4 w-4" />
            Фильмы
          </TabsTrigger>
          <TabsTrigger value="teams">
            <Users className="mr-1 h-4 w-4" />
            Команды
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
              <TableHead>Контакт</TableHead>
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
                  {p.display_name ?? "—"}
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
