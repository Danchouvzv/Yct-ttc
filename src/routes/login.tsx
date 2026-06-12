import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Mail, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/login")({
  component: Login,
  head: () => ({ meta: [{ title: "Вход — YCT" }] }),
});

const schema = z.object({
  email: z.string().email("Неверный email").max(255),
  password: z.string().min(6, "Минимум 6 символов").max(128),
});

function Login() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Wait for auth to initialize before redirecting — prevents false redirect
  // during the brief loading window after F5 when user is still null.
  useEffect(() => {
    if (!authLoading && user) navigate({ to: "/dashboard" });
  }, [authLoading, user, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Добро пожаловать");
    navigate({ to: "/dashboard" });
    void remember;
  };

  return (
    <AuthShell title="С возвращением" subtitle="Войдите, чтобы продолжить">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field
          icon={<Mail className="h-4 w-4" />}
          type="email"
          placeholder="Email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
        />
        <Field
          icon={<Lock className="h-4 w-4" />}
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="accent-[var(--neon)]"
            />
            Запомнить меня
          </label>
          <button
            type="button"
            className="hover:text-foreground"
            onClick={() => toast.info("Свяжитесь с поддержкой для сброса пароля")}
          >
            Забыли пароль?
          </button>
        </div>
        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={submitting}>
          {submitting ? "Вход..." : "Войти"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Нет аккаунта?{" "}
          <Link to="/signup" className="text-accent hover:underline">
            Регистрация
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-100px)] max-w-md items-center px-4 py-10">
      <div className="glass w-full rounded-3xl p-8 shadow-[var(--shadow-glass)] animate-fade-up">
        <h1 className="font-display text-3xl text-gradient">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}

export function Field({
  icon,
  type,
  placeholder,
  value,
  onChange,
  autoComplete,
}: {
  icon: React.ReactNode;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
}) {
  return (
    <div className="group relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-accent">
        {icon}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-3 text-sm outline-none transition-all duration-300 placeholder:text-muted-foreground/70 focus:border-[var(--neon)] focus:bg-white/10 focus:shadow-[0_0_0_4px_color-mix(in_oklab,var(--neon)_20%,transparent),0_0_24px_-4px_var(--neon)]"
      />
    </div>
  );
}
