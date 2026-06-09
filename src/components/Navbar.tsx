import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Film, Upload, LayoutDashboard, LogOut, LogIn, Languages, Shield } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { Button } from "@/components/ui/button";
import { useI18n, type Lang } from "@/i18n";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { t, lang, setLang } = useI18n();

  const langs: { v: Lang; l: string }[] = [
    { v: "ru", l: "RU" },
    { v: "kk", l: "KZ" },
    { v: "en", l: "EN" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mt-4 flex h-14 items-center justify-between rounded-2xl glass px-4 shadow-[var(--shadow-glass)]">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-lg [background:var(--gradient-primary)] shadow-[var(--shadow-neon)]">
              <Film className="h-4 w-4 text-primary-foreground" />
            </span>
            <span className="text-gradient">YCT</span>
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
            <NavLink to="/" label={t("nav_home")} active={path === "/"} />
            <NavLink to="/tournament" label="Турнир" active={path.startsWith("/tournament")} />
            <NavLink to="/explore" label={t("nav_explore")} active={path.startsWith("/explore")} />
            {user && (
              <NavLink to="/dashboard" label={t("nav_dashboard")} active={path.startsWith("/dashboard")} />
            )}
            {isAdmin && (
              <NavLink to="/admin" label="Admin" active={path.startsWith("/admin")} />
            )}
          </nav>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 px-2">
                  <Languages className="h-4 w-4" />
                  <span className="text-xs uppercase">{lang}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {langs.map((l) => (
                  <DropdownMenuItem key={l.v} onClick={() => setLang(l.v)}>
                    {l.l}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {user ? (
              <>
                <Button asChild variant="neon" size="sm" className="hidden sm:inline-flex">
                  <Link to="/upload">
                    <Upload className="h-4 w-4" /> {t("nav_submit")}
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="icon" aria-label="Dashboard">
                  <Link to="/dashboard">
                    <LayoutDashboard className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t("nav_logout")}
                  onClick={async () => {
                    await signOut();
                    navigate({ to: "/" });
                  }}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button asChild variant="hero" size="sm">
                <Link to="/login">
                  <LogIn className="h-4 w-4" /> {t("nav_login")}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function NavLink({ to, label, active }: { to: string; label: string; active: boolean }) {
  return (
    <Link
      to={to}
      className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
        active ? "text-foreground bg-white/5" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );
}
