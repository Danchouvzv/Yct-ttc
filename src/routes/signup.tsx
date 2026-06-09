import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Mail, Lock, Users, MapPin, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { AuthShell, Field } from "./login";
import { GoogleButton } from "@/components/GoogleButton";
import { useI18n } from "@/i18n";

export const Route = createFileRoute("/signup")({
  component: Signup,
  head: () => ({ meta: [{ title: "Sign up — YCT" }] }),
});

const schema = z.object({
  team_name: z.string().trim().min(2).max(80),
  email: z.string().email().max(255),
  country: z.string().trim().min(2).max(60),
  city: z.string().trim().min(2).max(60),
  language: z.enum(["ru", "kk", "en"]),
  password: z.string().min(8).max(128),
});

function Signup() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, lang, setLang } = useI18n();
  const [team, setTeam] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [language, setLanguage] = useState<"ru" | "kk" | "en">(lang);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/dashboard" });
  }, [user, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ team_name: team, email, country, city, language, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        data: { display_name: team },
      },
    });
    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }
    // Update profile with team data (profile auto-created by trigger)
    if (data.user) {
      await supabase
        .from("profiles")
        .update({ team_name: team, country, city, language, display_name: team })
        .eq("id", data.user.id);
    }
    setLang(language);
    setLoading(false);
    toast.success("OK");
    navigate({ to: "/dashboard" });
  };

  return (
    <AuthShell title={t("signup_team_title")} subtitle={t("hero_kicker")}>
      <div className="space-y-3">
        <GoogleButton label="Google" />
        <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground/60">
          <span className="h-px flex-1 bg-white/10" />
          email
          <span className="h-px flex-1 bg-white/10" />
        </div>
      </div>
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <Field icon={<Users className="h-4 w-4" />} type="text" placeholder={t("signup_team_name")} value={team} onChange={setTeam} autoComplete="organization" />
        <Field icon={<Mail className="h-4 w-4" />} type="email" placeholder="Email" value={email} onChange={setEmail} autoComplete="email" />
        <div className="grid grid-cols-2 gap-3">
          <Field icon={<Globe className="h-4 w-4" />} type="text" placeholder={t("signup_country")} value={country} onChange={setCountry} />
          <Field icon={<MapPin className="h-4 w-4" />} type="text" placeholder={t("signup_city")} value={city} onChange={setCity} />
        </div>
        <label className="block">
          <span className="mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground">{t("signup_lang")}</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as "ru" | "kk" | "en")}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm outline-none focus:border-[var(--neon)]"
          >
            <option value="ru">Русский</option>
            <option value="kk">Қазақша</option>
            <option value="en">English</option>
          </select>
        </label>
        <Field icon={<Lock className="h-4 w-4" />} type="password" placeholder="Password (min 8)" value={password} onChange={setPassword} autoComplete="new-password" />
        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
          {loading ? "..." : t("hero_cta_join")}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          <Link to="/login" className="text-accent hover:underline">{t("nav_login")}</Link>
        </p>
      </form>
    </AuthShell>
  );
}
