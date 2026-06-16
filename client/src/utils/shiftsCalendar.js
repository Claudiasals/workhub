import {
  addDays,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { it, enGB } from "date-fns/locale";
import {
  SHIFT_HOURS,
  SHIFT_PERIOD_KEYS,
  SHIFT_SLOT_TIMES,
  WORKDAY_KEYS,
  getDaySlots,
} from "./shiftPeriods";

export { SHIFT_HOURS, SHIFT_SLOT_TIMES, WORKDAY_KEYS };

const DATE_TO_KEY = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export function getDateLocale(lang) {
  return lang === "en" ? enGB : it;
}

export function getDayKeyFromDate(date) {
  return DATE_TO_KEY[date.getDay()];
}

export const CALENDAR_PALETTE = [
  { bg: "#090c64", text: "#ffffff" },
  { bg: "#38bdf8", text: "#090c64" },
  { bg: "#facc15", text: "#090c64" },
];

export const SHIFT_PERIOD_COLORS = {
  early: CALENDAR_PALETTE[1],
  mid: CALENDAR_PALETTE[2],
  late: CALENDAR_PALETTE[0],
};

export const COMPANY_EVENT_KIND_COLORS = {
  meeting: CALENDAR_PALETTE[1],
  event: CALENDAR_PALETTE[2],
};

/** @deprecated use COMPANY_EVENT_KIND_COLORS */
export const COMPANY_EVENT_COLOR = CALENDAR_PALETTE[0];

const MEETING_TITLE_PATTERN =
  /\b(riunion|briefing|meeting|stand[\s-]?up|sync|colloquio|allineamento)\b/i;

export function resolveCompanyEventKind({ title = "", description = "", kind } = {}) {
  if (kind === "meeting" || kind === "event") return kind;

  const tipoMatch = String(description).match(/^Tipo:\s*(riunione|evento)/im);
  if (tipoMatch) {
    return tipoMatch[1].toLowerCase() === "riunione" ? "meeting" : "event";
  }

  if (MEETING_TITLE_PATTERN.test(title)) return "meeting";

  return "event";
}

export function getShiftPeriodStyle(period) {
  const { bg, text } = SHIFT_PERIOD_COLORS[period] || SHIFT_PERIOD_COLORS.early;
  return { backgroundColor: bg, color: text };
}

export function getCompanyEventStyle(kind = "event") {
  const { bg, text } =
    COMPANY_EVENT_KIND_COLORS[kind] || COMPANY_EVENT_KIND_COLORS.event;
  return { backgroundColor: bg, color: text };
}

export function getVisibleRange(date, view, lang) {
  const locale = getDateLocale(lang);
  if (view === "month") {
    return {
      start: startOfWeek(startOfMonth(date), { locale, weekStartsOn: 1 }),
      end: endOfWeek(endOfMonth(date), { locale, weekStartsOn: 1 }),
    };
  }
  if (view === "week") {
    return {
      start: startOfWeek(date, { locale, weekStartsOn: 1 }),
      end: endOfWeek(date, { locale, weekStartsOn: 1 }),
    };
  }
  return { start: startOfDay(date), end: endOfDay(date) };
}

export function getWorkplaceId(user) {
  if (!user?.workplace) return null;
  return typeof user.workplace === "string"
    ? user.workplace
    : user.workplace._id || user.workplace.id || null;
}

export function filterShiftsByWorkplace(shifts = [], workplaceId) {
  if (!workplaceId) return shifts;

  return shifts.filter((shiftDoc) => {
    const embedded = shiftDoc.user;
    if (!embedded || typeof embedded !== "object") return false;

    const wp =
      typeof embedded.workplace === "string"
        ? embedded.workplace
        : embedded.workplace?._id || embedded.workplace?.id;

    if (!wp) return true;
    return String(wp) === String(workplaceId);
  });
}

export function buildShiftCalendarEvents({
  rangeStart,
  rangeEnd,
  shifts = [],
  users = [],
  scope = "workplace",
  userShifts = null,
  authUser = null,
}) {
  const events = [];

  const resolvePerson = (shiftDoc) => {
    const embedded = shiftDoc.user;
    if (embedded && typeof embedded === "object" && embedded.firstName) {
      return {
        id: embedded._id,
        name: `${embedded.firstName} ${embedded.lastName}`,
        department: embedded.department,
      };
    }

    const userId =
      typeof embedded === "string" ? embedded : embedded?._id;
    if (!userId) return null;

    const user = users.find((u) => String(u._id) === String(userId));
    if (!user) return null;

    return {
      id: userId,
      name: `${user.firstName} ${user.lastName}`,
      department: user.department,
    };
  };

  const appendDocEvents = (shiftDoc, person) => {
    let cursor = startOfDay(new Date(rangeStart));
    const end = startOfDay(new Date(rangeEnd));

    while (cursor <= end) {
      const dayKey = getDayKeyFromDate(cursor);
      const slots = getDaySlots(shiftDoc.shifts?.[dayKey]);

      if (WORKDAY_KEYS.includes(dayKey)) {
        SHIFT_PERIOD_KEYS.forEach((period) => {
          if (!slots[period]) return;
          const times = SHIFT_SLOT_TIMES[period];
          const start = new Date(cursor);
          start.setHours(times.startH, 0, 0, 0);
          const endDt = new Date(cursor);
          endDt.setHours(times.endH, 0, 0, 0);

          events.push({
            id: `shift-${person.id}-${format(cursor, "yyyy-MM-dd")}-${period}`,
            title: person.name,
            start,
            end: endDt,
            isShift: true,
            period,
            department: person.department,
            personId: person.id,
          });
        });
      }

      cursor = addDays(cursor, 1);
    }
  };

  if (scope === "mine" && userShifts?.shifts) {
    const person = {
      id: authUser?._id || authUser?.id,
      name:
        `${authUser?.firstName || ""} ${authUser?.lastName || ""}`.trim() ||
        "—",
      department: authUser?.department,
    };
    appendDocEvents(userShifts, person);
    return events;
  }

  shifts.forEach((shiftDoc) => {
    const person = resolvePerson(shiftDoc);
    if (!person) return;
    appendDocEvents(shiftDoc, person);
  });

  return events;
}
