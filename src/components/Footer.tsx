import { Mail, Instagram, Send, MessageCircle } from "lucide-react";
import { useI18n } from "@/i18n";

const EMAIL = "aurelion.alliance@gmail.com";
const INSTAGRAM =
  "https://www.instagram.com/young.cinema.tournament?igsh=MXQ4am03dm9kbXRneg%3D%3D&utm_source=qr";
const TELEGRAM_CHANNEL = "https://t.me/YCT_yct";
const TELEGRAM_ALINA = "https://t.me/alik020";

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="mx-auto mt-24 max-w-7xl px-4 pb-12 sm:px-6">
      <div className="glass relative overflow-hidden rounded-3xl p-8 sm:p-10">
        <div className="grid gap-8 sm:grid-cols-[1.2fr_1fr] sm:items-center">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl text-gradient">YCT</h2>
            <p className="mt-2 max-w-md font-serif text-sm italic text-muted-foreground">
              {t("footer_tagline")}
            </p>
          </div>

          <div className="sm:justify-self-end">
            <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
              {t("footer_contacts")}
            </p>
            <div className="mt-4 flex flex-col gap-3">
              <a
                href={`mailto:${EMAIL}`}
                className="inline-flex items-center gap-3 text-sm text-foreground/90 transition-colors hover:text-accent"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent">
                  <Mail className="h-4 w-4" />
                </span>
                {EMAIL}
              </a>
              <a
                href={INSTAGRAM}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-3 text-sm text-foreground/90 transition-colors hover:text-accent"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent">
                  <Instagram className="h-4 w-4" />
                </span>
                @young.cinema.tournament
              </a>
              <a
                href={TELEGRAM_CHANNEL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-3 text-sm text-foreground/90 transition-colors hover:text-accent"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent">
                  <Send className="h-4 w-4" />
                </span>
                {TELEGRAM_CHANNEL.replace("https://", "")}
              </a>

              <a
                href={TELEGRAM_ALINA}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium [background:var(--gradient-primary)] shadow-[var(--shadow-neon)] transition-transform hover:-translate-y-0.5"
              >
                <MessageCircle className="h-4 w-4" />
                {t("footer_contact_alina")}
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-5 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} YCT — Young Cinema Tournament. {t("footer_rights")}
        </div>
      </div>
    </footer>
  );
}
