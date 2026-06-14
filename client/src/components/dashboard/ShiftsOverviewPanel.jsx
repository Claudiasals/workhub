import { useMemo, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ClockIcon,
  UsersThreeIcon,
  WarningIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  GearIcon,
} from "@phosphor-icons/react";
import { useSelector, useDispatch } from "react-redux";

import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import { fetchUsersAsync } from "../../store/feature/userSlice";
import {
  fetchAllShiftsAsync,
  fetchUserShiftsAsync,
} from "../../store/feature/shiftsSlice";
import ShiftQuickManageDrawer from "./ShiftQuickManageDrawer";

const SHIFT_HOURS = {
  morning: "08:00-13:00",
  afternoon: "14:00-18:00",
};

const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const DAY_LABELS_IT = [
  "Domenica",
  "Lunedì",
  "Martedì",
  "Mercoledì",
  "Giovedì",
  "Venerdì",
  "Sabato",
];

function getTodayKey() {
  return DAY_KEYS[new Date().getDay()];
}

export function ShiftsOverviewPanel({ canManage = false }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const dispatch = useDispatch();
  const token = useSelector((s) => s.auth.token);
  const authUser = useSelector((s) => s.auth.user);
  const users = useSelector((s) => s.users.list) || [];
  const shifts = useSelector((s) => s.shifts.list) || [];
  const userShifts = useSelector((s) => s.shifts.current);
  const [manageOpen, setManageOpen] = useState(false);
  const textColor = theme === "dark" ? "text-white" : "text-[#090c64]";
  const iconColor = theme === "dark" ? "white" : "#090c64";

  useEffect(() => {
    if (!token) return;
    if (canManage) {
      dispatch(fetchUsersAsync(token));
      dispatch(fetchAllShiftsAsync({ token }));
    } else if (authUser?._id) {
      dispatch(fetchUserShiftsAsync({ userId: authUser._id, token }));
    }
  }, [dispatch, token, canManage, authUser?._id]);

  const todayKey = getTodayKey();
  const todayLabel = DAY_LABELS_IT[new Date().getDay()];

  const todayShifts = useMemo(() => {
    if (!canManage && userShifts?.shifts) {
      const slots = userShifts.shifts[todayKey];
      if (!slots) return [];
      const periods = [];
      if (slots.morning)
        periods.push({ label: t("shiftMorning"), range: SHIFT_HOURS.morning });
      if (slots.afternoon)
        periods.push({ label: t("shiftAfternoon"), range: SHIFT_HOURS.afternoon });
      return periods.map((period, i) => ({
        id: `me-${i}`,
        name: `${authUser?.firstName || ""} ${authUser?.lastName || ""}`.trim() || t("dashboardKpiStaffOnShift"),
        department: authUser?.department || t("noDepartment"),
        workplace: authUser?.workplace?.name || authUser?.workplace?.city || "—",
        ...period,
      }));
    }

    const result = [];
    shifts.forEach((shiftDoc) => {
      const userId =
        typeof shiftDoc.user === "string" ? shiftDoc.user : shiftDoc.user?._id;
      const user = users.find((u) => String(u._id) === String(userId));
      if (!user) return;

      const slots = shiftDoc.shifts?.[todayKey];
      if (!slots) return;

      const periods = [];
      if (slots.morning)
        periods.push({ label: t("shiftMorning"), range: SHIFT_HOURS.morning });
      if (slots.afternoon)
        periods.push({ label: t("shiftAfternoon"), range: SHIFT_HOURS.afternoon });

      periods.forEach((period) => {
        result.push({
          id: `${userId}-${period.label}`,
          name: `${user.firstName} ${user.lastName}`,
          department: user.department || t("noDepartment"),
          workplace: user.workplace?.name || user.workplace?.city || "—",
          ...period,
        });
      });
    });
    return result;
  }, [shifts, users, todayKey, t, canManage, userShifts, authUser]);

  const alerts = useMemo(() => {
    const list = [];
    if (!canManage) {
      if (todayShifts.length === 0) {
        list.push({ type: "info", text: t("shiftsEmployeeNoShiftToday") });
      } else {
        list.push({ type: "success", text: t("shiftsEmployeeTodayOk") });
      }
      return list;
    }

    const morning = todayShifts.filter((s) => s.range === SHIFT_HOURS.morning).length;
    const afternoon = todayShifts.filter((s) => s.range === SHIFT_HOURS.afternoon).length;

    if (morning === 0) list.push({ type: "critical", text: t("shiftAlertNoMorning") });
    if (afternoon <= 1) list.push({ type: "warning", text: t("shiftAlertLowAfternoon") });

    const byUser = new Map();
    todayShifts.forEach((s) => {
      if (!byUser.has(s.name)) byUser.set(s.name, []);
      byUser.get(s.name).push(s);
    });
    byUser.forEach((periods, name) => {
      if (periods.length >= 2) {
        list.push({ type: "warning", text: `${name} ${t("shiftAlertDoubleShift")}` });
      }
    });

    if (list.length === 0 && todayShifts.length > 0) {
      list.push({ type: "success", text: t("shiftAlertOk") });
    }
    return list;
  }, [todayShifts, t, canManage]);

  return (
    <>
      <section className={`app-surface shifts-overview p-4 min-w-0 w-full ${textColor}`}>
        <div className="dashboard-card-header flex items-center gap-3 mb-4">
          <UsersThreeIcon size={24} color={iconColor} weight="duotone" />
          <h3 className="text-sm font-bold">
            {canManage ? t("shiftsOverviewTitle") : t("shiftsMyShiftTitle")}
          </h3>
          <div className="ml-auto flex items-center gap-2">
            {canManage && (
              <button
                type="button"
                className="custom-button text-xs flex items-center gap-1"
                onClick={() => setManageOpen(true)}
              >
                <GearIcon size={14} />
                {t("shiftsManageBtn")}
              </button>
            )}
            {canManage && (
              <Link to="/personale" className="business-overview-action text-xs">
                {t("shiftsOverviewViewAll")}
                <ArrowRightIcon size={14} weight="bold" />
              </Link>
            )}
          </div>
        </div>

        <p className="text-xs opacity-70 mb-3">
          {t("shiftsOverviewToday")}: <strong>{todayLabel}</strong>
        </p>

        <div className="shifts-overview-alerts mb-4">
          {alerts.map((alert, i) => (
            <div key={i} className={`shifts-overview-alert shifts-overview-alert--${alert.type}`}>
              {alert.type === "success" ? (
                <CheckCircleIcon size={18} weight="duotone" />
              ) : (
                <WarningIcon size={18} weight="duotone" />
              )}
              <span>{alert.text}</span>
            </div>
          ))}
        </div>

        {todayShifts.length === 0 ? (
          <p className="text-sm opacity-60">{t("shiftsOverviewEmpty")}</p>
        ) : (
          <ul className="shifts-overview-list">
            {todayShifts.map((shift) => (
              <li key={shift.id} className="shifts-overview-item">
                <div className="shifts-overview-item__main">
                  <strong>{shift.name}</strong>
                  <span className="text-xs opacity-70">{shift.department}</span>
                </div>
                <div className="shifts-overview-item__meta">
                  <ClockIcon size={14} />
                  {shift.label} · {shift.range}
                </div>
                <div className="text-xs opacity-60">{shift.workplace}</div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {canManage && (
        <ShiftQuickManageDrawer open={manageOpen} onClose={() => setManageOpen(false)} />
      )}
    </>
  );
}

export default ShiftsOverviewPanel;
