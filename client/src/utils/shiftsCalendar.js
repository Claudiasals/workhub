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

export const SHIFT_HOURS = {
  morning: "08:00-13:00",
  afternoon: "14:00-18:00",
};

export const WORKDAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

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
  morning: CALENDAR_PALETTE[1],
  afternoon: CALENDAR_PALETTE[2],
};

export const COMPANY_EVENT_COLOR = CALENDAR_PALETTE[0];

export function getShiftPeriodStyle(period) {
  const { bg, text } = SHIFT_PERIOD_COLORS[period] || SHIFT_PERIOD_COLORS.morning;
  return { backgroundColor: bg, color: text };
}

export function getCompanyEventStyle() {
  return {
    backgroundColor: COMPANY_EVENT_COLOR.bg,
    color: COMPANY_EVENT_COLOR.text,
  };
}

export const SHIFT_SLOT_TIMES = {
  morning: { startH: 8, endH: 13 },
  afternoon: { startH: 14, endH: 18 },
};

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

export function buildShiftCalendarEvents({
  rangeStart,
  rangeEnd,
  shifts = [],
  users = [],
  canManage = false,
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
      const slots = shiftDoc.shifts?.[dayKey];

      if (WORKDAY_KEYS.includes(dayKey) && slots) {
        ["morning", "afternoon"].forEach((period) => {
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

  if (!canManage && userShifts?.shifts) {
    const person = {
      id: authUser?._id,
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
