import { getDayKeyFromDate } from "./shiftsCalendar";
import { getActivePeriods, hasAnyShift } from "./shiftPeriods";

function getShiftDocUserId(shiftDoc) {
  const embedded = shiftDoc?.user;
  if (!embedded) return null;
  if (typeof embedded === "string") return embedded;
  return embedded._id || embedded.id || null;
}

export function getEmployeeShiftStatusToday(employees = [], shiftDocs = []) {
  const todayKey = getDayKeyFromDate(new Date());
  const onShiftIds = new Set();
  const periodsByUserId = new Map();

  shiftDocs.forEach((doc) => {
    const dayShifts = doc.shifts?.[todayKey];
    if (!hasAnyShift(dayShifts)) return;

    const userId = getShiftDocUserId(doc);
    if (!userId) return;

    const id = String(userId);
    onShiftIds.add(id);
    periodsByUserId.set(id, getActivePeriods(dayShifts));
  });

  const activeToday = [];
  const inactiveToday = [];

  employees.forEach((employee) => {
    const id = String(employee._id);
    if (onShiftIds.has(id)) {
      activeToday.push({
        ...employee,
        periods: periodsByUserId.get(id) || [],
      });
    } else {
      inactiveToday.push(employee);
    }
  });

  return { todayKey, activeToday, inactiveToday };
}
