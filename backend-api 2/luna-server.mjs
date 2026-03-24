import { createServer } from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import swisseph from "swisseph";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = __dirname;
let LOG_DIR = path.join(ROOT, "chat-logs");
const PORT = Number(process.env.PORT || 8787);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const YOUTUBE_GENERAL_URL = process.env.YOUTUBE_GENERAL_URL || "https://www.youtube.com/";
const YOUTUBE_HOROSCOPE_URL = process.env.YOUTUBE_HOROSCOPE_URL || "https://www.youtube.com/";
const YOUTUBE_CHANNEL_URL = process.env.YOUTUBE_CHANNEL_URL || "https://www.youtube.com/@Lunarisma1100";
const INSTAGRAM_URL = process.env.INSTAGRAM_URL || "https://www.instagram.com/kayayamansa/";
const EMAIL_NOTIFICATIONS_ENABLED = String(process.env.EMAIL_NOTIFICATIONS_ENABLED || "false").toLowerCase() === "true";
const NOTIFY_TO_EMAIL = process.env.NOTIFY_TO_EMAIL || "joycemansamba@ymail.com";
const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = String(process.env.SMTP_SECURE || "false").toLowerCase() === "true";
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER || "LUNA <no-reply@lunarisma.local>";
const PENDING_NOTIFY_FILE = path.join(LOG_DIR, "pending-online-notifications.json");
const HOROSCOPE_DEFAULT_TIMEZONE_OFFSET = process.env.HOROSCOPE_DEFAULT_TIMEZONE_OFFSET || "+01:00";
const HOROSCOPE_EMAIL_SUBJECT = process.env.HOROSCOPE_EMAIL_SUBJECT || "Heyy, dein kostenloses Horoskop ist da";
const CHAT_TRANSCRIPT_SUBJECT = process.env.CHAT_TRANSCRIPT_SUBJECT || "Heyy, hier ist euer Chatverlauf";
const OPENAI_TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS || 30000);
const MAX_MODEL_MESSAGES = Number(process.env.MAX_MODEL_MESSAGES || 12);
const MAX_SUMMARY_MESSAGES = Number(process.env.MAX_SUMMARY_MESSAGES || 10);
const PERSONA_PROFILE = `
Joyce/Lunarisma - Stilprofil:
- kreativ-strategisch, visionaer, systemorientiert
- stark aesthetisch: mystisch, luxurioes, editorial, dunkle Toene mit Gold/Silber
- symbolisch-archetypisches Denken (Astrologie, Mythologie, Spiritualitaet)
- warm, persoenlich, community-orientiert, direkt ansprechende Sprache
- bildhafte, poetische Formulierungen, aber dennoch klar und praxisnah
- Fokus inhaltlich: Astrologie als Lebenshilfe, psychologische Tiefe, Heilung, Selbstentwicklung
- Arbeitsstil: multi-projektig, unternehmerisch, Community-Aufbau, Kurs-/Wissenssysteme

Kommunikationsstil:
- natuerlich und muendlich klingend, nicht steif
- emotionale Intensitaet mit ruhiger Fuehrung
- konkrete naechste Schritte + alltagsnahe Beispiele
- aktive Smalltalk-Fuehrung: freundlich nachfragen, empathisch spiegeln, einladend antworten
- nahbar, charmant, weich formuliert, herzlich
- maximal 0 bis 3 Emojis pro Nachricht
- keine erfundenen privaten Geschichten oder Fakten
`;

const VIDEO_CATALOG = [
  {
    title: "Wo begegnet dir die Venus? Orte der Venus im 1.-12. Haus",
    topics: ["venus", "haeuser", "anziehung", "harmonie", "selbstwert"],
    learning: "Wo sich Venus-Energie in den 12 Lebensbereichen zeigt und wie man Harmonie gezielt staerkt.",
  },
  {
    title: "Warum Liebeskummer deine Identitaet erschuettert",
    topics: ["liebeskummer", "trennung", "identitaet", "venus", "heilung"],
    learning: "Warum Trennungsschmerz oft wie Identitaetsverlust wirkt und wie astrologische Deutung Heilung unterstuetzt.",
  },
  {
    title: "Astrologische Aspekte verstehen - das verborgene System hinter deinem Horoskop",
    topics: ["aspekte", "technik", "grundlagen", "radix", "deutung"],
    learning: "Wie Aspekte zwischen Planeten funktionieren und Dynamiken im Horoskop lesbar machen.",
  },
  {
    title: "Was die Sterne deinem Koerper fluestern",
    topics: ["koerper", "psyche", "gesundheit", "zeichen"],
    learning: "Verbindung zwischen Sternzeichen und Koerperzonen fuer mehr Koerperbewusstsein.",
  },
  {
    title: "Reaction: Wenn das stimmt, aendert sich ALLES... (Teil 1 & 2)",
    topics: ["ancestral wounds", "ahnen", "heilung", "trauma", "spirituell"],
    learning: "Wie Ahnen-Traumata in die Gegenwart wirken und spirituelle Aufarbeitung moeglich wird.",
  },
  {
    title: "Meine Erfahrungen mit allen Sternzeichen: Stier",
    topics: ["stier", "sternzeichen", "erfahrungen", "charakter"],
    learning: "Praxisnahe Stier-Einblicke mit Fokus auf Stabilitaet, Genuss und Erdung.",
  },
  {
    title: "Sternzeichen Loewe: Idealisiert, begehrt... und emotional anstrengend?",
    topics: ["loewe", "beziehungen", "emotionen", "dynamik"],
    learning: "Licht- und Schattenseiten des Loewe-Archetyps in Beziehungen.",
  },
  {
    title: "So macht ein Wassermann mit einer Waage Schluss",
    topics: ["wassermann", "waage", "trennung", "beziehung", "luftzeichen"],
    learning: "Wie unterschiedliche Beziehungsstile in Konflikt und Trennung sichtbar werden.",
  },
  {
    title: "Deine Sonne & dein Mond - Astrologie Mini-Breakdown",
    topics: ["sonne", "mond", "grundlagen", "persoenlichkeit", "gefuehle"],
    learning: "Sonne als bewusstes Selbst und Mond als emotionale Beduerfnisstruktur.",
  },
  {
    title: "Das Gestirn Erde",
    topics: ["erde", "grundlagen", "perspektive", "astrologie"],
    learning: "Warum die Erde als Bezugspunkt in astrologischer Betrachtung zentral ist.",
  },
  {
    title: "Was koennen wir hier gerade lernen? (Hingabe & Wachstum)",
    topics: ["wachstum", "hingabe", "reflexion", "entwicklung"],
    learning: "Astrologie als Werkzeug fuer Vertrauen, Reifung und innere Entwicklung.",
  },
  {
    title: "Was, wenn Light Yagami sein Horoskop gelesen haette?",
    topics: ["popkultur", "archetypen", "charakteranalyse", "death note"],
    learning: "Anwendung astrologischer Archetypen auf fiktive Figuren.",
  },
];

const toSearchLink = (title) => `https://www.youtube.com/results?search_query=${encodeURIComponent(`Lunarisma ${title}`)}`;
const catalogLines = VIDEO_CATALOG.map(
  (video, idx) =>
    `${idx + 1}. ${video.title} | Themen: ${video.topics.join(", ")} | Lerneffekt: ${video.learning} | Suchlink: ${toSearchLink(video.title)}`
).join("\n");

try {
  await fs.mkdir(LOG_DIR, { recursive: true });
} catch {
  LOG_DIR = path.join("/tmp", "luna-chat-logs");
  await fs.mkdir(LOG_DIR, { recursive: true });
}

const mimeByExt = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "application/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".svg", "image/svg+xml"],
  [".ico", "image/x-icon"],
]);

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const json = (res, status, payload) => {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    ...CORS_HEADERS,
  });
  res.end(JSON.stringify(payload));
};

const readBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf-8"));
  } catch {
    return {};
  }
};

const sanitizeSessionId = (value) => {
  const cleaned = String(value || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
  return cleaned || `luna_${Date.now()}`;
};

let transporterPromise = null;
const getTransporter = async () => {
  if (transporterPromise) return transporterPromise;
  transporterPromise = (async () => {
    const mod = await import("nodemailer");
    const nodemailer = mod.default || mod;
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  })();
  return transporterPromise;
};

const formatBerlinNow = () =>
  new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin",
    dateStyle: "full",
    timeStyle: "medium",
  }).format(new Date());

const easterSunday = (year) => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { year, month, day };
};

const addDaysObj = (dateObj, days) => {
  const dt = new Date(Date.UTC(dateObj.year, dateObj.month - 1, dateObj.day));
  dt.setUTCDate(dt.getUTCDate() + days);
  return { year: dt.getUTCFullYear(), month: dt.getUTCMonth() + 1, day: dt.getUTCDate() };
};

const ymdObj = (d) => `${String(d.year).padStart(4, "0")}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;

const getHolidayNameBerlin = (parts) => {
  const md = `${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
  const fixed = new Map([
    ["01-01", "Neujahr"],
    ["05-01", "Tag der Arbeit"],
    ["10-03", "Tag der Deutschen Einheit"],
    ["12-24", "Heiligabend"],
    ["12-25", "Weihnachten"],
    ["12-26", "Zweiter Weihnachtstag"],
    ["12-31", "Silvester"],
  ]);
  if (fixed.has(md)) return fixed.get(md);
  const easter = easterSunday(parts.year);
  const ymd = ymdObj(parts);
  if (ymdObj(easter) === ymd) return "Ostersonntag";
  if (ymdObj(addDaysObj(easter, -2)) === ymd) return "Karfreitag";
  if (ymdObj(addDaysObj(easter, 1)) === ymd) return "Ostermontag";
  if (ymdObj(addDaysObj(easter, 39)) === ymd) return "Christi Himmelfahrt";
  if (ymdObj(addDaysObj(easter, 50)) === ymd) return "Pfingstmontag";
  return "";
};

const getBerlinDateParts = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Berlin",
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
    .formatToParts(date)
    .reduce((acc, part) => {
      if (part.type !== "literal") acc[part.type] = part.value;
      return acc;
    }, {});

  return {
    weekday: String(parts.weekday || "Mon"),
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
};

const toYmd = ({ year, month, day }) =>
  `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const addDaysYmd = (ymd, days) => {
  const [y, m, d] = String(ymd || "").split("-").map(Number);
  const dt = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
  dt.setUTCDate(dt.getUTCDate() + days);
  return toYmd({
    year: dt.getUTCFullYear(),
    month: dt.getUTCMonth() + 1,
    day: dt.getUTCDate(),
  });
};

const weekdayFromYmd = (ymd) => {
  const [y, m, d] = String(ymd || "").split("-").map(Number);
  const dt = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
  const w = dt.getUTCDay();
  return w;
};

const randomOddMinute = (min, max) => {
  const start = min % 2 === 1 ? min : min + 1;
  const values = [];
  for (let v = start; v <= max; v += 2) values.push(v);
  return values[Math.floor(Math.random() * values.length)];
};

const planNextHumanOnlineMoment = () => {
  const now = getBerlinDateParts();
  const today = toYmd(now);
  const baseDate = now.hour < 8 ? today : addDaysYmd(today, 1);
  const weekday = weekdayFromYmd(baseDate); // 0=Sun, 6=Sat
  const isWeekend = weekday === 0 || weekday === 6;

  let hour;
  let minute;
  if (isWeekend) {
    hour = Math.random() < 0.5 ? 9 : 10;
    minute = randomOddMinute(1, 59);
  } else {
    if (Math.random() < 0.22) {
      hour = 9;
      minute = randomOddMinute(1, 19);
    } else {
      hour = 8;
      minute = randomOddMinute(3, 29);
    }
  }

  return {
    notifyOnDate: baseDate,
    notifyHour: hour,
    notifyMinute: minute,
  };
};

const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());

const loadPendingNotifications = async () => {
  try {
    const raw = await fs.readFile(PENDING_NOTIFY_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // ignore
  }
  return [];
};

const savePendingNotifications = async (items) => {
  await fs.writeFile(PENDING_NOTIFY_FILE, JSON.stringify(items, null, 2), "utf-8");
};

const sendFirstMessageEmail = async ({ sessionId, message, language }) => {
  if (!EMAIL_NOTIFICATIONS_ENABLED) return;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn("E-Mail-Notification aktiv, aber SMTP-Config unvollstaendig.");
    return;
  }

  try {
    const transporter = await getTransporter();
    const subject = `LUNA: Neue erste Kundennachricht (${sessionId})`;
    const text = [
      "Neue erste Nachricht im LUNA-Chat.",
      "",
      `Zeit (Berlin): ${formatBerlinNow()}`,
      `Session: ${sessionId}`,
      `Sprache: ${language}`,
      "",
      "Kundennachricht:",
      message,
    ].join("\n");

    await transporter.sendMail({
      from: SMTP_FROM,
      to: NOTIFY_TO_EMAIL,
      subject,
      text,
    });
  } catch (error) {
    console.error("E-Mail-Benachrichtigung fehlgeschlagen:", error?.message || error);
  }
};

const sendOfflineOwnerNotification = async ({ sessionId, message, language, visitorEmail = "" }) => {
  if (!EMAIL_NOTIFICATIONS_ENABLED) return;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return;
  try {
    const transporter = await getTransporter();
    const subject = `LUNA: Offline-Nachricht (${sessionId})`;
    const text = [
      "Neue Nachricht ausserhalb der Oeffnungszeiten.",
      "",
      `Zeit (Berlin): ${formatBerlinNow()}`,
      `Session: ${sessionId}`,
      `Sprache: ${language || "de"}`,
      `E-Mail im Text: ${visitorEmail || "-"}`,
      "",
      "Kundennachricht:",
      String(message || ""),
    ].join("\n");

    await transporter.sendMail({
      from: SMTP_FROM,
      to: NOTIFY_TO_EMAIL,
      subject,
      text,
    });
  } catch (error) {
    console.error("Offline-Benachrichtigung fehlgeschlagen:", error?.message || error);
  }
};

let notifyProcessing = false;
const processPendingOnlineNotifications = async () => {
  if (notifyProcessing) return;
  if (!EMAIL_NOTIFICATIONS_ENABLED) return;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return;

  notifyProcessing = true;
  try {
    const pending = await loadPendingNotifications();
    if (!pending.length) return;

    const now = getBerlinDateParts();
    const nowDate = toYmd(now);
    const nowMinutes = now.hour * 60 + now.minute;
    const due = pending.filter((entry) => {
      if (!entry?.notifyOnDate) return false;
      if (entry.notifyOnDate < nowDate) return true;
      if (entry.notifyOnDate > nowDate) return false;
      const h = Number(entry.notifyHour ?? 8);
      const m = Number(entry.notifyMinute ?? 1);
      return h * 60 + m <= nowMinutes;
    });
    const keep = pending.filter((entry) => !due.includes(entry));

    if (!due.length) return;
    const transporter = await getTransporter();
    for (const entry of due) {
      if (!isValidEmail(entry.email)) continue;
      try {
        await transporter.sendMail({
          from: SMTP_FROM,
          to: entry.email,
          subject: "Heyy, ich bin wieder online",
          text: [
            "Heyy,",
            "",
            "ich bin jetzt wieder online und kann dir persoenlich antworten.",
            "Komm gern in den Chat zurueck, ich freue mich auf dich.",
            "",
            "Bis dann!",
          ].join("\n"),
        });
      } catch {
        keep.push(entry);
      }
    }

    await savePendingNotifications(keep);
  } finally {
    notifyProcessing = false;
  }
};

const handleOfflineNotify = async (req, res) => {
  const body = await readBody(req);
  const email = String(body?.email || "").trim().toLowerCase();
  const sessionId = sanitizeSessionId(body?.sessionId);

  if (!isValidEmail(email)) {
    return json(res, 400, { error: "Ungueltige E-Mail-Adresse." });
  }

  const plan = planNextHumanOnlineMoment();
  const pending = await loadPendingNotifications();
  const exists = pending.some(
    (entry) =>
      entry.email === email &&
      entry.notifyOnDate === plan.notifyOnDate &&
      Number(entry.notifyHour ?? -1) === Number(plan.notifyHour) &&
      Number(entry.notifyMinute ?? -1) === Number(plan.notifyMinute)
  );
  if (!exists) {
    pending.push({
      email,
      sessionId,
      notifyOnDate: plan.notifyOnDate,
      notifyHour: plan.notifyHour,
      notifyMinute: plan.notifyMinute,
      requestedAt: new Date().toISOString(),
    });
    await savePendingNotifications(pending);
  }

  const hh = String(plan.notifyHour).padStart(2, "0");
  const mm = String(plan.notifyMinute).padStart(2, "0");
  return json(res, 200, { ok: true, notifyOnDate: plan.notifyOnDate, notifyTime: `${hh}:${mm}` });
};

const handleOfflineMessage = async (req, res) => {
  const body = await readBody(req);
  const sessionId = sanitizeSessionId(body?.sessionId);
  const message = String(body?.message || "").trim();
  const language = String(body?.language || "de").slice(0, 8);
  const visitorEmail = String(body?.email || "").trim().toLowerCase();

  if (!message) return json(res, 400, { error: "Nachricht fehlt." });
  await sendOfflineOwnerNotification({ sessionId, message, language, visitorEmail });
  return json(res, 200, { ok: true });
};

const handleHoroscopeCalc = async (req, res) => {
  const body = await readBody(req);
  const birthDate = parseDateInput(body?.birthDate);
  const birthTime = String(body?.birthTime || "").trim() ? parseTimeInput(body?.birthTime) : null;
  const birthPlace = String(body?.birthPlace || "").trim();
  const utcOffset = String(body?.utcOffset || "").trim();
  const utcOffsetHours = utcOffset ? parseOffsetInput(utcOffset) : null;

  if (!birthDate) return json(res, 400, { error: "Bitte gib ein gueltiges Geburtsdatum an." });
  if (String(body?.birthTime || "").trim() && !birthTime) {
    return json(res, 400, { error: "Bitte gib die Geburtszeit im Format HH:MM an." });
  }
  if (!birthPlace) return json(res, 400, { error: "Bitte gib einen Geburtsort an." });
  if (utcOffset && utcOffsetHours === null) {
    return json(res, 400, { error: "Bitte gib den UTC-Offset im Format +01:00 oder -05:00 an." });
  }

  try {
    const input = {
      birthDate,
      birthTime,
      birthPlace,
      utcOffsetHours,
    };
    const report = await computeHoroscope(input);
    if (!report.planets.length) {
      return json(res, 500, { error: "Es konnten keine Planetendaten berechnet werden." });
    }
    return json(res, 200, formatHoroscopeResponse(input, report));
  } catch (error) {
    return json(res, 500, {
      error: `Die Horoskop-Berechnung ist fehlgeschlagen (${String(error?.message || "unbekannter Fehler")}).`,
    });
  }
};


const sessionPath = (sessionId) => path.join(LOG_DIR, `${sanitizeSessionId(sessionId)}.json`);

const loadSession = async (sessionId) => {
  const file = sessionPath(sessionId);
  try {
    const raw = await fs.readFile(file, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.messages)) return parsed;
  } catch {
    // ignore
  }

  return {
    sessionId: sanitizeSessionId(sessionId),
    createdAt: new Date().toISOString(),
    questionCount: 0,
    teachingQuestionCount: 0,
    horoscopeDraft: null,
    transcriptDraft: null,
    messages: [],
  };
};

const saveSession = async (session) => {
  const file = sessionPath(session.sessionId);
  await fs.writeFile(file, JSON.stringify(session, null, 2), "utf-8");
};

const clampEmojis = (text, maxEmojis = 3) => {
  const emojiRegex = /\p{Extended_Pictographic}/u;
  let seen = 0;
  let out = "";
  for (const char of text) {
    if (emojiRegex.test(char)) {
      if (seen >= maxEmojis) continue;
      seen += 1;
    }
    out += char;
  }
  return out;
};

const stripExtraWhitespace = (text) => String(text || "").replace(/\s+/g, " ").trim();

const trimForPrompt = (text, maxLength = 260) => {
  const clean = stripExtraWhitespace(text);
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength - 1).trim()}…`;
};

const summarizeOlderMessages = (messages) => {
  const rows = (messages || [])
    .filter((msg) => msg && typeof msg.content === "string" && msg.content.trim())
    .slice(-MAX_SUMMARY_MESSAGES)
    .map((msg) => {
      const role = msg.role === "assistant" ? "LUNA" : "User";
      return `${role}: ${trimForPrompt(msg.content, 180)}`;
    });

  if (!rows.length) return "";
  return rows.join("\n");
};

const buildModelMessages = (messages) => {
  const all = Array.isArray(messages) ? messages : [];
  const recent = all.slice(-MAX_MODEL_MESSAGES);
  const older = all.slice(0, Math.max(0, all.length - recent.length));
  const modelMessages = [];

  const summary = summarizeOlderMessages(older);
  if (summary) {
    modelMessages.push({
      role: "system",
      content: `Kurzfassung frueherer Chatverlauf:\n${summary}`,
    });
  }

  modelMessages.push(
    ...recent.map((msg) => ({
      role: msg.role,
      content: String(msg.content || ""),
    }))
  );

  return modelMessages;
};

const formatClientContext = (clientContext) => {
  if (!clientContext || typeof clientContext !== "object") return "";
  const status = clientContext.visibleStatus || {};
  const parts = [];
  if (clientContext.page) parts.push(`Seite: ${trimForPrompt(clientContext.page, 40)}`);
  if (clientContext.localTime) parts.push(`Client-Zeit: ${trimForPrompt(clientContext.localTime, 60)}`);
  if (typeof status.online === "boolean") parts.push(`Sichtbarer Status online: ${status.online ? "ja" : "nein"}`);
  if (status.text) parts.push(`Status-Text: ${trimForPrompt(status.text, 120)}`);
  if (status.detail) parts.push(`Status-Detail: ${trimForPrompt(status.detail, 180)}`);
  return parts.join(" | ");
};

const extractOutputText = (data) => {
  if (typeof data?.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const parts = [];
  for (const outputItem of data?.output || []) {
    if (outputItem?.type !== "message") continue;
    for (const content of outputItem.content || []) {
      if (content?.type === "output_text" && content.text) parts.push(content.text);
    }
  }
  return parts.join("\n").trim();
};

const ASTRO_REGEX =
  /(astrolog|horoskop|sternzeichen|zeichen|aspekt|haeuser|haus|venus|mond|sonne|radix|transit|konstellation|seelenverwandt|liebe|ahnen|energie|spirit|deutung|waage|stier|loewe|wassermann|skorpion|zwilling|jungfrau|widder|fische|schuetze|steinbock|krebs)/i;
const GREETING_REGEX = /^(he+y+|hallo|hi|hello|bonjour|salut)\b/i;
const PACKAGE_REGEX =
  /(beratungspaket|paket|komplette?\s+aus(?:sch|s)reibung|ausarbeitung|datei|pdf|schriftlich|report|dokument|vollstaendige?\s+analyse)/i;
const FOLLOWUP_REGEX =
  /(rueckmeldung|rückmeldung|nochmal|follow[\s-]?up|feedback|nachfrage|nachbesprechung|weiterfuehrend|weiterführend)/i;
const TEACHING_QUESTION_REGEX =
  /(was\s+bedeutet|wie\s+deute|wie\s+liest|erklaer|erklär|haus|aspekt|planet|mondknoten|asteroid|sternzeichen|radix|horoskop|konstellation)/i;
const TRANSCRIPT_REQUEST_REGEX =
  /((chat|gespraech|gespräch|unterhaltung|verlauf|protokoll|transcript|conversation|historique).*(schick|sende|mail|email|send)|((schick|sende|mail|email|send).*(chat|gespraech|gespräch|unterhaltung|verlauf|protokoll|transcript|conversation|historique)))/i;

const isAstrologyMessage = (text) => ASTRO_REGEX.test(String(text || ""));
const isGreetingMessage = (text) => GREETING_REGEX.test(String(text || "").trim());
const wantsPackage = (text) => PACKAGE_REGEX.test(String(text || ""));
const wantsFollowup = (text) => FOLLOWUP_REGEX.test(String(text || ""));
const isTeachingQuestion = (text) => TEACHING_QUESTION_REGEX.test(String(text || ""));
const wantsTranscript = (text) => TRANSCRIPT_REQUEST_REGEX.test(String(text || ""));

const HOROSCOPE_REQUEST_REGEX =
  /(horoskop|geburtshoroskop|radix|natal chart|birth chart).*(berechnen|rechnen|erstellen|compute|calculate|calcule|calculer)|\b(berechne|calculate|calculer)\b.*(horoskop|radix|chart)/i;
const FREE_HOROSCOPE_REGEX = HOROSCOPE_REQUEST_REGEX;
const HOROSCOPE_DATA_HINT_REGEX =
  /(geburtsdatum|datum|geburtszeit|zeit|geburtsort|ort|email|e-mail|utc|lat|lon|längengrad|breitengrad|timezone)/i;

const isHoroscopeRequest = (text) => HOROSCOPE_REQUEST_REGEX.test(String(text || ""));
const isFreeHoroscopeRequest = (text) => FREE_HOROSCOPE_REGEX.test(String(text || ""));
const hasHoroscopeDataHint = (text) => HOROSCOPE_DATA_HINT_REGEX.test(String(text || ""));

const normalizeLon = (value) => ((value % 360) + 360) % 360;
const toSign = (lon) => {
  const signs = [
    "Widder",
    "Stier",
    "Zwillinge",
    "Krebs",
    "Loewe",
    "Jungfrau",
    "Waage",
    "Skorpion",
    "Schuetze",
    "Steinbock",
    "Wassermann",
    "Fische",
  ];
  const n = normalizeLon(lon);
  const index = Math.floor(n / 30);
  const degree = n - index * 30;
  return { sign: signs[index], degree };
};

const formatDegree = (value) => `${value.toFixed(2)}°`;
const between0And360 = (v) => normalizeLon(Number(v || 0));
const smallestAngle = (a, b) => {
  const diff = Math.abs(between0And360(a) - between0And360(b));
  return diff > 180 ? 360 - diff : diff;
};

const ASPECTS = [
  { name: "Konjunktion", angle: 0, orb: 8 },
  { name: "Halbsextil", angle: 30, orb: 2.5 },
  { name: "Halbquadrat", angle: 45, orb: 2.5 },
  { name: "Sextil", angle: 60, orb: 5.5 },
  { name: "Quintil", angle: 72, orb: 2.5 },
  { name: "Quadrat", angle: 90, orb: 6 },
  { name: "Trigon", angle: 120, orb: 6 },
  { name: "Sesquiquadrat", angle: 135, orb: 2.5 },
  { name: "Biquintil", angle: 144, orb: 2.5 },
  { name: "Quinkunx", angle: 150, orb: 3.5 },
  { name: "Opposition", angle: 180, orb: 8 },
];

const parseDateInput = (raw) => {
  const v = String(raw || "").trim();
  if (!v) return null;
  let m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
  m = v.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (m) return { year: Number(m[3]), month: Number(m[2]), day: Number(m[1]) };
  m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return { year: Number(m[3]), month: Number(m[2]), day: Number(m[1]) };
  return null;
};

const parseTimeInput = (raw) => {
  const v = String(raw || "").trim();
  if (!v) return null;
  const m = v.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
};

const parseOffsetInput = (raw) => {
  const v = String(raw || "").trim();
  if (!v) return null;
  const m = v.match(/^([+-])(\d{1,2})(?::?(\d{2}))?$/);
  if (!m) return null;
  const sign = m[1] === "-" ? -1 : 1;
  const h = Number(m[2]);
  const min = Number(m[3] || "0");
  if (h > 14 || min > 59) return null;
  return sign * (h + min / 60);
};

const parseLatitude = (raw) => {
  const n = Number(String(raw || "").replace(",", "."));
  if (!Number.isFinite(n)) return null;
  if (n < -90 || n > 90) return null;
  return n;
};

const parseLongitude = (raw) => {
  const n = Number(String(raw || "").replace(",", "."));
  if (!Number.isFinite(n)) return null;
  if (n < -180 || n > 180) return null;
  return n;
};

const extractLabeled = (text, labels) => {
  const lines = String(text || "").split(/\r?\n/);
  for (const line of lines) {
    for (const label of labels) {
      const re = new RegExp(`^\\s*${label}\\s*:\\s*(.+)$`, "i");
      const m = line.match(re);
      if (m) return m[1].trim();
    }
  }
  return "";
};

const extractHoroscopeData = (text, current = {}) => {
  const out = { ...current };
  const emailMatch = String(text || "").match(/[^\s@]+@[^\s@]+\.[^\s@]+/);
  if (emailMatch) out.email = emailMatch[0].toLowerCase();

  const birthDateLabel = extractLabeled(text, ["geburtsdatum", "datum", "birth date", "date"]);
  if (birthDateLabel) {
    const parsed = parseDateInput(birthDateLabel);
    if (parsed) out.birthDate = parsed;
  } else {
    const anyDate = String(text || "").match(/(\d{1,2}[./]\d{1,2}[./]\d{4}|\d{4}-\d{1,2}-\d{1,2})/);
    if (anyDate) {
      const parsed = parseDateInput(anyDate[1]);
      if (parsed) out.birthDate = parsed;
    }
  }

  const birthTimeLabel = extractLabeled(text, ["geburtszeit", "zeit", "birth time", "time"]);
  if (birthTimeLabel) {
    const parsed = parseTimeInput(birthTimeLabel);
    if (parsed) out.birthTime = parsed;
  } else {
    const anyTime = String(text || "").match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
    if (anyTime) {
      const parsed = parseTimeInput(`${anyTime[1]}:${anyTime[2]}`);
      if (parsed) out.birthTime = parsed;
    }
  }

  const place = extractLabeled(text, ["geburtsort", "ort", "birth place", "place"]);
  if (place) out.birthPlace = place;

  const latLabel = extractLabeled(text, ["lat", "latitude", "breitengrad"]);
  if (latLabel) {
    const parsed = parseLatitude(latLabel);
    if (parsed !== null) out.latitude = parsed;
  }

  const lonLabel = extractLabeled(text, ["lon", "longitude", "laengengrad", "längengrad"]);
  if (lonLabel) {
    const parsed = parseLongitude(lonLabel);
    if (parsed !== null) out.longitude = parsed;
  }

  const offsetLabel = extractLabeled(text, ["utc", "utc offset", "offset", "timezone"]);
  if (offsetLabel) {
    const parsed = parseOffsetInput(offsetLabel.replace(/\s+/g, ""));
    if (parsed !== null) out.utcOffsetHours = parsed;
  }

  return out;
};

const getHoroscopeMissingFields = (data = {}) => {
  const missing = [];
  if (!data.email || !isValidEmail(data.email)) missing.push("email");
  if (!data.birthDate) missing.push("birthDate");
  if (!data.birthPlace) missing.push("birthPlace");
  return missing;
};

const geocodePlace = async (place) => {
  const q = String(place || "").trim();
  if (!q) return null;
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "LUNA-Horoscope/1.0",
        Accept: "application/json",
      },
    });
    if (!response.ok) return null;
    const rows = await response.json();
    if (!Array.isArray(rows) || !rows.length) return null;
    const row = rows[0];
    const lat = parseLatitude(row?.lat);
    const lon = parseLongitude(row?.lon);
    if (lat === null || lon === null) return null;
    return { latitude: lat, longitude: lon, label: row.display_name || q };
  } catch {
    return null;
  }
};

const swissephCall = (fn, ...args) =>
  new Promise((resolve, reject) => {
    fn(...args, (result) => {
      if (result && typeof result === "object" && result.error) {
        reject(new Error(result.error));
        return;
      }
      resolve(result);
    });
  });

const PLANETS = [
  { id: swisseph.SE_SUN, key: "sun", name: "Sonne" },
  { id: swisseph.SE_MOON, key: "moon", name: "Mond" },
  { id: swisseph.SE_MERCURY, key: "mercury", name: "Merkur" },
  { id: swisseph.SE_VENUS, key: "venus", name: "Venus" },
  { id: swisseph.SE_MARS, key: "mars", name: "Mars" },
  { id: swisseph.SE_JUPITER, key: "jupiter", name: "Jupiter" },
  { id: swisseph.SE_SATURN, key: "saturn", name: "Saturn" },
  { id: swisseph.SE_URANUS, key: "uranus", name: "Uranus" },
  { id: swisseph.SE_NEPTUNE, key: "neptune", name: "Neptun" },
  { id: swisseph.SE_PLUTO, key: "pluto", name: "Pluto" },
  { id: swisseph.SE_TRUE_NODE, key: "trueNode", name: "Mondknoten (wahr)" },
  { id: swisseph.SE_CHIRON, key: "chiron", name: "Chiron" },
  { id: swisseph.SE_CERES, key: "ceres", name: "Ceres" },
  { id: swisseph.SE_PALLAS, key: "pallas", name: "Pallas" },
  { id: swisseph.SE_JUNO, key: "juno", name: "Juno" },
  { id: swisseph.SE_VESTA, key: "vesta", name: "Vesta" },
];

const calcAspects = (planetRows) => {
  const aspects = [];
  for (let i = 0; i < planetRows.length; i += 1) {
    for (let j = i + 1; j < planetRows.length; j += 1) {
      const a = planetRows[i];
      const b = planetRows[j];
      const angle = smallestAngle(a.longitude, b.longitude);
      let best = null;
      for (const asp of ASPECTS) {
        const delta = Math.abs(angle - asp.angle);
        if (delta <= asp.orb) {
          if (!best || delta < best.orbDelta) {
            best = { ...asp, orbDelta: delta };
          }
        }
      }
      if (best) {
        aspects.push({
          between: `${a.name} - ${b.name}`,
          aspect: best.name,
          exactAngle: best.angle,
          distance: angle,
          orb: Math.abs(angle - best.angle),
        });
      }
    }
  }
  return aspects.sort((x, y) => x.orb - y.orb);
};

const computeHoroscope = async (data) => {
  const flags = swisseph.SEFLG_SPEED | swisseph.SEFLG_SWIEPH;
  swisseph.swe_set_ephe_path(path.join(ROOT, "ephe"));

  const date = data.birthDate;
  const time = data.birthTime || { hour: 12, minute: 0 };
  const hasBirthTime = Boolean(data.birthTime);
  const offsetHours =
    Number.isFinite(data.utcOffsetHours) ? data.utcOffsetHours : parseOffsetInput(HOROSCOPE_DEFAULT_TIMEZONE_OFFSET) ?? 0;
  const localHour = time.hour + time.minute / 60;
  const utHour = localHour - offsetHours;

  const jd = await swissephCall(
    swisseph.swe_julday,
    date.year,
    date.month,
    date.day,
    utHour,
    swisseph.SE_GREG_CAL
  );

  const planetRows = [];
  for (const planet of PLANETS) {
    try {
      const body = await swissephCall(swisseph.swe_calc_ut, jd, planet.id, flags);
      const position = toSign(body.longitude);
      planetRows.push({
        ...planet,
        longitude: body.longitude,
        sign: position.sign,
        degreeInSign: position.degree,
        speed: body.longitudeSpeed,
      });
    } catch {
      // ignore single planet failures to keep report robust
    }
  }

  let coordinates = null;
  if (Number.isFinite(data.latitude) && Number.isFinite(data.longitude)) {
    coordinates = { latitude: data.latitude, longitude: data.longitude, source: "user" };
  } else {
    const geocoded = await geocodePlace(data.birthPlace);
    if (geocoded) {
      coordinates = {
        latitude: geocoded.latitude,
        longitude: geocoded.longitude,
        source: "geocoded",
        label: geocoded.label,
      };
    }
  }

  let houses = null;
  if (hasBirthTime && coordinates) {
    try {
      houses = await swissephCall(swisseph.swe_houses, jd, coordinates.latitude, coordinates.longitude, "P");
    } catch {
      houses = null;
    }
  }

  const aspects = calcAspects(planetRows);
  return {
    jd,
    hasBirthTime,
    usedOffsetHours: offsetHours,
    coordinates,
    planets: planetRows,
    aspects,
    houses,
  };
};

const toDisplayDate = (date) =>
  `${String(date.day).padStart(2, "0")}.${String(date.month).padStart(2, "0")}.${date.year}`;

const toDisplayTime = (time) =>
  time ? `${String(time.hour).padStart(2, "0")}:${String(time.minute).padStart(2, "0")}` : "keine Geburtszeit";

const toDisplayOffset = (offsetHours) => {
  const sign = offsetHours >= 0 ? "+" : "-";
  const abs = Math.abs(offsetHours);
  const hours = Math.floor(abs);
  const minutes = Math.round((abs - hours) * 60);
  return `${sign}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const formatHoroscopeResponse = (data, report) => {
  const primary = [];
  const findPlanet = (key) => report.planets.find((planet) => planet.key === key);
  const sun = findPlanet("sun");
  const moon = findPlanet("moon");
  const venus = findPlanet("venus");

  if (sun) primary.push(`Sonne in ${sun.sign}`);
  if (moon) primary.push(`Mond in ${moon.sign}`);
  if (venus) primary.push(`Venus in ${venus.sign}`);

  const houses = [];
  if (report.houses && Array.isArray(report.houses.house)) {
    report.houses.house.forEach((houseLon, idx) => {
      const pos = toSign(houseLon);
      houses.push({
        title: `Haus ${idx + 1}`,
        position: `${formatDegree(pos.degree)} ${pos.sign}`,
      });
    });
    houses.push({
      title: "AC",
      position: `${formatDegree(toSign(report.houses.ascendant).degree)} ${toSign(report.houses.ascendant).sign}`,
    });
    houses.push({
      title: "MC",
      position: `${formatDegree(toSign(report.houses.mc).degree)} ${toSign(report.houses.mc).sign}`,
    });
  }

  return {
    birthDateDisplay: toDisplayDate(data.birthDate),
    birthPlaceResolved: report.coordinates?.label || data.birthPlace,
    usedTimeText: toDisplayTime(data.birthTime),
    usedOffsetText: toDisplayOffset(report.usedOffsetHours),
    housesAvailable: Boolean(report.houses && Array.isArray(report.houses.house)),
    summary: primary.length
      ? `${primary.join(" | ")}. ${
          report.houses && Array.isArray(report.houses.house)
            ? "Die Haeuser wurden mit berechnet."
            : "Ohne Geburtszeit bleibt die Haeuser-Deutung ausgeblendet."
        }`
      : "Die Berechnung ist abgeschlossen.",
    planets: report.planets.map((planet) => ({
      key: planet.key,
      title: planet.name,
      sign: planet.sign,
      position: `${formatDegree(planet.degreeInSign)} ${planet.sign}`,
      absoluteDegree: formatDegree(normalizeLon(planet.longitude)),
    })),
    aspects: report.aspects.slice(0, 12).map((aspect) => ({
      title: aspect.aspect,
      between: aspect.between,
      orb: `${aspect.orb.toFixed(2)}°`,
    })),
    houses,
  };
};

const formatHoroscopeMail = (data, report) => {
  const lines = [];
  const date = data.birthDate;
  const timeLine = data.birthTime
    ? `${String(data.birthTime.hour).padStart(2, "0")}:${String(data.birthTime.minute).padStart(2, "0")}`
    : "keine Geburtszeit angegeben";

  lines.push("Heyy,");
  lines.push("");
  lines.push("so schoen, dass du mir deine Daten geschickt hast.");
  lines.push("Hier ist dein kostenloses Horoskop von mir fuer dich (tropisch, Placidus, Swiss Ephemeris).");
  lines.push("Ich habe alles so aufbereitet, dass du es ruhig lesen und direkt fuer dich nutzen kannst.");
  lines.push("");
  lines.push("GRUNDDATEN");
  lines.push(`Geburtsdatum: ${String(date.day).padStart(2, "0")}.${String(date.month).padStart(2, "0")}.${date.year}`);
  lines.push(`Geburtszeit: ${timeLine}`);
  lines.push(`Geburtsort: ${data.birthPlace}`);
  lines.push(`UTC-Offset verwendet: ${report.usedOffsetHours >= 0 ? "+" : ""}${report.usedOffsetHours.toFixed(2)}h`);
  if (report.coordinates) {
    lines.push(
      `Koordinaten: ${report.coordinates.latitude.toFixed(5)}, ${report.coordinates.longitude.toFixed(5)} (${report.coordinates.source})`
    );
  } else {
    lines.push("Koordinaten: nicht eindeutig verfuegbar");
  }
  lines.push("");
  lines.push("PLANETEN UND PUNKTE");
  report.planets.forEach((p) => {
    lines.push(`${p.name}: ${formatDegree(p.degreeInSign)} ${p.sign} (${formatDegree(normalizeLon(p.longitude))})`);
  });
  lines.push("");
  lines.push("ASPEKTE");
  if (!report.aspects.length) {
    lines.push("Keine Aspekte gefunden.");
  } else {
    report.aspects.slice(0, 80).forEach((a) => {
      lines.push(`${a.between}: ${a.aspect} (Orb ${a.orb.toFixed(2)}°)`);
    });
  }
  lines.push("");
  lines.push("HAEUSER (PLACIDUS)");
  if (report.houses && Array.isArray(report.houses.house)) {
    report.houses.house.forEach((h, idx) => {
      const pos = toSign(h);
      lines.push(`Haus ${idx + 1}: ${formatDegree(pos.degree)} ${pos.sign}`);
    });
    lines.push(`AC: ${formatDegree(toSign(report.houses.ascendant).degree)} ${toSign(report.houses.ascendant).sign}`);
    lines.push(`MC: ${formatDegree(toSign(report.houses.mc).degree)} ${toSign(report.houses.mc).sign}`);
  } else {
    lines.push("Keine Haeuser berechnet (fehlende Geburtszeit oder unklare Ortskoordinaten).");
  }
  lines.push("");
  lines.push(
    "Hinweis: Ohne exakte Geburtszeit/UTC-Offset sind Mond, Haeuserspitzen, AC/MC und aspektbezogene Details weniger praezise."
  );
  lines.push("");
  lines.push("Wenn du magst, gehen wir einzelne Punkte danach gemeinsam Schritt fuer Schritt durch.");
  lines.push("Schreib mir einfach im Chat, ich bin fuer dich da.");
  lines.push("");
  lines.push("Bis dann!");
  return lines.join("\n");
};

const sendHoroscopeMail = async (toEmail, textBody) => {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error("SMTP-Konfiguration fehlt.");
  }
  const transporter = await getTransporter();
  await transporter.sendMail({
    from: SMTP_FROM,
    to: toEmail,
    subject: HOROSCOPE_EMAIL_SUBJECT,
    text: textBody,
  });
};

const formatChatTranscriptMail = (session) => {
  const lines = [];
  lines.push("Heyy,");
  lines.push("");
  lines.push("wie versprochen schicke ich dir hier euren Chatverlauf.");
  lines.push("");
  lines.push(`Session: ${session.sessionId}`);
  lines.push(`Stand: ${formatBerlinNow()}`);
  lines.push("");
  lines.push("CHATVERLAUF");
  for (const msg of session.messages || []) {
    const role = msg.role === "assistant" ? "LUNA" : "Du";
    const text = String(msg.content || "").trim();
    if (!text) continue;
    lines.push(`${role}: ${text}`);
  }
  lines.push("");
  lines.push("Wenn du willst, gehe ich einzelne Punkte nochmal in Ruhe mit dir durch.");
  lines.push("");
  lines.push("Bis dann!");
  return lines.join("\n");
};

const sendChatTranscriptEmail = async (toEmail, session) => {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error("SMTP-Konfiguration fehlt.");
  }
  const transporter = await getTransporter();
  await transporter.sendMail({
    from: SMTP_FROM,
    to: toEmail,
    subject: CHAT_TRANSCRIPT_SUBJECT,
    text: formatChatTranscriptMail(session),
  });
};

const buildHoroscopeRequestPrompt = (missing = []) => {
  const need = missing.map((m) => {
    if (m === "email") return "E-Mail";
    if (m === "birthDate") return "Geburtsdatum";
    if (m === "birthPlace") return "Geburtsort";
    return m;
  });
  const missingHint = need.length ? `Mir fehlen noch: ${need.join(", ")}.` : "Schick mir jetzt einfach deine Daten.";

  return [
    "Heyy, ich berechne dir das Horoskop kostenlos mit Swiss Ephemeris (tropisch, Placidus, alle Aspekte).",
    missingHint,
    "Bitte sende es so:",
    "Geburtsdatum: TT.MM.JJJJ",
    "Geburtszeit: HH:MM (optional, ohne Zeit keine Haeuser)",
    "Geburtsort: Stadt, Land",
    "UTC: +01:00 (optional, sonst nutze ich Standard-Offset)",
    "E-Mail: deine@mail.de",
    "Bis dann!",
  ].join(" ");
};

const buildSystemPrompt = (language, clientContext) => {
  const now = getBerlinDateParts();
  const holiday = getHolidayNameBerlin(now);
  const dayPart = now.hour < 11 ? "Morgen" : now.hour < 17 ? "Nachmittag" : "Abend";
  const temporalContext = holiday
    ? `Aktuelle Berlin-Zeit: ${formatBerlinNow()} | Tageszeit: ${dayPart} | Feiertag: ${holiday}`
    : `Aktuelle Berlin-Zeit: ${formatBerlinNow()} | Tageszeit: ${dayPart}`;
  const clientContextText = formatClientContext(clientContext);

  return `
Du bist LUNA, eine KI-Assistentin im persoenlichen Stil von Joyce (Lunarisma).
Wichtig:
- Sei warm, spirituell, konkret und astrologisch fokussiert.
- Du bist eine astrologische Beraterin mit tiefem Wissen ueber Sternzeichen, Haeuser, Planeten, Aspekte, Mondknoten und Asteroiden.
- Erklaere Astrologie verstaendlich, intuitiv und persoenlich, sodass es wie eine echte Einzelberatung wirkt.
- Antworte primaer zu Liebe, Seelenverwandtschaft, Zukunft, Familie, Terminen und Urlaub.
- Fuehre aktiv Smalltalk und stelle ruecksichtsvolle Rueckfragen, damit sich Nutzer gesehen fuehlen.
- Du darfst gelegentlich natuerliche Denkmarker nutzen, z. B. "ehhh...", "oh emm...", "ah verstehe" (sparsam und passend, nicht in jeder Antwort).
- Wenn fuer eine praezise Deutung Daten fehlen, frage aktiv nach Geburtsdatum, Geburtszeit und Geburtsort.
- Wenn Geburtszeit fehlt, erklaere kurz, welche Deutungen trotzdem moeglich sind und welche ungenauer werden.
- Wenn User nach Horoskop-Berechnung fragen, verweise auf dieses Video: ${YOUTUBE_HOROSCOPE_URL}
- Wenn User nach Unterricht/Produkten fragen, weise auf astrologischen Unterricht und weitere Produkte hin.
- Verweise bei tieferen Themen auf YouTube-Videos: ${YOUTUBE_GENERAL_URL}
- Verwende pro Antwort 0 bis 3 Emojis.
- Erfinde keine Fakten ueber reale Personen.
- Erfinde niemals private Fakten ueber Joyce/LUNA.
- Wenn nach privaten/personenbezogenen Details gefragt wird, antworte weich und ehrlich sinngemaess so:
  "Wir koennen gern auf Instagram schreiben (${INSTAGRAM_URL}). Hier bist du anonym, deshalb teile ich hier keine privaten Details. Auf Instagram kann ich dir genauer antworten. Wie klingt das?"
- Wenn User fragt, was du gerade machst, orientiere dich am sichtbaren Status im Chatfenster. Falls kein Status bekannt ist, antworte locker und allgemein ohne konkrete erfundene Details.
- Sei transparent bei Identitaetsfragen: Wenn jemand fragt, ob du eine KI bist, antworte ehrlich, dass du LUNA bist - eine digitale Assistentin im Stil von Joyce.
- Verwende bei Begruessungen passende Tageszeit-Formulierungen (guten Morgen / guten Nachmittag / guten Abend) auf Basis der aktuellen Berlin-Zeit.
- Wenn heute ein Feiertag ist, gratuliere bei passender Gelegenheit kurz und herzlich.
- Nutze den aktuellen sichtbaren Frontend-Status nur dann, wenn er im Kontext mitgegeben wurde. Wenn er fehlt, erfinde keinen konkreten Live-Status.
- Wichtig zur Bezahlung: Nur astrologische Beratung ist kostenpflichtig (5 EUR pro astrologischer Antwort). Smalltalk ist kostenfrei. Die reine Horoskop-Berechnung (Swiss Ephemeris) ist kostenfrei.
- Wenn jemand ein Beratungspaket mit kompletter schriftlicher Ausarbeitung (Datei/PDF) moechte: Preis ist 30 EUR.
- Fuer Beratungspaket und fuer spaetere Rueckmeldung muss die Person ihre E-Mail-Adresse angeben; frage diese aktiv und freundlich ab.
- Halte Antworten zwischen 3 und 9 Saetzen.
- Antworte in der Sprache des Users. Priorisierte Sprache: ${language}.
- Halte den Ton natuerlich, ruhig und konkret. Keine ueberladenen Floskeln, keine Wiederholung derselben Preis- oder Kanalhinweise, wenn sie gerade schon genannt wurden.
- Nutze den folgenden Video-Katalog aktiv fuer Empfehlungen. Wenn ein Thema passt, nenne exakt den Titel + Suchlink.
- Wenn User nach "Link" fragt und kein fixer Videolink bekannt ist, gib den Suchlink und den Kanal an: ${YOUTUBE_CHANNEL_URL}
- Bei Fragen zu Horoskop berechnen, priorisiere Grundlagen-Videos (Sonne/Mond, Aspekte, Venus-Haeuser) und verweise auf ${YOUTUBE_HOROSCOPE_URL}
- Nutze dieses Persona-Profil aktiv fuer Tonalitaet und Wortwahl:
${PERSONA_PROFILE}

Zeitkontext:
${temporalContext}

Sichtbarer Frontend-Kontext:
${clientContextText || "Kein Frontend-Kontext uebermittelt."}

Video-Katalog:
${catalogLines}
`;
};

const callOpenAI = async (messages, language, clientContext) => {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY fehlt. Bitte in .env setzen.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);
  const input = [
    {
      role: "system",
      content: [{ type: "input_text", text: buildSystemPrompt(language, clientContext) }],
    },
    ...buildModelMessages(messages).map((msg) => ({
      role: msg.role,
      content: [{ type: "input_text", text: msg.content }],
    })),
  ];

  let response;
  let data;
  try {
    response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        input,
        temperature: 0.85,
      }),
      signal: controller.signal,
    });

    data = await response.json();
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(`OpenAI-Timeout nach ${OPENAI_TIMEOUT_MS}ms.`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const details = data?.error?.message || "OpenAI request failed";
    throw new Error(details);
  }

  const text = extractOutputText(data);
  if (!text) {
    throw new Error("Leere Antwort von OpenAI.");
  }
  return clampEmojis(text, 3);
};


const handleChat = async (req, res) => {
  const body = await readBody(req);
  const message = String(body?.message || "").trim();
  const language = String(body?.language || "de").slice(0, 8);
  const clientContext = body?.clientContext && typeof body.clientContext === "object" ? body.clientContext : null;

  if (!message) return json(res, 400, { error: "Nachricht fehlt." });
  if (message.length > 2000) return json(res, 400, { error: "Nachricht ist zu lang." });

  const sessionId = sanitizeSessionId(body?.sessionId);
  const session = await loadSession(sessionId);

  session.questionCount += 1;
  session.teachingQuestionCount = Number(session.teachingQuestionCount || 0);
  if (isTeachingQuestion(message)) {
    session.teachingQuestionCount += 1;
  }
  session.messages.push({ role: "user", content: message, at: new Date().toISOString() });

  if (session.questionCount === 1) {
    await sendFirstMessageEmail({
      sessionId: session.sessionId,
      message,
      language,
    });
  }

  const transcriptAsked = wantsTranscript(message);
  const inTranscriptFlow = Boolean(session.transcriptDraft?.active);
  if (transcriptAsked && !inTranscriptFlow) {
    session.transcriptDraft = { active: true, requestedAt: new Date().toISOString() };
  }
  if (session.transcriptDraft?.active) {
    const emailMatch = String(message || "").match(/[^\s@]+@[^\s@]+\.[^\s@]+/);
    const transcriptEmail = emailMatch ? emailMatch[0].toLowerCase() : "";

    if (!isValidEmail(transcriptEmail)) {
      const askEmailReply =
        "Heyy, klar kann ich dir den Chatverlauf schicken. Schreib mir bitte kurz deine E-Mail-Adresse, dann sende ich ihn dir direkt rueber. Bis dann!";
      session.messages.push({ role: "assistant", content: askEmailReply, at: new Date().toISOString() });
      await saveSession(session);
      return json(res, 200, {
        sessionId: session.sessionId,
        reply: askEmailReply,
      });
    }

    try {
      await sendChatTranscriptEmail(transcriptEmail, session);
      const sentReply =
        "Heyy, perfekt. Ich habe dir den Chatverlauf gerade per E-Mail geschickt. Wenn du willst, fasse ich dir zusaetzlich die wichtigsten Punkte auch direkt hier zusammen. Bis dann!";
      session.transcriptDraft = null;
      session.messages.push({ role: "assistant", content: sentReply, at: new Date().toISOString() });
      await saveSession(session);
      return json(res, 200, {
        sessionId: session.sessionId,
        reply: sentReply,
      });
    } catch (error) {
      const reason = String(error?.message || "Unbekannter Fehler");
      console.error("Transcript-Mailversand fehlgeschlagen:", {
        sessionId: session.sessionId,
        email: transcriptEmail,
        reason,
      });

      const errReply = /SMTP-Konfiguration fehlt/i.test(reason)
        ? "Heyy, ich konnte den Verlauf gerade nicht senden, weil der Mailversand technisch noch nicht voll eingerichtet ist. Ich richte das gleich sauber ein und dann klappt es. Bis dann!"
        : "Heyy, ich konnte den Verlauf gerade nicht senden. Schick mir die E-Mail bitte nochmal, dann versuche ich es direkt erneut. Bis dann!";
      session.messages.push({ role: "assistant", content: errReply, at: new Date().toISOString() });
      await saveSession(session);
      return json(res, 200, {
        sessionId: session.sessionId,
        reply: errReply,
      });
    }
  }

  const startedHoroscope = isHoroscopeRequest(message);
  const inHoroscopeFlow = Boolean(session.horoscopeDraft?.active);
  const mayContainHoroscopeData = hasHoroscopeDataHint(message) || inHoroscopeFlow || startedHoroscope;

  if (startedHoroscope && !session.horoscopeDraft?.active) {
    session.horoscopeDraft = {
      active: true,
      createdAt: new Date().toISOString(),
      data: {},
    };
  }

  if (mayContainHoroscopeData && session.horoscopeDraft?.active) {
    session.horoscopeDraft.data = extractHoroscopeData(message, session.horoscopeDraft.data || {});
    const missing = getHoroscopeMissingFields(session.horoscopeDraft.data);

    if (missing.length) {
      const prompt = buildHoroscopeRequestPrompt(missing);
      session.messages.push({ role: "assistant", content: prompt, at: new Date().toISOString() });
      await saveSession(session);
      return json(res, 200, {
        sessionId: session.sessionId,
        reply: prompt,
      });
    }

    try {
      const report = await computeHoroscope(session.horoscopeDraft.data);
      const mailText = formatHoroscopeMail(session.horoscopeDraft.data, report);
      await sendHoroscopeMail(session.horoscopeDraft.data.email, mailText);
      const okReply =
        "Heyy, dein kostenloses Horoskop ist fertig und wurde als reiner Text an deine E-Mail gesendet. Wenn du willst, koennen wir danach einzelne Punkte gemeinsam deuten. Bis dann!";
      session.horoscopeDraft = null;
      session.messages.push({ role: "assistant", content: okReply, at: new Date().toISOString() });
      await saveSession(session);
      return json(res, 200, {
        sessionId: session.sessionId,
        reply: okReply,
      });
    } catch (error) {
      const failReply =
        "Heyy, ich konnte dein Horoskop gerade noch nicht per Mail senden. Bitte pruefe Datum/Ort/E-Mail und sende die Angaben nochmal im gleichen Format. Bis dann!";
      session.messages.push({ role: "assistant", content: failReply, at: new Date().toISOString() });
      await saveSession(session);
      return json(res, 200, {
        sessionId: session.sessionId,
        reply: failReply,
      });
    }
  }

  let reply = "";
  try {
    reply = await callOpenAI(session.messages, language, clientContext);
  } catch (error) {
    const text = String(error?.message || "Unbekannter Fehler");
    return json(res, 500, { error: text });
  }

  const isAstro = isAstrologyMessage(message);
  const needsPackagePricing = wantsPackage(message);
  const needsEmailForFollowup = wantsFollowup(message);

  if (isAstro && !isFreeHoroscopeRequest(message)) {
    const mustMentionPrice = !/5\s?(eur|euro|€)/i.test(reply);
    if (mustMentionPrice) {
      const hint = language.startsWith("fr")
        ? "Avant de continuer: les reponses astrologiques coutent 5 EUR via PayPal. "
        : language.startsWith("en")
        ? "Before we continue: astrology answers cost EUR 5 via PayPal. "
        : "Bevor wir weitermachen: Astrologische Antworten kosten 5 EUR via PayPal. ";
      reply = `${hint}${reply}`;
    }
  } else {
    reply = reply
      .replace(/Avant de continuer:[^.?!]*[.?!]\s*/gi, "")
      .replace(/Before we continue:[^.?!]*[.?!]\s*/gi, "")
      .replace(/Bevor wir weitermachen:[^.?!]*[.?!]\s*/gi, "")
      .trim();
  }

  if (needsPackagePricing) {
    const packageHint = language.startsWith("fr")
      ? "Pour un pack de consultation complet en fichier (PDF/texte), le prix est de 30 EUR. Envoie-moi aussi ton e-mail pour la livraison. "
      : language.startsWith("en")
      ? "For a full consultation package as a file (PDF/text), the price is EUR 30. Please also share your email for delivery. "
      : "Fuer ein Beratungspaket mit kompletter Ausarbeitung als Datei (PDF/Text) kostet es 30 EUR. Bitte gib mir auch deine E-Mail fuer die Zustellung. ";
    if (!/30\s?(eur|euro|€)/i.test(reply)) {
      reply = `${packageHint}${reply}`;
    }
  }

  if (needsEmailForFollowup) {
    const followupHint = language.startsWith("fr")
      ? "Si tu veux un retour complementaire, j'ai besoin de ton e-mail pour pouvoir te repondre. "
      : language.startsWith("en")
      ? "If you want a follow-up reply, I need your email address so I can send it to you. "
      : "Wenn du nochmal Rueckmeldung moechtest, brauche ich deine E-Mail-Adresse, damit ich dir antworten kann. ";
    if (!/e-?mail/i.test(reply)) {
      reply = `${followupHint}${reply}`;
    }
  }

  if (isTeachingQuestion(message)) {
    const n = Number(session.teachingQuestionCount || 0);
    if (n >= 2 && n <= 3) {
      const teachHint = language.startsWith("fr")
        ? "Si tu veux, je donne aussi des cours d'astrologie et j'explique beaucoup sur ma chaine YouTube Lunarisma. "
        : language.startsWith("en")
        ? "If you want, I also offer astrology lessons and I explain this deeply on my YouTube channel Lunarisma. "
        : "Wenn du magst: Ich gebe auch Astrologie-Unterricht und erklaere solche Themen ausfuehrlich auf meinem YouTube-Kanal Lunarisma. ";
      if (!/(unterricht|youtube|lesson|cours)/i.test(reply)) {
        reply = `${reply} ${teachHint}`.trim();
      }
    } else if (n >= 4) {
      const videoHint = language.startsWith("fr")
        ? "Merci pour ta question, c'est super que tu la poses. Je vais aussi faire une video pour toi sur ce sujet. "
        : language.startsWith("en")
        ? "Thank you for asking this, I love that you asked. I will also make a video about it for you. "
        : "Danke fuer deine Frage, ich finde es schoen, dass du fragst. Ich werde dazu auch ein Video fuer dich machen. ";
      if (!/(video.*fuer dich machen|make a video|faire .*video)/i.test(reply)) {
        reply = `${reply} ${videoHint}`.trim();
      }
    }
  }

  if (isGreetingMessage(message) && !/^he+y+/i.test(reply)) {
    reply = `Heyy ${reply}`.trim();
  }

  if (!/Bis dann!\s*$/i.test(reply)) {
    reply = `${reply} Bis dann!`;
  }

  session.messages.push({ role: "assistant", content: reply, at: new Date().toISOString() });
  await saveSession(session);

  return json(res, 200, {
    sessionId: session.sessionId,
    reply,
  });
};


const serveStatic = async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  const pathname = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const targetPath = path.normalize(path.join(ROOT, pathname));

  if (!targetPath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const data = await fs.readFile(targetPath);
    const ext = path.extname(targetPath).toLowerCase();
    const type = mimeByExt.get(ext) || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type, ...CORS_HEADERS });
    res.end(data);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8", ...CORS_HEADERS });
    res.end("Not found");
  }
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);
    processPendingOnlineNotifications().catch(() => {});
    if (req.method === "OPTIONS") {
      res.writeHead(204, CORS_HEADERS);
      res.end();
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/luna-chat") {
      return await handleChat(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/offline-notify") {
      return await handleOfflineNotify(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/offline-message") {
      return await handleOfflineMessage(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/horoscope-calc") {
      return await handleHoroscopeCalc(req, res);
    }

    return await serveStatic(req, res);
  } catch (error) {
    return json(res, 500, { error: "Serverfehler", details: String(error?.message || error) });
  }
});

server.listen(PORT, () => {
  console.log(`LUNA server laeuft auf http://localhost:${PORT}`);
});

setInterval(() => {
  processPendingOnlineNotifications().catch(() => {});
}, 5 * 60 * 1000);
