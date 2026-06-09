import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Trophy,
  Users,
  Clapperboard,
  Sparkles,
  Globe2,
  Instagram,
  Award,
  ShieldCheck,
  Languages,
  CalendarClock,
  FileText,
  ListChecks,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReveal } from "@/hooks/use-reveal";
import { formatDeadline, timeUntilDeadline, isSubmissionsOpen } from "@/lib/tournament";

export const Route = createFileRoute("/tournament")({
  component: TournamentPage,
  head: () => ({
    meta: [
      { title: "Кинотурнир YCT — Правила и требования" },
      {
        name: "description",
        content:
          "Полные правила международного кинотурнира YCT: формат участия, Connect & Reach, отбор фильмов, требования к заявке.",
      },
      { property: "og:title", content: "Кинотурнир YCT — Правила и требования" },
      {
        property: "og:description",
        content:
          "Команда 3–7 человек, фильм 5–16 минут, две темы, призовой фонд и три награды: Impact, Composition, Tech.",
      },
    ],
  }),
});

function TournamentPage() {
  useReveal();
  const open = isSubmissionsOpen();
  const left = timeUntilDeadline();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      {/* HERO */}
      <header className="reveal text-center">
        <span className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
          <Trophy className="h-3.5 w-3.5 text-accent" />
          YCT 2026
        </span>
        <h1 className="mt-5 font-display text-4xl leading-tight sm:text-6xl">
          <span className="text-gradient">Кинотурнир</span>{" "}
          <em className="font-serif italic font-normal">правила и требования</em>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl font-serif italic text-muted-foreground">
          Международный турнир короткометражного кино. Соберите команду, снимите фильм по одной из
          двух тем и поборитесь за призовой фонд.
        </p>

        <div className="mt-8 inline-flex flex-wrap items-center justify-center gap-3 glass rounded-2xl px-5 py-3 text-sm">
          <CalendarClock className="h-4 w-4 text-accent" />
          <span className="text-muted-foreground">
            {open ? "Приём заявок открыт до" : "Приём заявок завершён"}{" "}
          </span>
          <span className="font-display">{formatDeadline("ru")}</span>
          {open && (
            <span className="text-accent">
              · осталось {left.days}д {left.hours}ч
            </span>
          )}
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild variant="hero" size="xl">
            <Link to="/upload">Подать заявку</Link>
          </Button>
          <Button asChild variant="glass" size="xl">
            <Link to="/dashboard">Личный кабинет</Link>
          </Button>
        </div>
      </header>

      {/* SECTIONS */}
      <div className="mt-16 space-y-12">
        <Section icon={Users} title="Формат участия">
          <Bullet>
            Команда от <b>3 до 7 человек</b>, включая капитана.
          </Bullet>
          <Bullet>
            Команда представляет съёмочную группу фильма. Актёры могут входить в её состав.
          </Bullet>
          <Bullet>
            Дополнительно можно указать <b>до 10 помощников</b> (массовка, организаторы).
          </Bullet>
          <Bullet>
            Состав команды можно менять <b>до момента отправки фильма</b>.
          </Bullet>
          <Bullet>
            Фильм снимается на <b>одну из двух предложенных тем</b>.
          </Bullet>
          <Bullet>
            Максимальный возраст участников — <b>2003 год рождения и младше</b>. Минимального
            ограничения нет.
          </Bullet>
          <Bullet>
            Продолжительность фильма: <b>5–16 минут</b>.
          </Bullet>
          <Bullet>
            Языки фильма: <b>казахский, русский или английский</b>.
          </Bullet>
          <Bullet>Регистрация открыта вплоть до дедлайна.</Bullet>
          <Bullet>
            Каждая команда обязана создать <b>Instagram-аккаунт</b> для участия в Connect & Reach.
          </Bullet>
        </Section>

        <Section icon={Instagram} title="Connect & Reach">
          <p className="text-sm leading-relaxed text-foreground/85">
            Вес оценки Connect & Reach — <b>30% от итогового результата</b>.
          </p>
          <div className="mt-3 space-y-2">
            <Bullet>Команда загружает портфолио в личном кабинете.</Bullet>
            <Bullet>В Instagram команда рассказывает о себе и процессе.</Bullet>
            <Bullet>
              Все публикации используют <b>официальный хэштег турнира</b>.
            </Bullet>
            <Bullet>Допускается рекламная интеграция спонсоров турнира.</Bullet>
            <Bullet>Лучшие фильмы публикуются на официальном YouTube-канале.</Bullet>
          </div>
        </Section>

        <Section icon={ShieldCheck} title="Отбор фильмов">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <p className="text-[11px] uppercase tracking-[0.25em] text-accent/80">Этап 1</p>
              <p className="mt-2 font-serif italic text-foreground/85">
                Первичный просмотр и отбор общей комиссией турнира.
              </p>
            </Card>
            <Card>
              <p className="text-[11px] uppercase tracking-[0.25em] text-accent/80">Этап 2</p>
              <p className="mt-2 font-serif italic text-foreground/85">
                Лучшие фильмы передаются профессиональным режиссёрам, экспертам киноиндустрии и
                профильным специалистам для финального оценивания.
              </p>
            </Card>
          </div>
        </Section>

        <Section icon={FileText} title="Требования к заявке">
          <Bullet>
            Название команды <b>на английском языке</b>.
          </Bullet>
          <Bullet>
            Фильм: снят на одну из двух тем; продолжительность <b>5–16 минут</b>; язык — казахский,
            русский или английский; без сторонних брендов и скрытой рекламы (допускаются спонсоры
            турнира).
          </Bullet>
          <Bullet>
            Название фильма на <b>оригинальном языке и на английском</b>.
          </Bullet>
          <Bullet>
            Краткое описание фильма <b>до 75 слов</b>.
          </Bullet>
          <Bullet>
            До <b>3 жанров</b>.
          </Bullet>
          <Bullet>
            Описание деятельности команды в рамках Connect & Reach —{" "}
            <b>50–150 слов на каждую награду</b>.
          </Bullet>
          <Bullet>
            Портфолио до <b>3 страниц A4</b>.
          </Bullet>
          <Bullet>
            Полный список участников с ролями: режиссёр, оператор, монтажёр, актёр, другие роли.
            Дополнительно <b>до 10 помощников</b>. Все имена и фамилии — <b>латиницей</b>.
          </Bullet>
        </Section>

        <Section icon={Award} title="Порядок предпочтительных кинонаград">
          <p className="text-sm text-foreground/85">
            Команда указывает порядок приоритета для трёх наград:
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <NomCard idx="01" name="Impact Award" />
            <NomCard idx="02" name="Composition Award" />
            <NomCard idx="03" name="Tech Award" />
          </div>
          <div className="mt-6 glass rounded-2xl p-5 text-sm">
            <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Пример</p>
            <ol className="mt-2 list-decimal pl-5 text-foreground/90">
              <li>Tech Award</li>
              <li>Impact Award</li>
              <li>Composition Award</li>
            </ol>
          </div>
        </Section>

        <Section icon={Languages} title="Языки и темы">
          <Bullet>Темы фильма публикуются организаторами — команда выбирает одну из двух.</Bullet>
          <Bullet>
            Язык фильма: казахский, русский или английский. Заявка заполняется на английском.
          </Bullet>
        </Section>

        <Section icon={ListChecks} title="Что проверить перед отправкой">
          <Bullet>Видео загружено, длительность 5–16 минут, файл &lt; 2 ГБ.</Bullet>
          <Bullet>Указан состав команды (3–7) и помощники (до 10), все имена — латиницей.</Bullet>
          <Bullet>Заполнены блоки Connect & Reach и прикреплены материалы команды.</Bullet>
          <Bullet>Прикреплено PDF-портфолио (до 3 страниц A4, до 10 МБ).</Bullet>
        </Section>
      </div>

      {/* FINAL CTA */}
      <section className="mt-16 glass relative overflow-hidden rounded-3xl p-8 sm:p-12 reveal">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full [background:var(--gradient-primary)] opacity-20 blur-3xl" />
        <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <h3 className="font-display text-3xl sm:text-4xl text-gradient">Готовы участвовать?</h3>
            <p className="mt-2 max-w-xl font-serif italic text-muted-foreground">
              Соберите команду, выберите тему и подайте заявку до {formatDeadline("ru")}.
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="hero" size="lg">
              <Link to="/upload">Подать заявку</Link>
            </Button>
            <Button asChild variant="glass" size="lg">
              <Link to="/signup">Регистрация</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="reveal">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent/15 text-accent">
          <Icon className="h-5 w-5" />
        </span>
        <h2 className="font-display text-2xl sm:text-3xl">{title}</h2>
      </div>
      <div className="glass rounded-2xl p-6 sm:p-8 space-y-3">{children}</div>
    </section>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 text-sm leading-relaxed text-foreground/90">
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
      <span>{children}</span>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="glass rounded-2xl p-5">{children}</div>;
}

function NomCard({ idx, name }: { idx: string; name: string }) {
  return (
    <div className="glass rounded-2xl p-5">
      <p className="text-[11px] uppercase tracking-[0.25em] text-accent/80">{idx}</p>
      <p className="mt-1 font-display text-lg flex items-center gap-2">
        <Clapperboard className="h-4 w-4 text-accent" />
        {name}
      </p>
    </div>
  );
}

// Hint: Globe2 import kept for parity with i18n version; remove if linter flags it.
void Globe2;
