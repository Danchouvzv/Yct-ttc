import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Trophy,
  Users,
  Clapperboard,
  Sparkles,
  Globe2,
  Instagram,
  Award,
  Languages,
  CalendarClock,
  ListChecks,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReveal } from "@/hooks/use-reveal";
import { formatDeadline, timeUntilDeadline, isSubmissionsOpen } from "@/lib/tournament";

export const Route = createFileRoute("/tournament")({
  component: TournamentPage,
  head: () => ({
    meta: [
      { title: "Кинотурнир YCT — Этапы и правила" },
      {
        name: "description",
        content:
          "Этапы международного кинотурнира YCT: проверка, зрительское голосование, финал и направления наград.",
      },
      { property: "og:title", content: "Кинотурнир YCT — Этапы и правила" },
      {
        property: "og:description",
        content:
          "Команда 3–7 человек, фильм 5–16 минут, две темы, призовой фонд и четыре направления: Glorious, Impact, Visual, Tech.",
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
          <em className="font-serif italic font-normal">этапы и правила</em>
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
          <Button asChild variant="glass" size="xl">
            <a href="/Положение_YCT.docx" download>
              <Download className="h-4 w-4" /> Положение
            </a>
          </Button>
        </div>
      </header>

      {/* SECTIONS */}
      <div className="mt-16 space-y-12">
        <Section icon={Users} title="Формат участия">
          <p className="text-sm leading-relaxed text-foreground/85">
            К участию допускаются участники, рождённые с 2003 года по текущий год.
          </p>
          <p className="text-sm leading-relaxed text-foreground/85">
            Участники подают работу командами. В составе команды должно быть от 3 до 7 человек,
            включая капитана. Запасные участники не допускаются. Команда может состоять из учащихся
            разных образовательных организаций.
          </p>
          <p className="text-sm leading-relaxed text-foreground/85">
            Для участия команда подаёт заявку, которая включает:
          </p>
          <Bullet>Название команды на английском языке.</Bullet>
          <Bullet>
            Фильм на одну из тем: <b>«Конец или начало»</b>; <b>«Мои заботы»</b>.
          </Bullet>
          <Bullet>Хронометраж фильма: от 5 до 16 минут.</Bullet>
          <Bullet>Язык фильма: казахский, русский или английский.</Bullet>
          <Bullet>Английские субтитры обязательны.</Bullet>
          <Bullet>Название фильма на оригинальном и английском языках.</Bullet>
          <Bullet>Краткое описание фильма до 75 слов.</Bullet>
          <Bullet>До трёх жанров фильма.</Bullet>
          <Bullet>
            Список участников команды с указанием ролей: режиссёр, оператор, монтажёр, актёр и т. д.
          </Bullet>
          <Bullet>
            Описание работы по Inspire-наградам: Connect и Reach — от 50 до 150 слов для каждой
            награды с указанием социальной сети.
          </Bullet>
          <Bullet>Портфолио до 3 страниц А4 по работе команды в рамках Inspire-наград.</Bullet>
          <Bullet>
            При желании команда может указать до 10 человек, помогавших в создании проекта.
          </Bullet>
          <p className="text-sm leading-relaxed text-foreground/85">
            В фильме запрещены сторонние бренды и скрытая реклама. Допускается только рекламная
            интеграция спонсоров Турнира.
          </p>
          <p className="text-sm leading-relaxed text-foreground/85">
            ФИО участников и помощников, а также их роли, заполняются на латинице.
          </p>
        </Section>

        <Section icon={Instagram} title="Connect & Reach">
          <p className="text-sm leading-relaxed text-foreground/85">
            В рамках Турнира дополнительно оценивается работа команды по критериям Inspire. Inspire
            включает две награды: Connect и Reach.
          </p>
          <p className="text-sm leading-relaxed text-foreground/85">
            Connect оценивает, как команда взаимодействовала с другими людьми, получала полезную
            информацию и применяла её при создании фильма.
          </p>
          <p className="text-sm leading-relaxed text-foreground/85">
            Для Connect команда должна описать:
          </p>
          <div className="mt-3 space-y-2">
            <Bullet>с кем проводилось взаимодействие: роль или специализация человека;</Bullet>
            <Bullet>зачем команда к нему обратилась;</Bullet>
            <Bullet>
              в каком формате прошло взаимодействие: встреча, звонок, переписка и т. д.;
            </Bullet>
            <Bullet>какие знания, советы или выводы команда получила;</Bullet>
            <Bullet>как это повлияло на фильм или работу над проектом.</Bullet>
          </div>
          <p className="text-sm leading-relaxed text-foreground/85">
            Описание должно быть конкретным и проверяемым. Оргкомитет может запросить подтверждение
            взаимодействий.
          </p>
          <p className="text-sm leading-relaxed text-foreground/85">
            Reach оценивает, как команда продвигала свой проект и привлекала аудиторию.
          </p>
          <p className="text-sm leading-relaxed text-foreground/85">
            Для Reach команда должна создать и вести отдельный публичный аккаунт проекта в
            социальной сети. Контент должен быть связан с фильмом, процессом работы над ним и
            популяризацией культуры кино.
          </p>
          <p className="text-sm leading-relaxed text-foreground/85">
            При оценивании Reach учитываются:
          </p>
          <div className="mt-3 space-y-2">
            <Bullet>охват аудитории;</Bullet>
            <Bullet>взаимодействие с аудиторией;</Bullet>
            <Bullet>прирост аудитории за последние 60 дней.</Bullet>
          </div>
          <p className="text-sm leading-relaxed text-foreground/85">
            Команда должна быть готова предоставить статистику аккаунта по требованию жюри.
          </p>
          <p className="text-sm leading-relaxed text-foreground/85">
            Искусственная накрутка, аномальная вовлечённость и нечестные методы продвижения не
            допускаются. При нарушении оценка по Reach может быть снижена до нуля.
          </p>
        </Section>

        <Section icon={ListChecks} title="Этапы турнира">
          <div className="grid gap-4">
            <StageCard
              idx="01"
              title="Проверочный этап"
              body="Оргкомитет проверяет заявки и фильмы на соответствие требованиям. На этом этапе отсеиваются работы, не прошедшие модерацию, и определяются до 99 команд, которые проходят на зрительское голосование. Также на этом этапе определяются призёры наград Connect и Reach."
            />
            <StageCard
              idx="02"
              title="Зрительское голосование"
              body="Фильмы, прошедшие проверку, распределяются по дивизионам. Каждый дивизион смотрит отдельная группа зрителей, после чего они заполняют оценочный бланк и выбирают претендентов на кинонаграды. По итогам голосования фильмы с наибольшим количеством баллов в своих направлениях становятся номинантами на соответствующие награды."
            />
            <StageCard
              idx="03"
              title="Финальный этап"
              body="Финал оценивает жюри. Фильмы соревнуются внутри своих направлений: Glorious award, Impact award, Visual award, Tech award. В каждом направлении награждаются три команды, набравшие наибольшее количество баллов."
            />
          </div>
        </Section>

        <Section icon={Award} title="Порядок предпочтительных кинонаград">
          <p className="text-sm text-foreground/85">
            Команда указывает порядок приоритета для четырёх наград:
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <NomCard idx="01" name="Glorious Award" />
            <NomCard idx="02" name="Impact Award" />
            <NomCard idx="03" name="Visual Award" />
            <NomCard idx="04" name="Tech Award" />
          </div>
          <div className="mt-6 glass rounded-2xl p-5 text-sm">
            <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Пример</p>
            <ol className="mt-2 list-decimal pl-5 text-foreground/90">
              <li>Glorious Award</li>
              <li>Impact Award</li>
              <li>Visual Award</li>
              <li>Tech Award</li>
            </ol>
          </div>
        </Section>

        <Section icon={Languages} title="Языки и темы">
          <Bullet>Темы фильма публикуются организаторами — команда выбирает одну из двух.</Bullet>
          <Bullet>
            Язык фильма: казахский, русский или английский. Заявка заполняется на английском.
          </Bullet>
        </Section>

        <Section icon={Download} title="Положение турнира">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <p className="max-w-2xl text-sm leading-relaxed text-foreground/85">
              Полная версия положения доступна в DOCX: правила участия, порядок оценки, этапы и
              организационные условия турнира.
            </p>
            <Button asChild variant="hero" size="lg">
              <a href="/Положение_YCT.docx" download>
                <Download className="h-4 w-4" /> Скачать DOCX
              </a>
            </Button>
          </div>
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

function StageCard({ idx, title, body }: { idx: string; title: string; body: string }) {
  return (
    <Card>
      <p className="text-[11px] uppercase tracking-[0.25em] text-accent/80">Этап {idx}</p>
      <h3 className="mt-2 font-display text-xl">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-foreground/85">{body}</p>
    </Card>
  );
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
