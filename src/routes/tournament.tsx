import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Trophy,
  Users,
  Clapperboard,
  Sparkles,
  Instagram,
  Award,
  Languages,
  CalendarClock,
  ListChecks,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReveal } from "@/hooks/use-reveal";
import { useI18n, type Lang } from "@/i18n";
import { formatDeadline, formatRegistrationDeadline, timeUntilDeadline, isSubmissionsOpen, isRegistrationOpen } from "@/lib/tournament";

export const Route = createFileRoute("/tournament")({
  component: TournamentPage,
  head: () => ({
    meta: [
      { title: "YCT — Tournament rules" },
      {
        name: "description",
        content:
          "Young Cinema Tournament stages, participation rules, film awards, Inspire awards and regulations.",
      },
      { property: "og:title", content: "YCT — Tournament rules" },
      {
        property: "og:description",
        content:
          "Team of 3–7 people, film runtime 5–16 minutes, two themes, film awards and Inspire awards.",
      },
    ],
  }),
});

type Copy = Record<Lang, string>;

const C: Record<string, Copy> = {
  kicker: { ru: "YCT 2026", kk: "YCT 2026", en: "YCT 2026" },
  title_a: { ru: "Кинотурнир", kk: "Кинотурнир", en: "Film tournament" },
  title_b: { ru: "этапы и правила", kk: "кезеңдері мен ережелері", en: "stages and rules" },
  intro: {
    ru: "Международный турнир короткометражного кино. Соберите команду, снимите фильм по одной из двух тем и поборитесь за призовой фонд.",
    kk: "Халықаралық қысқаметражды кино турнирі. Команда жинап, екі тақырыптың біріне фильм түсіріп, жүлде қоры үшін сайысқа түсіңіз.",
    en: "An international short-film tournament. Build a team, make a film on one of two themes and compete for the prize fund.",
  },
  reg_deadline_label: {
    ru: "Регистрация до",
    kk: "Тіркелу мерзімі",
    en: "Registration until",
  },
  film_deadline_label: {
    ru: "Приём фильмов до",
    kk: "Фильм қабылдау мерзімі",
    en: "Film submissions until",
  },
  deadline_closed: {
    ru: "Приём заявок завершён",
    kk: "Өтінім қабылдау аяқталды",
    en: "Submissions are closed",
  },
  left: { ru: "осталось", kk: "қалды", en: "left" },
  days: { ru: "д", kk: "к", en: "d" },
  hours: { ru: "ч", kk: "сағ", en: "h" },
  submit: { ru: "Подать заявку", kk: "Өтінім беру", en: "Apply" },
  dashboard: { ru: "Личный кабинет", kk: "Жеке кабинет", en: "Dashboard" },
  regulations: { ru: "Положение", kk: "Ереже", en: "Regulations" },

  participation_title: { ru: "Формат участия", kk: "Қатысу форматы", en: "Participation Format" },
  participation_p1: {
    ru: "К участию допускаются участники, рождённые с 2003 года по текущий год.",
    kk: "Турнирге 2003 жылдан бастап ағымдағы жылға дейін туған қатысушылар жіберіледі.",
    en: "Participants born from 2003 through the current year are eligible to take part.",
  },
  participation_p2: {
    ru: "Участники подают работу командами. В составе команды должно быть от 3 до 7 человек, включая капитана. Запасные участники не допускаются. Команда может состоять из учащихся разных образовательных организаций.",
    kk: "Қатысушылар жұмысты командамен ұсынады. Команда құрамында капитанды қоса алғанда 3-тен 7 адамға дейін болуы керек. Қосалқы қатысушыларға рұқсат етілмейді. Команда әртүрлі білім беру ұйымдарының оқушыларынан құрала алады.",
    en: "Participants submit their work as teams. A team must include 3 to 7 people, including the captain. Reserve participants are not allowed. A team may include students from different educational organizations.",
  },
  participation_p3: {
    ru: "Для участия команда подаёт заявку, которая включает:",
    kk: "Қатысу үшін команда келесі мәліметтерден тұратын өтінім береді:",
    en: "To participate, the team submits an application that includes:",
  },
  participation_b1: {
    ru: "Название команды на английском языке.",
    kk: "Команданың ағылшын тіліндегі атауы.",
    en: "Team name in English.",
  },
  participation_b2: {
    ru: "Фильм на одну из тем: «Конец или начало»; «Мои заботы».",
    kk: "Екі тақырыптың біріне түсірілген фильм: «Соңы немесе басы»; «Менің мазасыздықтарым».",
    en: 'A film on one of the themes: "The End or the Beginning"; "My Concerns".',
  },
  participation_b3: {
    ru: "Хронометраж фильма: от 5 до 16 минут.",
    kk: "Фильм ұзақтығы: 5 минуттан 16 минутқа дейін.",
    en: "Film runtime: from 5 to 16 minutes.",
  },
  participation_b4: {
    ru: "Язык фильма: казахский, русский или английский.",
    kk: "Фильм тілі: қазақ, орыс немесе ағылшын тілі.",
    en: "Film language: Kazakh, Russian or English.",
  },
  participation_b5: {
    ru: "Английские субтитры обязательны.",
    kk: "Ағылшын субтитрлері міндетті.",
    en: "English subtitles are required.",
  },
  participation_b6: {
    ru: "Название фильма на оригинальном и английском языках.",
    kk: "Фильм атауы түпнұсқа тілде және ағылшын тілінде.",
    en: "Film title in the original language and in English.",
  },
  participation_b7: {
    ru: "Краткое описание фильма до 75 слов.",
    kk: "Фильмнің 75 сөзге дейінгі қысқаша сипаттамасы.",
    en: "A short film description of up to 75 words.",
  },
  participation_b8: {
    ru: "До трёх жанров фильма.",
    kk: "Фильмнің үш жанрына дейін.",
    en: "Up to three film genres.",
  },
  participation_b9: {
    ru: "Список участников команды с указанием ролей: режиссёр, оператор, монтажёр, актёр и т. д.",
    kk: "Команда қатысушыларының тізімі және рөлдері: режиссёр, оператор, монтажёр, актёр және т. б.",
    en: "List of team members with roles: director, camera operator, editor, actor, etc.",
  },
  participation_b10: {
    ru: "Описание работы по Inspire-наградам: Connect и Reach — от 50 до 150 слов для каждой награды с указанием социальной сети.",
    kk: "Inspire наградалары бойынша жұмыс сипаттамасы: Connect және Reach — әр наградаға әлеуметтік желіні көрсете отырып 50-ден 150 сөзге дейін.",
    en: "Description of work for the Inspire awards: Connect and Reach — 50 to 150 words for each award, including the social network used.",
  },
  participation_b11: {
    ru: "Портфолио до 3 страниц А4 по работе команды в рамках Inspire-наград.",
    kk: "Inspire наградалары аясындағы команда жұмысы бойынша 3 бетке дейінгі А4 портфолио.",
    en: "A portfolio of up to 3 A4 pages describing the team's work for the Inspire awards.",
  },
  participation_b12: {
    ru: "При желании команда может указать до 10 человек, помогавших в создании проекта.",
    kk: "Қаласа, команда жобаны жасауға көмектескен 10 адамға дейін көрсете алады.",
    en: "The team may optionally list up to 10 people who helped create the project.",
  },
  participation_p4: {
    ru: "В фильме запрещены сторонние бренды и скрытая реклама. Допускается только рекламная интеграция спонсоров Турнира.",
    kk: "Фильмде бөгде брендтер мен жасырын жарнамаға тыйым салынады. Тек Турнир демеушілерінің жарнамалық интеграциясына рұқсат етіледі.",
    en: "Third-party brands and hidden advertising are prohibited in the film. Only advertising integrations with Tournament sponsors are allowed.",
  },
  participation_p5: {
    ru: "ФИО участников и помощников, а также их роли, заполняются на латинице.",
    kk: "Қатысушылар мен көмекшілердің аты-жөні, сондай-ақ олардың рөлдері латын әліпбиімен толтырылады.",
    en: "Full names of participants and helpers, as well as their roles, must be written in Latin script.",
  },

  film_awards_title: { ru: "Кинонаграды", kk: "Кинонаградалар", en: "Film Awards" },
  film_awards_intro: {
    ru: "В Турнире есть 3 основные кинонаграды:",
    kk: "Турнирде 3 негізгі кинонаграда бар:",
    en: "The Tournament has 3 main film awards:",
  },
  impact_desc: {
    ru: "за самый сильный эмоциональный и смысловой эффект. Оценивается то, насколько фильм цепляет зрителя, раскрывает тему и оставляет впечатление.",
    kk: "ең күшті эмоциялық және мағыналық әсер үшін. Фильмнің көрерменді қаншалықты баурайтыны, тақырыпты ашуы және әсер қалдыруы бағаланады.",
    en: "for the strongest emotional and conceptual impact. It evaluates how strongly the film engages the viewer, develops the theme and leaves an impression.",
  },
  tech_desc: {
    ru: "за техническое исполнение. Оцениваются монтаж, звук, сложность реализации, техническая аккуратность и изобретательность команды.",
    kk: "техникалық орындау үшін. Монтаж, дыбыс, жүзеге асыру күрделілігі, техникалық ұқыптылық және команданың тапқырлығы бағаланады.",
    en: "for technical execution. Editing, sound, implementation complexity, technical precision and the team's inventiveness are evaluated.",
  },
  glorious_desc: {
    ru: "главная награда Турнира. Присуждается фильму, который зрители и жюри оценили как лучшую работу в целом.",
    kk: "Турнирдің басты наградасы. Көрермендер мен қазылар алқасы жалпы үздік жұмыс деп бағалаған фильмге беріледі.",
    en: "the Tournament's main award. It is given to the film that viewers and the jury rate as the best overall work.",
  },
  film_awards_p1: {
    ru: "На финальном этапе фильмы оценивает жюри. Для каждой награды баллы считаются с разными коэффициентами: в каждой номинации сильнее всего учитывается именно её направление.",
    kk: "Финалдық кезеңде фильмдерді қазылар алқасы бағалайды. Әр награда үшін баллдар әртүрлі коэффициентпен есептеледі: әр номинацияда сол бағыт ең жоғары салмаққа ие болады.",
    en: "At the final stage, films are evaluated by the jury. For each award, points are calculated with different coefficients: each nomination gives the highest weight to its own direction.",
  },
  film_awards_p2: {
    ru: "Например, для Impact award основной вес имеет эмоциональное и смысловое впечатление, для Tech award — техническое исполнение.",
    kk: "Мысалы, Impact award үшін негізгі салмақ эмоциялық және мағыналық әсерге, Tech award үшін техникалық орындауға беріледі.",
    en: "For example, Impact award gives the most weight to emotional and conceptual impact, and Tech award to technical execution.",
  },
  film_awards_p3: {
    ru: "Для Glorious award все критерии учитываются равномерно.",
    kk: "Glorious award үшін барлық критерийлер тең дәрежеде ескеріледі.",
    en: "For Glorious award, all criteria are weighted evenly.",
  },

  inspire_title: { ru: "Connect & Reach", kk: "Connect & Reach", en: "Connect & Reach" },
  inspire_p1: {
    ru: "В рамках Турнира дополнительно оценивается работа команды по критериям Inspire. Inspire включает две награды: Connect и Reach.",
    kk: "Турнир аясында команданың Inspire критерийлері бойынша жұмысы қосымша бағаланады. Inspire екі награданы қамтиды: Connect және Reach.",
    en: "As part of the Tournament, the team's work is also evaluated by Inspire criteria. Inspire includes two awards: Connect and Reach.",
  },
  inspire_p2: {
    ru: "Connect оценивает, как команда взаимодействовала с другими людьми, получала полезную информацию и применяла её при создании фильма.",
    kk: "Connect команда басқа адамдармен қалай байланысқанын, пайдалы ақпарат алғанын және оны фильм жасау кезінде қалай қолданғанын бағалайды.",
    en: "Connect evaluates how the team interacted with other people, obtained useful information and applied it while creating the film.",
  },
  inspire_p3: {
    ru: "Для Connect команда должна описать:",
    kk: "Connect үшін команда мыналарды сипаттауы керек:",
    en: "For Connect, the team must describe:",
  },
  connect_b1: {
    ru: "с кем проводилось взаимодействие: роль или специализация человека;",
    kk: "кіммен байланыс жүргізілді: адамның рөлі немесе мамандануы;",
    en: "who the interaction was with: the person's role or specialization;",
  },
  connect_b2: {
    ru: "зачем команда к нему обратилась;",
    kk: "команда оған не үшін жүгінді;",
    en: "why the team contacted them;",
  },
  connect_b3: {
    ru: "в каком формате прошло взаимодействие: встреча, звонок, переписка и т. д.;",
    kk: "байланыс қандай форматта өтті: кездесу, қоңырау, хат алмасу және т. б.;",
    en: "the format of the interaction: meeting, call, messaging, etc.;",
  },
  connect_b4: {
    ru: "какие знания, советы или выводы команда получила;",
    kk: "команда қандай білім, кеңес немесе қорытынды алды;",
    en: "what knowledge, advice or conclusions the team gained;",
  },
  connect_b5: {
    ru: "как это повлияло на фильм или работу над проектом.",
    kk: "бұл фильмге немесе жоба жұмысына қалай әсер етті.",
    en: "how it influenced the film or the work on the project.",
  },
  inspire_p4: {
    ru: "Описание должно быть конкретным и проверяемым. Оргкомитет может запросить подтверждение взаимодействий.",
    kk: "Сипаттама нақты және тексерілетін болуы керек. Ұйымдастыру комитеті байланыстардың дәлелін сұрата алады.",
    en: "The description must be specific and verifiable. The organizing committee may request proof of the interactions.",
  },
  inspire_p5: {
    ru: "Reach оценивает, как команда продвигала свой проект и привлекала аудиторию.",
    kk: "Reach команда өз жобасын қалай ілгерілеткенін және аудиторияны қалай тартқанын бағалайды.",
    en: "Reach evaluates how the team promoted its project and attracted an audience.",
  },
  inspire_p6: {
    ru: "Для Reach команда должна создать и вести отдельный публичный аккаунт проекта в социальной сети. Контент должен быть связан с фильмом, процессом работы над ним и популяризацией культуры кино.",
    kk: "Reach үшін команда әлеуметтік желіде жобаның жеке ашық аккаунтын құрып, жүргізуі керек. Контент фильммен, оның жасалу процесімен және кино мәдениетін насихаттаумен байланысты болуы тиіс.",
    en: "For Reach, the team must create and maintain a separate public project account on a social network. The content must be related to the film, the work process and the promotion of film culture.",
  },
  inspire_p7: {
    ru: "При оценивании Reach учитываются:",
    kk: "Reach бағалау кезінде мыналар ескеріледі:",
    en: "Reach evaluation considers:",
  },
  reach_b1: { ru: "охват аудитории;", kk: "аудитория қамтылымы;", en: "audience reach;" },
  reach_b2: {
    ru: "взаимодействие с аудиторией;",
    kk: "аудиториямен өзара әрекеттесу;",
    en: "audience engagement;",
  },
  reach_b3: {
    ru: "прирост аудитории за последние 60 дней.",
    kk: "соңғы 60 күндегі аудитория өсімі.",
    en: "audience growth over the last 60 days.",
  },
  inspire_p8: {
    ru: "Команда должна быть готова предоставить статистику аккаунта по требованию жюри.",
    kk: "Команда қазылар алқасының талабы бойынша аккаунт статистикасын ұсынуға дайын болуы керек.",
    en: "The team must be ready to provide account statistics at the jury's request.",
  },
  inspire_p9: {
    ru: "Искусственная накрутка, аномальная вовлечённость и нечестные методы продвижения не допускаются. При нарушении оценка по Reach может быть снижена до нуля.",
    kk: "Жасанды көбейту, аномалды белсенділік және адал емес ілгерілету әдістеріне жол берілмейді. Бұзушылық болған жағдайда Reach бағасы нөлге дейін төмендетілуі мүмкін.",
    en: "Artificial boosting, abnormal engagement and dishonest promotion methods are not allowed. If a violation occurs, the Reach score may be reduced to zero.",
  },

  stages_title: { ru: "Этапы турнира", kk: "Турнир кезеңдері", en: "Tournament Stages" },
  stage_label: { ru: "Этап", kk: "Кезең", en: "Stage" },
  stage_1_title: { ru: "Проверочный этап", kk: "Тексеру кезеңі", en: "Review Stage" },
  stage_1_body: {
    ru: "Оргкомитет проверяет заявки и фильмы на соответствие требованиям. На этом этапе отсеиваются работы, не прошедшие модерацию, и определяются до 99 команд, которые проходят на зрительское голосование. Также на этом этапе определяются призёры наград Connect и Reach.",
    kk: "Ұйымдастыру комитеті өтінімдер мен фильмдердің талаптарға сәйкестігін тексереді. Бұл кезеңде модерациядан өтпеген жұмыстар іріктелмейді және көрермендер дауыс беруіне өтетін 99 командаға дейін анықталады. Connect және Reach наградаларының жүлдегерлері де осы кезеңде анықталады.",
    en: "The organizing committee checks applications and films for compliance with the requirements. Works that do not pass moderation are filtered out, and up to 99 teams are selected for audience voting. Winners of the Connect and Reach awards are also determined at this stage.",
  },
  stage_2_title: {
    ru: "Зрительское голосование",
    kk: "Көрермендер дауыс беруі",
    en: "Audience Voting",
  },
  stage_2_body: {
    ru: "Фильмы, прошедшие проверку, распределяются по дивизионам. Каждый дивизион смотрит отдельная группа зрителей, после чего они заполняют оценочный бланк и выбирают претендентов на кинонаграды. По итогам голосования фильмы с наибольшим количеством баллов в своих направлениях становятся номинантами на соответствующие награды.",
    kk: "Тексеруден өткен фильмдер дивизиондарға бөлінеді. Әр дивизионды жеке көрермендер тобы қарайды, содан кейін бағалау парағын толтырып, кинонаградаларға үміткерлерді таңдайды. Дауыс беру қорытындысы бойынша өз бағыттарында ең көп балл жинаған фильмдер тиісті наградаларға номинант болады.",
    en: "Films that pass review are divided into divisions. Each division is watched by a separate audience group, who then fill out a score sheet and choose candidates for the film awards. Based on voting results, films with the highest scores in their directions become nominees for the corresponding awards.",
  },
  stage_3_title: { ru: "Финальный этап", kk: "Финалдық кезең", en: "Final Stage" },
  stage_3_body: {
    ru: "Финал оценивает жюри. Фильмы соревнуются внутри своих направлений: Glorious award, Impact award, Tech award. В каждом направлении награждаются три команды, набравшие наибольшее количество баллов.",
    kk: "Финалды қазылар алқасы бағалайды. Фильмдер өз бағыттары бойынша сайысады: Glorious award, Impact award, Tech award. Әр бағытта ең көп балл жинаған үш команда марапатталады.",
    en: "The final is evaluated by the jury. Films compete within their directions: Glorious award, Impact award and Tech award. In each direction, the three teams with the highest scores are awarded.",
  },
  preference_title: {
    ru: "Порядок предпочтительных кинонаград",
    kk: "Басым кинонаградалар реті",
    en: "Preferred Film Awards Order",
  },
  preference_body: {
    ru: "Команда указывает порядок приоритета для трёх наград:",
    kk: "Команда үш награда үшін басымдық ретін көрсетеді:",
    en: "The team specifies the priority order for the three awards:",
  },
  example: { ru: "Пример", kk: "Мысал", en: "Example" },
  languages_title: { ru: "Языки и темы", kk: "Тілдер мен тақырыптар", en: "Languages and Themes" },
  languages_b1: {
    ru: "Темы фильма публикуются организаторами — команда выбирает одну из двух.",
    kk: "Фильм тақырыптарын ұйымдастырушылар жариялайды — команда екі тақырыптың бірін таңдайды.",
    en: "Film themes are published by the organizers, and the team chooses one of the two.",
  },
  languages_b2: {
    ru: "Язык фильма: казахский, русский или английский. Заявка заполняется на английском.",
    kk: "Фильм тілі: қазақ, орыс немесе ағылшын. Өтінім ағылшын тілінде толтырылады.",
    en: "Film language: Kazakh, Russian or English. The application is completed in English.",
  },
  regulations_title: {
    ru: "Положение турнира",
    kk: "Турнир ережесі",
    en: "Tournament Regulations",
  },
  regulations_body: {
    ru: "Полная версия положения доступна в DOCX: правила участия, порядок оценки, этапы и организационные условия турнира.",
    kk: "Ереженің толық нұсқасы DOCX форматында қолжетімді: қатысу ережелері, бағалау тәртібі, кезеңдер және турнирдің ұйымдастырушылық шарттары.",
    en: "The full regulations are available as a DOCX: participation rules, evaluation procedure, stages and organizational terms of the tournament.",
  },
  download_docx: { ru: "Скачать DOCX", kk: "DOCX жүктеу", en: "Download DOCX" },
  final_title: { ru: "Готовы участвовать?", kk: "Қатысуға дайынсыз ба?", en: "Ready to join?" },
  final_body: {
    ru: "Соберите команду, зарегистрируйтесь до 10 августа и загрузите фильм до",
    kk: "Команда жинап, 10 тамызға дейін тіркеліп, фильмді мына күнге дейін жүктеңіз:",
    en: "Build a team, register by 10 August and upload your film by",
  },
  signup: { ru: "Регистрация", kk: "Тіркелу", en: "Register" },
};

function TournamentPage() {
  useReveal();
  const { lang } = useI18n();
  const open = isSubmissionsOpen();
  const regOpen = isRegistrationOpen();
  const left = timeUntilDeadline();
  const tr = (key: keyof typeof C) => C[key][lang];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <header className="reveal text-center">
        <span className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
          <Trophy className="h-3.5 w-3.5 text-accent" />
          {tr("kicker")}
        </span>
        <h1 className="mt-5 font-display text-4xl leading-tight sm:text-6xl">
          <span className="text-gradient">{tr("title_a")}</span>{" "}
          <em className="font-serif italic font-normal">{tr("title_b")}</em>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl font-serif italic text-muted-foreground">
          {tr("intro")}
        </p>

        <div className="mt-8 inline-flex flex-col items-center gap-2 glass rounded-2xl px-5 py-3 text-sm">
          {open || regOpen ? (
            <>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <CalendarClock className="h-4 w-4 text-accent" />
                <span className="text-muted-foreground">{tr("reg_deadline_label")}</span>
                <span className="font-display">{formatRegistrationDeadline(lang)}</span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <CalendarClock className="h-4 w-4 text-accent" />
                <span className="text-muted-foreground">{tr("film_deadline_label")}</span>
                <span className="font-display">{formatDeadline(lang)}</span>
                {open && (
                  <span className="text-accent">
                    · {tr("left")} {left.days}
                    {tr("days")} {left.hours}
                    {tr("hours")}
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-accent" />
              <span className="text-muted-foreground">{tr("deadline_closed")}</span>
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild variant="hero" size="xl">
            <Link to="/upload">{tr("submit")}</Link>
          </Button>
          <Button asChild variant="glass" size="xl">
            <Link to="/dashboard">{tr("dashboard")}</Link>
          </Button>
          <div className="flex flex-wrap justify-center gap-2">
            <Button asChild variant="glass" size="xl">
              <a href="/Положение_YCT.docx" download>
                <Download className="h-4 w-4" /> RU
              </a>
            </Button>
            <Button asChild variant="glass" size="xl">
              <a href="/YCT_Regulations_KZ.docx" download>
                <Download className="h-4 w-4" /> KZ
              </a>
            </Button>
            <Button asChild variant="glass" size="xl">
              <a href="/YCT_Regulations_EN.docx" download>
                <Download className="h-4 w-4" /> EN
              </a>
            </Button>
          </div>
        </div>
      </header>

      <div className="mt-16 space-y-12">
        <Section icon={Users} title={tr("participation_title")}>
          <Paragraph>{tr("participation_p1")}</Paragraph>
          <Paragraph>{tr("participation_p2")}</Paragraph>
          <Paragraph>{tr("participation_p3")}</Paragraph>
          <Bullet>{tr("participation_b1")}</Bullet>
          <Bullet>{tr("participation_b2")}</Bullet>
          <Bullet>{tr("participation_b3")}</Bullet>
          <Bullet>{tr("participation_b4")}</Bullet>
          <Bullet>{tr("participation_b5")}</Bullet>
          <Bullet>{tr("participation_b6")}</Bullet>
          <Bullet>{tr("participation_b7")}</Bullet>
          <Bullet>{tr("participation_b8")}</Bullet>
          <Bullet>{tr("participation_b9")}</Bullet>
          <Bullet>{tr("participation_b10")}</Bullet>
          <Bullet>{tr("participation_b11")}</Bullet>
          <Bullet>{tr("participation_b12")}</Bullet>
          <Paragraph>{tr("participation_p4")}</Paragraph>
          <Paragraph>{tr("participation_p5")}</Paragraph>
        </Section>

        <Section icon={Award} title={tr("film_awards_title")}>
          <Paragraph>{tr("film_awards_intro")}</Paragraph>
          <AwardCard name="Impact award" body={tr("impact_desc")} />
          <AwardCard name="Tech award" body={tr("tech_desc")} />
          <AwardCard name="Glorious award" body={tr("glorious_desc")} />
          <Paragraph>{tr("film_awards_p1")}</Paragraph>
          <Paragraph>{tr("film_awards_p2")}</Paragraph>
          <Paragraph>{tr("film_awards_p3")}</Paragraph>
        </Section>

        <Section icon={Instagram} title={tr("inspire_title")}>
          <Paragraph>{tr("inspire_p1")}</Paragraph>
          <Paragraph>{tr("inspire_p2")}</Paragraph>
          <Paragraph>{tr("inspire_p3")}</Paragraph>
          <div className="mt-3 space-y-2">
            <Bullet>{tr("connect_b1")}</Bullet>
            <Bullet>{tr("connect_b2")}</Bullet>
            <Bullet>{tr("connect_b3")}</Bullet>
            <Bullet>{tr("connect_b4")}</Bullet>
            <Bullet>{tr("connect_b5")}</Bullet>
          </div>
          <Paragraph>{tr("inspire_p4")}</Paragraph>
          <Paragraph>{tr("inspire_p5")}</Paragraph>
          <Paragraph>{tr("inspire_p6")}</Paragraph>
          <Paragraph>{tr("inspire_p7")}</Paragraph>
          <div className="mt-3 space-y-2">
            <Bullet>{tr("reach_b1")}</Bullet>
            <Bullet>{tr("reach_b2")}</Bullet>
            <Bullet>{tr("reach_b3")}</Bullet>
          </div>
          <Paragraph>{tr("inspire_p8")}</Paragraph>
          <Paragraph>{tr("inspire_p9")}</Paragraph>
        </Section>

        <Section icon={ListChecks} title={tr("stages_title")}>
          <div className="grid gap-4">
            <StageCard
              idx="01"
              label={tr("stage_label")}
              title={tr("stage_1_title")}
              body={tr("stage_1_body")}
            />
            <StageCard
              idx="02"
              label={tr("stage_label")}
              title={tr("stage_2_title")}
              body={tr("stage_2_body")}
            />
            <StageCard
              idx="03"
              label={tr("stage_label")}
              title={tr("stage_3_title")}
              body={tr("stage_3_body")}
            />
          </div>
        </Section>

        <Section icon={Award} title={tr("preference_title")}>
          <p className="text-sm text-foreground/85">{tr("preference_body")}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <NomCard idx="01" name="Glorious Award" />
            <NomCard idx="02" name="Impact Award" />
            <NomCard idx="03" name="Tech Award" />
          </div>
          <div className="mt-6 glass rounded-2xl p-5 text-sm">
            <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
              {tr("example")}
            </p>
            <ol className="mt-2 list-decimal pl-5 text-foreground/90">
              <li>Glorious Award</li>
              <li>Impact Award</li>
              <li>Tech Award</li>
            </ol>
          </div>
        </Section>

        <Section icon={Languages} title={tr("languages_title")}>
          <Bullet>{tr("languages_b1")}</Bullet>
          <Bullet>{tr("languages_b2")}</Bullet>
        </Section>

        <Section icon={Download} title={tr("regulations_title")}>
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <p className="max-w-2xl text-sm leading-relaxed text-foreground/85">
              {tr("regulations_body")}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="hero" size="sm">
                <a href="/Положение_YCT.docx" download>
                  <Download className="h-4 w-4" /> RU
                </a>
              </Button>
              <Button asChild variant="hero" size="sm">
                <a href="/YCT_Regulations_KZ.docx" download>
                  <Download className="h-4 w-4" /> KZ
                </a>
              </Button>
              <Button asChild variant="hero" size="sm">
                <a href="/YCT_Regulations_EN.docx" download>
                  <Download className="h-4 w-4" /> EN
                </a>
              </Button>
            </div>
          </div>
        </Section>
      </div>

      <section className="mt-16 glass relative overflow-hidden rounded-3xl p-8 sm:p-12 reveal">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full [background:var(--gradient-primary)] opacity-20 blur-3xl" />
        <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <h3 className="font-display text-3xl sm:text-4xl text-gradient">{tr("final_title")}</h3>
            <p className="mt-2 max-w-xl font-serif italic text-muted-foreground">
              {tr("final_body")} {formatDeadline(lang)}.
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="hero" size="lg">
              <Link to="/upload">{tr("submit")}</Link>
            </Button>
            <Button asChild variant="glass" size="lg">
              <Link to="/signup">{tr("signup")}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return <p className="text-sm leading-relaxed text-foreground/85">{children}</p>;
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

function AwardCard({ name, body }: { name: string; body: string }) {
  return (
    <Card>
      <h3 className="font-display text-lg flex items-center gap-2">
        <Clapperboard className="h-4 w-4 text-accent" />
        {name}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-foreground/85">{body}</p>
    </Card>
  );
}

function StageCard({
  idx,
  label,
  title,
  body,
}: {
  idx: string;
  label: string;
  title: string;
  body: string;
}) {
  return (
    <Card>
      <p className="text-[11px] uppercase tracking-[0.25em] text-accent/80">
        {label} {idx}
      </p>
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
