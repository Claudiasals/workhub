import { startOfWeek, endOfWeek } from "date-fns";
import {
  getDateLocale,
  getDayKeyFromDate,
  SHIFT_SLOT_TIMES,
  WORKDAY_KEYS,
} from "./shiftsCalendar";

const DEMO_COMPANY_EVENTS = [
  {
    id: "demo-ev-1",
    title: "Briefing settimanale",
    dayOffset: 0,
    startHour: 9,
    endHour: 9,
    endMinute: 45,
    location: "Sala riunioni A",
    department: "Direzione",
    description: "Allineamento priorità e obiettivi della settimana.",
    audience: "Responsabili di reparto",
  },
  {
    id: "demo-ev-2",
    title: "Riunione reparto vendite",
    dayOffset: 1,
    startHour: 10,
    endHour: 11,
    location: "Sede Milano",
    department: "Vendite",
    description: "Review pipeline commerciale e forecast mensile.",
    audience: "Team vendite",
  },
  {
    id: "demo-ev-3",
    title: "Formazione sicurezza",
    dayOffset: 2,
    startHour: 14,
    endHour: 16,
    location: "Aula formazione",
    department: "HR",
    description: "Aggiornamento procedure antincendio e DPI obbligatori.",
    audience: "Tutto il personale operativo",
  },
  {
    id: "demo-ev-4",
    title: "Inventario rotativo",
    dayOffset: 3,
    startHour: 8,
    endHour: 12,
    location: "Magazzino centrale",
    department: "Magazzino",
    description: "Conteggio campionario categorie ad alta rotazione.",
    audience: "Team magazzino",
  },
  {
    id: "demo-ev-5",
    title: "Town hall aziendale",
    dayOffset: 4,
    startHour: 16,
    endHour: 17,
    location: "Tutte le sedi",
    department: "Aziendale",
    description: "Comunicazioni generali e Q&A con la direzione.",
    audience: "Tutti i dipendenti",
  },
];

const DEMO_SHIFT_ROSTER = [
  {
    id: "demo-shift-luna",
    name: "Luna Bianchi",
    department: "Vendite",
    pattern: {
      monday: { morning: true, afternoon: false },
      tuesday: { morning: true, afternoon: true },
      wednesday: { morning: true, afternoon: false },
      thursday: { morning: false, afternoon: true },
      friday: { morning: true, afternoon: true },
    },
  },
  {
    id: "demo-shift-luigi",
    name: "Luigi Verdi",
    department: "Magazzino",
    pattern: {
      monday: { morning: true, afternoon: true },
      tuesday: { morning: false, afternoon: true },
      wednesday: { morning: true, afternoon: false },
      thursday: { morning: true, afternoon: false },
      friday: { morning: false, afternoon: true },
    },
  },
  {
    id: "demo-shift-mario",
    name: "Mario Rossi",
    department: "Assistenza",
    pattern: {
      monday: { morning: false, afternoon: true },
      tuesday: { morning: true, afternoon: false },
      wednesday: { morning: false, afternoon: true },
      thursday: { morning: true, afternoon: true },
      friday: { morning: true, afternoon: false },
      saturday: { morning: true, afternoon: false },
    },
  },
];

export function isRangeOverlappingCurrentWeek(rangeStart, rangeEnd, lang) {
  const locale = getDateLocale(lang);
  const now = new Date();
  const weekStart = startOfWeek(now, { locale, weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { locale, weekStartsOn: 1 });
  return new Date(rangeStart) <= weekEnd && new Date(rangeEnd) >= weekStart;
}

export function filterEventsInRange(events, rangeStart, rangeEnd) {
  const start = new Date(rangeStart);
  const end = new Date(rangeEnd);
  return events.filter((event) => event.start <= end && event.end >= start);
}

export function buildDemoCompanyEvents(referenceDate, lang) {
  const locale = getDateLocale(lang);
  const monday = startOfWeek(referenceDate, { locale, weekStartsOn: 1 });

  return DEMO_COMPANY_EVENTS.map((ev) => {
    const start = new Date(monday);
    start.setDate(monday.getDate() + ev.dayOffset);
    start.setHours(ev.startHour, ev.startMinute || 0, 0, 0);
    const end = new Date(start);
    end.setHours(ev.endHour, ev.endMinute || 0, 0, 0);
    if (end <= start) end.setHours(ev.endHour + 1, 0, 0, 0);

    return {
      ...ev,
      start,
      end,
      isDb: false,
      isDemo: true,
      isShift: false,
    };
  });
}

export function buildDemoShiftEvents(lang) {
  const locale = getDateLocale(lang);
  const weekStart = startOfWeek(new Date(), { locale, weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { locale, weekStartsOn: 1 });
  const events = [];

  let cursor = new Date(weekStart);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(weekEnd);
  end.setHours(23, 59, 59, 999);

  while (cursor <= end) {
    const dayKey = getDayKeyFromDate(cursor);
    if (!WORKDAY_KEYS.includes(dayKey)) {
      cursor.setDate(cursor.getDate() + 1);
      continue;
    }

    DEMO_SHIFT_ROSTER.forEach((person) => {
      const slots = person.pattern[dayKey];
      if (!slots) return;

      ["morning", "afternoon"].forEach((period) => {
        if (!slots[period]) return;
        const times = SHIFT_SLOT_TIMES[period];
        const start = new Date(cursor);
        start.setHours(times.startH, 0, 0, 0);
        const endDt = new Date(cursor);
        endDt.setHours(times.endH, 0, 0, 0);

        events.push({
          id: `demo-shift-${person.id}-${dayKey}-${period}`,
          title: person.name,
          start,
          end: endDt,
          isShift: true,
          isDemo: true,
          period,
          department: person.department,
          personId: null,
        });
      });
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  return events;
}
