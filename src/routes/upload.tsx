import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { z } from "zod";
import { toast } from "sonner";
import {
  UploadCloud,
  Image as ImageIcon,
  FileText,
  Send,
  Save,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Users,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";

const MIN_DURATION_SECONDS = 5 * 60; // 5 minutes
const MAX_DURATION_SECONDS = 16 * 60; // 16 minutes
const MAX_VIDEO_SIZE_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB
const MAX_DESCRIPTION_WORDS = 75;
const MIN_PORTFOLIO_WORDS = 10;
const MAX_PORTFOLIO_WORDS = 300;
const MAX_GENRES = 3;
const AWARDS = ["Impact award", "Tech award"] as const;

export const Route = createFileRoute("/upload")({
  component: SubmitPage,
  validateSearch: (search: Record<string, unknown>) => ({
    draft: typeof search.draft === "string" ? search.draft : undefined,
  }),
  head: () => ({ meta: [{ title: "Submit — YCT" }] }),
});

type Participant = {
  full_name: string;
  email: string;
  phone: string;
  dob: string;
  role: string;
};

type SubmissionMeta = {
  award_order?: string[];
  helpers?: string[];
};

type DraftFilm = {
  id: string;
  title: string | null;
  description: string | null;
  theme: string | null;
  genres: string[] | null;
  portfolio_reach: string | null;
  portfolio_connect: string | null;
  portfolio_doc_path: string | null;
  participants: unknown;
  conditions_log: string | null;
  video_path: string | null;
  thumb_path: string | null;
  duration_seconds: number | null;
};

const emptyP: Participant = { full_name: "", email: "", phone: "", dob: "", role: "" };

const participantSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().email().max(255),
  phone: z.string().trim().min(5).max(40),
  dob: z.string().min(4),
  role: z.string().trim().min(2).max(120),
});

function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function limitWords(value: string, maxWords: number) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return value;
  return words.slice(0, maxWords).join(" ");
}

function parseGenres(value: string) {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function normalizeParticipants(value: unknown) {
  const rows = Array.isArray(value) ? value : [];
  const normalized = rows
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const p = row as Partial<Record<keyof Participant, unknown>>;
      return {
        full_name: typeof p.full_name === "string" ? p.full_name : "",
        email: typeof p.email === "string" ? p.email : "",
        phone: typeof p.phone === "string" ? p.phone : "",
        dob: typeof p.dob === "string" ? p.dob : "",
        role: typeof p.role === "string" ? p.role : "",
      };
    })
    .filter((p): p is Participant => Boolean(p));

  while (normalized.length < 3) normalized.push({ ...emptyP });
  return normalized.slice(0, 7);
}

function parseSubmissionMeta(value: string | null): SubmissionMeta {
  if (!value) return {};
  try {
    const meta = JSON.parse(value) as { award_order?: unknown; helpers?: unknown };
    return {
      award_order: Array.isArray(meta.award_order)
        ? meta.award_order.filter((item): item is string => typeof item === "string")
        : undefined,
      helpers: Array.isArray(meta.helpers)
        ? meta.helpers.filter((item): item is string => typeof item === "string").slice(0, 10)
        : undefined,
    };
  } catch {
    return {};
  }
}

function SubmitPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { draft: draftId } = Route.useSearch();
  const { t } = useI18n();

  const videoRef = useRef<HTMLInputElement>(null);
  const thumbRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);

  const [video, setVideo] = useState<File | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [durationStatus, setDurationStatus] = useState<"ok" | "too-short" | "too-long" | null>(
    null,
  );
  const [thumb, setThumb] = useState<File | null>(null);
  const [doc, setDoc] = useState<File | null>(null);

  const [title, setTitle] = useState("");
  const [theme, setTheme] = useState<"theme_1" | "theme_2" | "">("");
  const [description, setDescription] = useState("");
  const [genres, setGenres] = useState("");
  const [reach, setReach] = useState("");
  const [connect, setConnect] = useState("");
  const [awardOrder, setAwardOrder] = useState<string[]>([...AWARDS]);
  const [helpers, setHelpers] = useState<string[]>([]);
  const [loadedDraftId, setLoadedDraftId] = useState<string | null>(null);
  const [existingVideoPath, setExistingVideoPath] = useState<string | null>(null);
  const [existingThumbPath, setExistingThumbPath] = useState<string | null>(null);
  const [existingDocPath, setExistingDocPath] = useState<string | null>(null);

  const [participants, setParticipants] = useState<Participant[]>([
    { ...emptyP },
    { ...emptyP },
    { ...emptyP },
  ]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const descriptionWords = countWords(description);
  const reachWords = countWords(reach);
  const connectWords = countWords(connect);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user || !draftId || loadedDraftId === draftId) return;

    let cancelled = false;

    async function loadDraft() {
      const { data, error } = await supabase
        .from("films")
        .select(
          "id,title,description,theme,genres,portfolio_reach,portfolio_connect,portfolio_doc_path,participants,conditions_log,video_path,thumb_path,duration_seconds",
        )
        .eq("id", draftId)
        .eq("user_id", user.id)
        .eq("submitted", false)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error("[draft] load failed", error);
        toast.error("Не удалось загрузить черновик");
        return;
      }

      if (!data) {
        toast.error("Черновик не найден");
        navigate({ to: "/dashboard" });
        return;
      }

      const draft = data as DraftFilm;
      const meta = parseSubmissionMeta(draft.conditions_log);
      const savedAwardOrder =
        meta.award_order?.filter((award) => AWARDS.includes(award as (typeof AWARDS)[number])) ??
        [];
      const normalizedAwardOrder = [
        ...savedAwardOrder,
        ...AWARDS.filter((award) => !savedAwardOrder.includes(award)),
      ].slice(0, AWARDS.length);

      setLoadedDraftId(draft.id);
      setTitle(draft.title === "Draft" ? "" : (draft.title ?? ""));
      setTheme(draft.theme === "theme_1" || draft.theme === "theme_2" ? draft.theme : "");
      setDescription(draft.description ?? "");
      setGenres((draft.genres ?? []).slice(0, MAX_GENRES).join(", "));
      setReach(draft.portfolio_reach ?? "");
      setConnect(draft.portfolio_connect ?? "");
      setParticipants(normalizeParticipants(draft.participants));
      setAwardOrder(normalizedAwardOrder);
      setHelpers(meta.helpers ?? []);
      setExistingVideoPath(draft.video_path || null);
      setExistingThumbPath(draft.thumb_path || null);
      setExistingDocPath(draft.portfolio_doc_path || null);
      setDuration(draft.duration_seconds);
      setDurationStatus(
        draft.duration_seconds == null
          ? null
          : draft.duration_seconds < MIN_DURATION_SECONDS
            ? "too-short"
            : draft.duration_seconds > MAX_DURATION_SECONDS
              ? "too-long"
              : "ok",
      );
    }

    void loadDraft();

    return () => {
      cancelled = true;
    };
  }, [draftId, loadedDraftId, navigate, user]);

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  const onPickVideo = (file: File | null) => {
    setVideo(file);
    if (file) setExistingVideoPath(null);
    setDuration(null);
    setDurationStatus(null);
    if (!file) return;

    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      toast.error("Файл слишком большой. Максимум 2 ГБ.");
      setVideo(null);
      return;
    }

    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.src = url;
    v.onloadedmetadata = () => {
      const dur = Math.round(v.duration);
      setDuration(dur);
      URL.revokeObjectURL(url);

      if (dur < MIN_DURATION_SECONDS) {
        setDurationStatus("too-short");
      } else if (dur > MAX_DURATION_SECONDS) {
        setDurationStatus("too-long");
      } else {
        setDurationStatus("ok");
      }
    };
    v.onerror = () => {
      URL.revokeObjectURL(url);
      toast.error("Не удалось определить длительность видео");
    };
  };

  const updateParticipant = (i: number, key: keyof Participant, value: string) => {
    setParticipants((arr) => arr.map((p, idx) => (idx === i ? { ...p, [key]: value } : p)));
  };

  const addParticipant = () => {
    if (participants.length >= 7) return;
    setParticipants([...participants, { ...emptyP }]);
  };

  const addHelper = () => {
    if (helpers.length >= 10) return;
    setHelpers([...helpers, ""]);
  };

  const updateHelper = (i: number, value: string) => {
    setHelpers((arr) => arr.map((helper, idx) => (idx === i ? value : helper)));
  };

  const removeHelper = (i: number) => {
    setHelpers((arr) => arr.filter((_, idx) => idx !== i));
  };

  const updateAwardOrder = (index: number, value: string) => {
    setAwardOrder((arr) => {
      const next = [...arr];
      const old = next[index];
      const duplicateIndex = next.findIndex((award) => award === value);
      next[index] = value;
      if (duplicateIndex !== -1 && duplicateIndex !== index) next[duplicateIndex] = old;
      return next;
    });
  };

  const updateDescription = (value: string) => {
    if (countWords(value) > MAX_DESCRIPTION_WORDS) {
      setDescription(limitWords(value, MAX_DESCRIPTION_WORDS));
      toast.info(`Краткое описание: максимум ${MAX_DESCRIPTION_WORDS} слов`);
      return;
    }
    setDescription(value);
  };

  const updateGenres = (value: string) => {
    const parsed = parseGenres(value);
    if (parsed.length > MAX_GENRES) {
      setGenres(parsed.slice(0, MAX_GENRES).join(", "));
      toast.info(`Жанры: максимум ${MAX_GENRES}`);
      return;
    }
    setGenres(value);
  };

  const validateWordRange = (value: string, label: string) => {
    const words = countWords(value);
    if (words < MIN_PORTFOLIO_WORDS || words > MAX_PORTFOLIO_WORDS) {
      toast.error(`${label}: от ${MIN_PORTFOLIO_WORDS} до ${MAX_PORTFOLIO_WORDS} слов`);
      return false;
    }
    return true;
  };

  const removeParticipant = (i: number) => {
    if (i < 3) return; // first 3 required
    setParticipants(participants.filter((_, idx) => idx !== i));
  };

  const submit = async (asDraft: boolean) => {
    if (!user) return;

    if (!asDraft) {
      if (!video && !existingVideoPath) return toast.error(t("sub_video"));
      if (!title.trim()) return toast.error(t("sub_film_title"));
      if (countWords(description) > MAX_DESCRIPTION_WORDS) {
        return toast.error(`Краткое описание: максимум ${MAX_DESCRIPTION_WORDS} слов`);
      }
      if (parseGenres(genres).length > MAX_GENRES) {
        return toast.error(`Жанры: максимум ${MAX_GENRES}`);
      }
      if (reach.trim() && !validateWordRange(reach, "Reach")) return;
      if (connect.trim() && !validateWordRange(connect, "Connect")) return;
      if (!theme) return toast.error(t("sub_theme"));
      if (durationStatus === "too-short") return toast.error(t("sub_err_duration_min"));
      if (durationStatus === "too-long") return toast.error(t("sub_err_duration_max"));

      // first 3 participants required
      for (let i = 0; i < 3; i++) {
        const p = participantSchema.safeParse(participants[i]);
        if (!p.success) return toast.error(`#${i + 1}: ${p.error.issues[0].message}`);
        // Check DOB: must be born from 2003 through the current year inclusive
        const dobYear = new Date(participants[i].dob).getFullYear();
        if (!isNaN(dobYear) && (dobYear < 2003 || dobYear > currentYear)) {
          return toast.error(`#${i + 1}: год рождения должен быть с 2003 по текущий`);
        }
      }
      // optional: validate the rest if any field filled
      for (let i = 3; i < participants.length; i++) {
        const has = Object.values(participants[i]).some((v) => v.trim());
        if (has) {
          const p = participantSchema.safeParse(participants[i]);
          if (!p.success) return toast.error(`#${i + 1}: ${p.error.issues[0].message}`);
          const dobYear = new Date(participants[i].dob).getFullYear();
          if (!isNaN(dobYear) && (dobYear < 2003 || dobYear > currentYear)) {
            return toast.error(`#${i + 1}: год рождения должен быть с 2003 по текущий`);
          }
        }
      }
    }

    setBusy(true);
    setProgress(5);

    let videoPath: string | null = existingVideoPath;
    let thumbPath: string | null = existingThumbPath;
    let docPath: string | null = existingDocPath;
    const ts = Date.now();

    try {
      // Re-check session right before upload — RLS rejects without a valid bearer
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error("Сессия истекла. Войдите снова.");
      }

      if (video) {
        const ext = (video.name.split(".").pop() ?? "mp4").toLowerCase();
        videoPath = `${user.id}/${ts}.${ext}`;
        const { error } = await supabase.storage
          .from("films")
          .upload(videoPath, video, { contentType: video.type || "video/mp4", upsert: true });
        if (error) {
          console.error("[submit] video upload failed", error);
          throw new Error("Видео: " + error.message);
        }
        setProgress(50);
      }

      if (thumb) {
        const ext = (thumb.name.split(".").pop() ?? "jpg").toLowerCase();
        thumbPath = `${user.id}/${ts}.${ext}`;
        const { error } = await supabase.storage
          .from("thumbs")
          .upload(thumbPath, thumb, { contentType: thumb.type || "image/jpeg", upsert: true });
        if (error) {
          console.error("[submit] thumb upload failed", error);
          throw new Error("Обложка: " + error.message);
        }
        setProgress(70);
      }

      if (doc) {
        if (doc.size > 10 * 1024 * 1024) throw new Error("PDF > 10MB");
        const ext = (doc.name.split(".").pop() ?? "pdf").toLowerCase();
        docPath = `${user.id}/${ts}.${ext}`;
        const { error } = await supabase.storage
          .from("portfolios")
          .upload(docPath, doc, { contentType: doc.type || "application/pdf", upsert: true });
        if (error) {
          console.error("[submit] portfolio upload failed", error);
          throw new Error("Портфолио: " + error.message);
        }
        setProgress(85);
      }

      const tagArr = parseGenres(genres).slice(0, MAX_GENRES);

      if (!asDraft && !videoPath) {
        toast.warning("Загрузите видео перед отправкой");
        setBusy(false);
        return;
      }

      const trimmedHelpers = helpers.map((helper) => helper.trim()).filter(Boolean);
      const submissionMeta = {
        award_order: awardOrder,
        helpers: trimmedHelpers,
      };

      const payload = {
        user_id: user.id,
        title: title.trim() || "Draft",
        description: description.trim() || null,
        theme: theme || null,
        // Store in both `genres` (tournament logic) and `tags` (UI display / explore filter)
        genres: tagArr,
        tags: tagArr,
        conditions_log: JSON.stringify(submissionMeta),
        portfolio_reach: reach.trim() || null,
        portfolio_connect: connect.trim() || null,
        portfolio_doc_path: docPath,
        participants: participants.filter((p) => Object.values(p).some((v) => v.trim())),
        video_path: videoPath || "",
        thumb_path: thumbPath,
        duration_seconds: duration,
        submitted: !asDraft,
        submitted_at: asDraft ? null : new Date().toISOString(),
        status: "pending" as const,
      };

      const query = loadedDraftId
        ? supabase.from("films").update(payload).eq("id", loadedDraftId).eq("user_id", user.id)
        : supabase.from("films").insert(payload);

      const { data: inserted, error: iErr } = await query.select("id").single();

      if (iErr) {
        console.error("[submit] films insert failed", iErr, payload);
        throw new Error("База: " + iErr.message);
      }

      setProgress(100);
      if (asDraft) {
        toast.success("Черновик сохранён");
        navigate({ to: "/dashboard" });
      } else {
        toast.success("Заявка отправлена и ждёт модерации администратора", { duration: 6000 });
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      console.error("[submit] failed", err);
      const msg = err instanceof Error ? err.message : "Ошибка отправки";
      toast.error(msg, { duration: 8000 });
    } finally {
      setBusy(false);
    }
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <header className="glass relative overflow-hidden rounded-3xl p-6 sm:p-8">
        <div className="pointer-events-none absolute inset-0 [background:var(--gradient-primary)] opacity-10" />
        <div className="relative">
          <p className="text-[11px] uppercase tracking-[0.28em] text-accent/80">YCT 2026</p>
          <h1 className="mt-3 font-display text-4xl text-gradient sm:text-5xl">{t("sub_title")}</h1>
          <p className="mt-3 max-w-2xl font-serif text-lg italic text-muted-foreground">
            Загрузите фильм, выберите одну из двух тем и проверьте состав команды перед отправкой на
            модерацию.
          </p>
        </div>
      </header>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <RuleCard icon={<Clock className="h-4 w-4" />} label="Хронометраж" value="5–16 минут" />
        <RuleCard icon={<Users className="h-4 w-4" />} label="Команда" value="3–7 человек" />
      </div>

      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          submit(false);
        }}
        className="mt-10 space-y-10"
      >
        {/* SECTION: FILM */}
        <Section title={t("sub_film")}>
          {/* Video */}
          <div
            onClick={() => videoRef.current?.click()}
            className={`glass cursor-pointer rounded-3xl border-dashed p-8 text-center transition-all hover:shadow-[var(--shadow-neon)] ${
              durationStatus === "ok"
                ? "border-green-400/40"
                : durationStatus === "too-short" || durationStatus === "too-long"
                  ? "border-destructive/40"
                  : ""
            }`}
            style={{ borderStyle: "dashed", borderWidth: 1 }}
          >
            <input
              ref={videoRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => onPickVideo(e.target.files?.[0] ?? null)}
            />
            {durationStatus === "ok" ? (
              <CheckCircle2 className="mx-auto h-9 w-9 text-green-400" />
            ) : durationStatus === "too-short" || durationStatus === "too-long" ? (
              <AlertCircle className="mx-auto h-9 w-9 text-destructive" />
            ) : (
              <UploadCloud className="mx-auto h-9 w-9 text-accent" />
            )}
            <p className="mt-3 font-display text-lg">{video ? video.name : t("sub_video")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("sub_video_hint")}</p>
            {duration !== null && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-sm">
                <Clock className="h-3.5 w-3.5 text-accent" />
                <span
                  className={
                    durationStatus === "ok"
                      ? "text-green-400"
                      : durationStatus === "too-short" || durationStatus === "too-long"
                        ? "text-destructive"
                        : "text-foreground"
                  }
                >
                  {formatDuration(duration)}
                </span>
                {durationStatus === "ok" && <span className="text-green-400/80 text-xs">✓ OK</span>}
                {durationStatus === "too-short" && (
                  <span className="text-destructive text-xs">— слишком короткое</span>
                )}
                {durationStatus === "too-long" && (
                  <span className="text-destructive text-xs">— слишком длинное</span>
                )}
              </div>
            )}
          </div>

          {/* Thumb */}
          <div
            onClick={() => thumbRef.current?.click()}
            className="glass flex cursor-pointer items-center gap-4 rounded-2xl p-4 hover:bg-white/10"
          >
            <input
              ref={thumbRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setThumb(e.target.files?.[0] ?? null)}
            />
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/5">
              <ImageIcon className="h-5 w-5 text-accent" />
            </span>
            <p className="text-sm">{thumb ? thumb.name : t("sub_thumb")}</p>
          </div>

          <Input label={t("sub_film_title")} value={title} onChange={setTitle} />

          <div>
            <span className="mb-2 block text-[11px] uppercase tracking-wider text-muted-foreground">
              {t("sub_theme")}
            </span>
            <div className="grid gap-4 sm:grid-cols-2">
              {(["theme_1", "theme_2"] as const).map((th) => (
                <button
                  type="button"
                  key={th}
                  onClick={() => setTheme(th)}
                  className={`min-h-28 rounded-2xl border p-5 text-left transition-all ${
                    theme === th
                      ? "border-[var(--neon)] bg-white/10 shadow-[0_0_0_4px_color-mix(in_oklab,var(--neon)_18%,transparent)]"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <span className="text-[10px] uppercase tracking-[0.25em] text-accent/80">
                    {th === "theme_1" ? "01" : "02"}
                  </span>
                  <p className="mt-3 font-display text-xl">
                    {t(th === "theme_1" ? "sub_theme_1" : "sub_theme_2")}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <Textarea
            label={`${t("sub_desc")} (${descriptionWords}/${MAX_DESCRIPTION_WORDS})`}
            value={description}
            onChange={updateDescription}
            rows={4}
          />
          <Input
            label={t("sub_genres")}
            value={genres}
            onChange={updateGenres}
            placeholder="drama, noir, doc"
          />
        </Section>

        {/* SECTION: PORTFOLIO */}
        <Section title={t("sub_portfolio")} hint={t("sub_portfolio_hint")}>
          <Textarea
            label={`${t("sub_reach")} (${reachWords}/${MAX_PORTFOLIO_WORDS})`}
            value={reach}
            onChange={setReach}
            rows={4}
          />
          <Textarea
            label={`${t("sub_connect")} (${connectWords}/${MAX_PORTFOLIO_WORDS})`}
            value={connect}
            onChange={setConnect}
            rows={4}
          />

          <div
            onClick={() => docRef.current?.click()}
            className="glass flex cursor-pointer items-center gap-4 rounded-2xl p-4 hover:bg-white/10"
          >
            <input
              ref={docRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => setDoc(e.target.files?.[0] ?? null)}
            />
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/5">
              <FileText className="h-5 w-5 text-accent" />
            </span>
            <p className="text-sm">{doc ? doc.name : t("sub_doc")}</p>
          </div>
        </Section>

        <Section
          title="Порядок кинонаград"
          hint="Выставьте Impact, Visual и Tech award по приоритету."
        >
          <div className="grid gap-3 sm:grid-cols-3">
            {awardOrder.map((award, i) => (
              <label key={i} className="block">
                <span className="mb-2 block text-[11px] uppercase tracking-wider text-muted-foreground">
                  #{i + 1}
                </span>
                <select
                  value={award}
                  onChange={(e) => updateAwardOrder(i, e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition-all focus:border-[var(--neon)] focus:bg-white/10"
                >
                  {AWARDS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </Section>

        {/* SECTION: PARTICIPANTS */}
        <Section
          title={t("sub_participants")}
          hint={`${t("sub_participants_hint")}. ФИО участников, помощников и роли заполняйте латиницей.`}
        >
          <div className="space-y-4">
            {participants.map((p, i) => (
              <div key={i} className="glass rounded-2xl p-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                    #{i + 1} · {i < 3 ? t("sub_required") : t("sub_optional")}
                  </span>
                  {i >= 3 && (
                    <button
                      type="button"
                      onClick={() => removeParticipant(i)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label={t("sub_p_name")}
                    value={p.full_name}
                    onChange={(v) => updateParticipant(i, "full_name", v)}
                  />
                  <Input
                    label={t("sub_p_email")}
                    value={p.email}
                    onChange={(v) => updateParticipant(i, "email", v)}
                    type="email"
                  />
                  <Input
                    label={t("sub_p_phone")}
                    value={p.phone}
                    onChange={(v) => updateParticipant(i, "phone", v)}
                    type="tel"
                  />
                  <Input
                    label={t("sub_p_dob")}
                    value={p.dob}
                    onChange={(v) => updateParticipant(i, "dob", v)}
                    type="date"
                    min="2003-01-01"
                    max={`${currentYear}-12-31`}
                  />
                  <Input
                    label={t("sub_p_role")}
                    value={p.role}
                    onChange={(v) => updateParticipant(i, "role", v)}
                  />
                </div>
              </div>
            ))}
            {participants.length < 7 && (
              <Button
                type="button"
                variant="glass"
                size="lg"
                onClick={addParticipant}
                className="w-full"
              >
                <Plus className="h-4 w-4" /> +
              </Button>
            )}
          </div>
        </Section>

        <Section
          title="Помощники проекта"
          hint="Можно указать до 10 человек, оказывавших содействие. Только ФИО на английском."
        >
          <div className="space-y-3">
            {helpers.map((helper, i) => (
              <div key={i} className="flex gap-3">
                <Input
                  label={`#${i + 1}`}
                  value={helper}
                  onChange={(v) => updateHelper(i, v)}
                  placeholder="Full name in English"
                />
                <button
                  type="button"
                  onClick={() => removeHelper(i)}
                  className="mt-7 grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 text-muted-foreground hover:text-foreground"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {helpers.length < 10 && (
              <Button
                type="button"
                variant="glass"
                size="lg"
                onClick={addHelper}
                className="w-full"
              >
                <Plus className="h-4 w-4" /> +
              </Button>
            )}
          </div>
        </Section>

        {busy && (
          <div className="h-2 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full [background:var(--gradient-primary)] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            variant="glass"
            size="xl"
            className="flex-1"
            disabled={busy}
            onClick={() => submit(true)}
          >
            <Save className="h-5 w-5" /> {t("sub_save_draft")}
          </Button>
          <Button
            type="submit"
            variant="hero"
            size="xl"
            className="flex-1"
            disabled={busy || (durationStatus !== null && durationStatus !== "ok")}
          >
            <Send className="h-5 w-5" /> {busy ? t("sub_sending") : t("sub_send")}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-2xl text-gradient">{title}</h2>
        {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function RuleCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="glass flex items-center gap-3 rounded-2xl p-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent">
        {icon}
      </span>
      <div>
        <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
        <p className="font-display text-lg">{value}</p>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  min?: string;
  max?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition-all placeholder:text-muted-foreground/60 focus:border-[var(--neon)] focus:bg-white/10 focus:shadow-[0_0_0_4px_color-mix(in_oklab,var(--neon)_18%,transparent)]"
      />
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition-all placeholder:text-muted-foreground/60 focus:border-[var(--neon)] focus:bg-white/10 focus:shadow-[0_0_0_4px_color-mix(in_oklab,var(--neon)_18%,transparent)]"
      />
    </label>
  );
}
