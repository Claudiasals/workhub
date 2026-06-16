export const SHIFT_PERIOD_KEYS = ["early", "mid", "late"];

export const HOURS_PER_SHIFT_SLOT = 6;
export const WEEKLY_SHIFT_HOURS = 36;

export const WORKDAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

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

export function hasAnyShift(raw = {}) {
  return SHIFT_PERIOD_KEYS.some((key) => getDaySlots(raw)[key]);
}
