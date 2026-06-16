export const SHIFT_PERIOD_KEYS = ["early", "mid", "late"];

export const SHIFT_HOURS = {
  early: "07:00-13:00",
  mid: "12:00-18:00",
  late: "17:00-22:00",
};

export const SHIFT_HOURS_DISPLAY = {
  early: "07:00 - 13:00",
  mid: "12:00 - 18:00",
  late: "17:00 - 22:00",
};

export const SHIFT_SLOT_TIMES = {
  early: { startH: 7, endH: 13 },
  mid: { startH: 12, endH: 18 },
  late: { startH: 17, endH: 22 },
};

export const HOURS_PER_SHIFT_SLOT = 6;
export const WEEKLY_SHIFT_HOURS = 36;
export const WORKING_DAYS_PER_WEEK = 6;

export const WORKDAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const PERIOD_LABEL_KEYS = {
  early: "shiftPeriodEarly",
  mid: "shiftPeriodMid",
  late: "shiftPeriodLate",
};

/** Normalizza slot giornalieri (supporta legacy morning/afternoon). */
export function getDaySlots(raw = {}) {
  if (
    raw.early !== undefined ||
    raw.mid !== undefined ||
    raw.late !== undefined
  ) {
    return {
      early: Boolean(raw.early),
      mid: Boolean(raw.mid),
      late: Boolean(raw.late),
    };
  }

  const morning = Boolean(raw.morning);
  const afternoon = Boolean(raw.afternoon);

  if (morning && afternoon) {
    return { early: false, mid: true, late: false };
  }
  if (morning) {
    return { early: true, mid: false, late: false };
  }
  if (afternoon) {
    return { early: false, mid: true, late: false };
  }
  return { early: false, mid: false, late: false };
}

export function getActivePeriods(raw = {}) {
  const slots = getDaySlots(raw);
  return SHIFT_PERIOD_KEYS.filter((key) => slots[key]);
}

export function hasAnyShift(raw = {}) {
  return getActivePeriods(raw).length > 0;
}

export function countWorkingDays(shifts = {}) {
  return WORKDAY_KEYS.reduce(
    (count, dayKey) => count + (hasAnyShift(shifts[dayKey]) ? 1 : 0),
    0
  );
}

export function countWeeklyHours(shifts = {}) {
  return countWorkingDays(shifts) * HOURS_PER_SHIFT_SLOT;
}

export function getShiftPeriodLabel(period, t) {
  const key = PERIOD_LABEL_KEYS[period];
  return key ? t(key) : period;
}

export function getShiftPeriodHoursLabel(period) {
  return SHIFT_HOURS_DISPLAY[period] || "";
}
