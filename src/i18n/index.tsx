import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "ru" | "kk" | "en";

type Dict = Record<string, { ru: string; kk: string; en: string }>;

const D: Dict = {
  // nav
  nav_home: { ru: "Главная", kk: "Басты", en: "Home" },
  nav_explore: { ru: "Фильмы", kk: "Фильмдер", en: "Films" },
  nav_dashboard: { ru: "Кабинет", kk: "Кабинет", en: "Dashboard" },
  nav_submit: { ru: "Подать заявку", kk: "Өтінім беру", en: "Submit" },
  nav_login: { ru: "Войти", kk: "Кіру", en: "Sign in" },
  nav_logout: { ru: "Выйти", kk: "Шығу", en: "Sign out" },

  // hero
  hero_kicker: {
    ru: "Международный кино-турнир",
    kk: "Халықаралық кино-турнир",
    en: "International Film Tournament",
  },
  hero_title_a: { ru: "Кино — это место,", kk: "Кино — бұл орын,", en: "Cinema is a place" },
  hero_title_b: {
    ru: "где каждый может помечтать.",
    kk: "онда әркім армандай алады.",
    en: "where anyone can dream.",
  },
  hero_sub: {
    ru: "Соберите команду, снимите короткометражку и поборитесь за миллион.",
    kk: "Команда жинаңыз, қысқаметражды түсіріп, миллион үшін күресіңіз.",
    en: "Build a team, shoot a short film and compete for a million.",
  },
  hero_cta_join: { ru: "Подать заявку", kk: "Өтінім беру", en: "Apply now" },
  hero_cta_explore: { ru: "Смотреть фильмы", kk: "Фильмдерді көру", en: "Watch films" },

  // tournament info
  ti_title: { ru: "О турнире", kk: "Турнир туралы", en: "About the tournament" },
  ti_themes: { ru: "Темы", kk: "Тақырыптар", en: "Themes" },
  ti_themes_body: {
    ru: "Конец или начало\nМои заботы",
    kk: "Соңы немесе басы\nМенің мазасыздықтарым",
    en: "The end or the beginning\nMy concerns",
  },
  ti_who: { ru: "Кто может участвовать", kk: "Кім қатыса алады", en: "Who can participate" },
  ti_who_body: {
    ru: "Год рождения с 2003 по текущий год включительно. Команда от 3 до 7 человек + до 10 человек массовки.",
    kk: "2003 жылдан бастап ағымдағы жылға дейін туғандар. 3–7 адамдық топ + 10-ға дейін массовка.",
    en: "Born from 2003 through the current year inclusive. Team of 3 to 7 + up to 10 extras.",
  },
  ti_teams: { ru: "Зарегистрированных команд", kk: "Тіркелген топтар", en: "Registered teams" },
  ti_prize: { ru: "Призовой фонд", kk: "Жүлде қоры", en: "Prize fund" },
  ti_prize_amount: { ru: "1 000 000 ₸", kk: "1 000 000 ₸", en: "$2000" },
  ti_uploaded: { ru: "Загруженных фильмов", kk: "Жүктелген фильмдер", en: "Uploaded films" },
  ti_format: { ru: "Формат фильмов", kk: "Фильм форматы", en: "Film format" },
  ti_format_body: {
    ru: "Горизонтальный кадр, хронометраж 5–16 минут.",
    kk: "Көлденең кадр, ұзақтығы 5–16 минут.",
    en: "Horizontal frame, 5–16 minutes runtime.",
  },
  ti_ai: { ru: "Использование ИИ", kk: "ЖИ-ні қолдану", en: "AI usage" },
  ti_ai_body: {
    ru: "Не полностью — только как вспомогательный инструмент. Например: микс-медиа или удалить лишнее в кадре.",
    kk: "Толық емес — тек көмекші құрал ретінде. Мысалы: микс-медиа немесе кадрдағы артықты өшіру.",
    en: "Not fully — only as an auxiliary tool. E.g. mix-media or removing unwanted objects from the frame.",
  },
  ti_forbidden: { ru: "Что запрещено", kk: "Тыйым салынады", en: "Forbidden" },
  ti_forbidden_body: {
    ru: "Сцены 18+, нецензурная лексика, плагиат, существенное использование ИИ, недостоверная информация в части Inspire.",
    kk: "18+ көріністер, былапыт сөздер, плагиат, ЖИ-ді елеулі пайдалану, Inspire бөлігінде жалған ақпарат.",
    en: "18+ scenes, profanity, plagiarism, substantial AI usage, false information in the Inspire section.",
  },
  ti_sponsors: { ru: "Спонсоры", kk: "Демеушілер", en: "Sponsors" },
  ti_sponsors_body: {
    ru: "Место для логотипов партнёров",
    kk: "Серіктестердің логотиптеріне арналған орын",
    en: "Partner logos space",
  },
  ti_download: {
    ru: "Скачать положение турнира",
    kk: "Турнир ережесін жүктеу",
    en: "Download regulations",
  },
  // tournament creators block
  tc_kicker: { ru: "Создатели турнира", kk: "Турнир жасаушылары", en: "The Tournament Creators" },
  tc_title_a: { ru: "Команда", kk: "Команда", en: "Team" },
  tc_title_b: {
    ru: "Aurelion Youth Alliance",
    kk: "Aurelion Youth Alliance",
    en: "Aurelion Youth Alliance",
  },
  tc_sub: {
    ru: "Young Cinema Tournament — один из наших проектов.",
    kk: "Young Cinema Tournament — біздің жобаларымыздың бірі.",
    en: "Young Cinema Tournament is one of our projects.",
  },
  tc_project_yrt: {
    ru: "Young Researchers Tournament",
    kk: "Young Researchers Tournament",
    en: "Young Researchers Tournament",
  },
  tc_project_yrt_note: { ru: "современно с YOC", kk: "YOC-пен заманауи", en: "modern with YOC" },
  tc_project_iat: {
    ru: "International Adventurers Tournament",
    kk: "International Adventurers Tournament",
    en: "International Adventurers Tournament",
  },
  tc_project_nsb: {
    ru: "National Science Battles",
    kk: "National Science Battles",
    en: "National Science Battles",
  },
  tc_project_nsb_note: {
    ru: "современно с Beyond Curriculum",
    kk: "Beyond Curriculum-пен заманауи",
    en: "modern with Beyond Curriculum",
  },
  tc_project_more: { ru: "И другие", kk: "Және басқалары", en: "And others" },
  featured_kicker: { ru: "Авант-премьера", kk: "Авант-премьера", en: "Avant-Première" },
  featured_locked: {
    ru: "станут доступны после окончания подачи заявок",
    kk: "өтінім қабылдау аяқталғаннан кейін қолжетімді болады",
    en: "will become available after submissions close",
  },

  // submit form
  sub_title: { ru: "Заявка на турнир", kk: "Турнирге өтінім", en: "Tournament submission" },
  sub_film: { ru: "О фильме", kk: "Фильм туралы", en: "Film" },
  sub_film_title: { ru: "Название фильма", kk: "Фильм атауы", en: "Film title" },
  sub_theme: { ru: "Тема фильма", kk: "Фильм тақырыбы", en: "Film theme" },
  sub_theme_1: { ru: "Конец или начало", kk: "Соңы немесе басы", en: "The end or the beginning" },
  sub_theme_2: { ru: "Мои заботы", kk: "Менің мазасыздықтарым", en: "My concerns" },
  sub_desc: { ru: "Краткое описание", kk: "Қысқаша сипаттама", en: "Short description" },
  sub_genres: {
    ru: "Жанры (через запятую)",
    kk: "Жанрлар (үтірмен)",
    en: "Genres (comma-separated)",
  },
  sub_video: { ru: "Видеофайл", kk: "Бейне файл", en: "Video file" },
  sub_video_hint: {
    ru: "MP4 / MOV / WebM • 5–16 минут • макс. 2 ГБ",
    kk: "MP4 / MOV / WebM • 5–16 минут • макс. 2 ГБ",
    en: "MP4 / MOV / WebM • 5–16 minutes • max 2 GB",
  },
  sub_thumb: {
    ru: "Обложка (необязательно)",
    kk: "Мұқаба (міндетті емес)",
    en: "Cover (optional)",
  },
  sub_portfolio: { ru: "Социальное портфолио", kk: "Әлеуметтік портфолио", en: "Social portfolio" },
  sub_portfolio_hint: {
    ru: "Connect и Reach фиксируются для отдельных наград и не добавляют баллы к основным направлениям.",
    kk: "Connect және Reach жеке марапаттар үшін тіркеледі және негізгі бағыттарға қосымша ұпай қоспайды.",
    en: "Connect and Reach are tracked for separate awards and do not add points to the main categories.",
  },
  sub_reach: {
    ru: "Reach — охват, аудитория, медиа",
    kk: "Reach — қамту, аудитория, медиа",
    en: "Reach — audience, media, coverage",
  },
  sub_connect: {
    ru: "Connect — связи, партнёры, коллабы",
    kk: "Connect — байланыс, серіктестер",
    en: "Connect — partners, collabs",
  },
  sub_doc: {
    ru: "Документ-портфолио (PDF, до 10 МБ)",
    kk: "Портфолио құжаты (PDF, 10 МБ-қа дейін)",
    en: "Portfolio document (PDF, up to 10 MB)",
  },
  sub_participants: { ru: "Участники команды", kk: "Топ мүшелері", en: "Team members" },
  sub_participants_hint: {
    ru: "3 обязательных, до 4 опциональных (год рождения с 2003 по текущий)",
    kk: "3 міндетті, 4-ке дейін қосымша (2003 жылдан ағымдағы жылға дейін)",
    en: "3 required, up to 4 optional (born from 2003 through the current year)",
  },
  sub_p_name: { ru: "ФИО (English)", kk: "Аты-жөні (English)", en: "Full name (English)" },
  sub_p_email: { ru: "Email", kk: "Email", en: "Email" },
  sub_p_dob: { ru: "Дата рождения", kk: "Туған күні", en: "Date of birth" },
  sub_p_role: { ru: "Роль в команде", kk: "Топтағы рөлі", en: "Team role" },
  sub_required: { ru: "Обязательный", kk: "Міндетті", en: "Required" },
  sub_optional: { ru: "Опциональный", kk: "Қосымша", en: "Optional" },
  sub_save_draft: { ru: "Сохранить черновик", kk: "Жобаны сақтау", en: "Save draft" },
  sub_send: { ru: "Отправить заявку", kk: "Өтінімді жіберу", en: "Submit application" },
  sub_sending: { ru: "Отправляем...", kk: "Жіберілуде...", en: "Submitting..." },
  sub_err_duration_min: {
    ru: "Видео слишком короткое. Минимум 5 минут.",
    kk: "Бейне тым қысқа. Ең аз дегенде 5 минут.",
    en: "Video is too short. Minimum 5 minutes.",
  },
  sub_err_duration_max: {
    ru: "Видео слишком длинное. Максимум 16 минут.",
    kk: "Бейне тым ұзын. Ең көбі 16 минут.",
    en: "Video is too long. Maximum 16 minutes.",
  },

  // team signup
  signup_team_title: {
    ru: "Регистрация команды",
    kk: "Команданы тіркеу",
    en: "Register your team",
  },
  signup_team_name: { ru: "Название команды", kk: "Команда атауы", en: "Team name" },
  signup_country: { ru: "Страна", kk: "Ел", en: "Country" },
  signup_city: { ru: "Город", kk: "Қала", en: "City" },
  signup_lang: { ru: "Язык", kk: "Тіл", en: "Language" },

  // explore
  explore_kicker: { ru: "Подборка", kk: "Таңдау", en: "Selection" },
  explore_title: { ru: "Исследовать", kk: "Зерттеу", en: "Explore" },
  explore_sub: {
    ru: "Свежие короткометражки от авторов",
    kk: "Авторлардың жаңа қысқаметрлері",
    en: "Fresh shorts from creators",
  },
  explore_search_ph: {
    ru: "Поиск по названию, описанию или тегу",
    kk: "Атау, сипаттама немесе тег бойынша іздеу",
    en: "Search by title, description or tag",
  },
  explore_clear: { ru: "Очистить", kk: "Тазалау", en: "Clear" },
  explore_empty: {
    ru: "Пока пусто. Загрузите первый фильм.",
    kk: "Әзірге бос. Алғашқы фильмді жүктеңіз.",
    en: "Nothing here yet. Upload the first film.",
  },
  explore_no_results: {
    ru: "Ничего не найдено по запросу",
    kk: "Сұраныс бойынша ештеңе табылмады",
    en: "No results for your query",
  },
};

const Ctx = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: keyof typeof D) => string;
}>({
  lang: "ru",
  setLang: () => {},
  t: (k) => String(k),
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ru");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("yct_lang") as Lang | null;
    if (saved === "ru" || saved === "kk" || saved === "en") setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("yct_lang", l);
  };

  const t = (k: keyof typeof D) => D[k]?.[lang] ?? String(k);
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);
