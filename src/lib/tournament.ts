// Registration deadline: 3 September 2026, 23:59 Asia/Almaty (UTC+5) ⇒ 2026-09-03T18:59:00Z
export const REGISTRATION_DEADLINE = new Date("2026-09-03T18:59:00Z");

// Film submission deadline: 15 August 2026, 23:59 Asia/Almaty (UTC+5) ⇒ 2026-08-15T18:59:00Z
export const SUBMISSION_DEADLINE = new Date("2026-08-15T18:59:00Z");

export function isRegistrationOpen(now: Date = new Date()): boolean {
  return now.getTime() < REGISTRATION_DEADLINE.getTime();
}

export function isSubmissionsOpen(now: Date = new Date()): boolean {
  return now.getTime() < SUBMISSION_DEADLINE.getTime();
}

export const VOTING_OPEN = false;

function formatDate(date: Date, lang: "ru" | "kk" | "en"): string {
  const locale = lang === "kk" ? "kk-KZ" : lang === "en" ? "en-US" : "ru-RU";
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Almaty",
  }).format(date);
}

export function formatDeadline(lang: "ru" | "kk" | "en" = "ru"): string {
  return formatDate(SUBMISSION_DEADLINE, lang);
}

export function formatRegistrationDeadline(lang: "ru" | "kk" | "en" = "ru"): string {
  return formatDate(REGISTRATION_DEADLINE, lang);
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
