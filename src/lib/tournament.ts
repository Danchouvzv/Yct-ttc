// Tournament deadline: 30 July 2026, 23:59 Asia/Almaty (UTC+5) ⇒ 2026-07-30T18:59:00Z
export const SUBMISSION_DEADLINE = new Date("2026-07-30T18:59:00Z");

export function isSubmissionsOpen(now: Date = new Date()): boolean {
  return now.getTime() < SUBMISSION_DEADLINE.getTime();
}

export function formatDeadline(lang: "ru" | "kk" | "en" = "ru"): string {
  const locale = lang === "kk" ? "kk-KZ" : lang === "en" ? "en-US" : "ru-RU";
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Almaty",
  }).format(SUBMISSION_DEADLINE);
}

export function timeUntilDeadline(now: Date = new Date()): {
  days: number;
  hours: number;
  minutes: number;
  total: number;
} {
  const total = Math.max(0, SUBMISSION_DEADLINE.getTime() - now.getTime());
  const days = Math.floor(total / 86_400_000);
  const hours = Math.floor((total % 86_400_000) / 3_600_000);
  const minutes = Math.floor((total % 3_600_000) / 60_000);
  return { days, hours, minutes, total };
}
