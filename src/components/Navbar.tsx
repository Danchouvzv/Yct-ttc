import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Film, Upload, LayoutDashboard, LogOut, LogIn, Languages } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { Button } from "@/components/ui/button";
import { useI18n, type Lang } from "@/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const [hoveredNavItem, setHoveredNavItem] = useState<string | null>(null);
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
    <header className="fixed left-0 right-0 top-0 z-40 w-full rounded-b-[15px] border-b border-gray-700/30 bg-[#0d0d18]/30 backdrop-blur-md">
      <div className="container mx-auto px-4 py-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-full text-white">
              <Film className="h-4 w-4 text-white" />
            </span>
            <span className="text-white">YCT</span>
          </Link>

          <nav
            className="hidden items-center gap-6 lg:flex"
            onMouseLeave={() => setHoveredNavItem(null)}
          >
            <NavLink
              to="/"
              label={t("nav_home")}
              active={path === "/"}
              item="home"
              hoveredNavItem={hoveredNavItem}
              setHoveredNavItem={setHoveredNavItem}
            />
            <NavLink
              to="/tournament"
              label="Турнир"
              active={path.startsWith("/tournament")}
              item="tournament"
              hoveredNavItem={hoveredNavItem}
              setHoveredNavItem={setHoveredNavItem}
            />
            <NavLink
              to="/explore"
              label={t("nav_explore")}
              active={path.startsWith("/explore")}
              item="explore"
              hoveredNavItem={hoveredNavItem}
              setHoveredNavItem={setHoveredNavItem}
            />
            {user && (
              <NavLink
                to="/dashboard"
                label={t("nav_dashboard")}
                active={path.startsWith("/dashboard")}
                item="dashboard"
                hoveredNavItem={hoveredNavItem}
                setHoveredNavItem={setHoveredNavItem}
              />
            )}
            {isAdmin && (
              <NavLink
                to="/admin"
                label="Admin"
                active={path.startsWith("/admin")}
                item="admin"
                hoveredNavItem={hoveredNavItem}
                setHoveredNavItem={setHoveredNavItem}
              />
            )}
          </nav>

          <div className="flex items-center gap-3 md:gap-5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 rounded-full px-2 text-gray-300">
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
              <Button
                asChild
                variant="glass"
                size="sm"
                className="rounded-full border-[#322D36] bg-[#8200DB29] px-5 font-semibold text-white hover:bg-black/50"
              >
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

function NavLink({
  to,
  label,
  active,
  item,
  hoveredNavItem,
  setHoveredNavItem,
}: {
  to: string;
  label: string;
  active: boolean;
  item: string;
  hoveredNavItem: string | null;
  setHoveredNavItem: (item: string | null) => void;
}) {
  const isCurrentItemHovered = hoveredNavItem === item;
  const isAnotherItemHovered = hoveredNavItem !== null && !isCurrentItemHovered;

  return (
    <Link
      to={to}
      onMouseEnter={() => setHoveredNavItem(item)}
      className={`text-sm transition duration-150 ${
        isCurrentItemHovered || active
          ? "text-white"
          : isAnotherItemHovered
            ? "text-gray-500"
            : "text-gray-300"
      }`}
    >
      {label}
    </Link>
  );
}
