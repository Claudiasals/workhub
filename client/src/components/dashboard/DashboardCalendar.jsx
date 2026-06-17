import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { it, enGB } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
  CalendarIcon,
  MapPinIcon,
  UsersIcon,
  ClockIcon,
} from "@phosphor-icons/react";
import { useSelector, useDispatch } from "react-redux";

import Drawer from "../Drawer";
import AppFeedbackModal from "../AppFeedbackModal";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import {
  fetchEventsAsync,
  createEventAsync,
  updateEventAsync,
  deleteEventAsync,
} from "../../store/feature/eventsSlice";
import { fetchUsersAsync } from "../../store/feature/userSlice";
import {
  fetchAllShiftsAsync,
  fetchUserShiftsAsync,
  fetchWorkplaceShiftsAsync,
} from "../../store/feature/shiftsSlice";
import { generateCommunicationRequest } from "../../api/aiApi";
import { AiBadge } from "../ai/AiInsightPanel";
import ShiftQuickManageDrawer from "./ShiftQuickManageDrawer";
import {
  buildShiftCalendarEvents,
  filterShiftsByWorkplace,
  filterShiftEventsByDepartments,
  buildDepartmentColorMap,
  getCalendarDepartmentLabel,
  getShiftEventDepartments,
  getVisibleRange,
  getWorkplaceId,
  SHIFT_HOURS,
  getShiftPeriodStyle,
  getCompanyEventStyle,
  resolveCompanyEventKind,
} from "../../utils/shiftsCalendar";
import { shiftStaggerDayLayout } from "../../utils/shiftCalendarLayout";
import { SHIFT_PERIOD_KEYS, getShiftPeriodLabel } from "../../utils/shiftPeriods";
import {
  buildDemoCompanyEvents,
  buildDemoShiftEvents,
  filterEventsInRange,
  isRangeOverlappingCurrentWeek,
} from "../../utils/calendarDemo";

const CALENDAR_MIN = new Date(1970, 1, 1, 7, 0, 0);
const CALENDAR_MAX = new Date(1970, 1, 1, 22, 0, 0);
const CALENDAR_SCROLL_TO = new Date(1970, 1, 1, 7, 0, 0);
const CALENDAR_TIME_HOURS = 15;
const CALENDAR_TIME_VIEW_SLOT_PX = 32;
const CALENDAR_TIME_VIEW_CHROME_PX = 196;
const CALENDAR_HEIGHT_MONTH = 720;

function getDashboardCalendarHeight(view) {
  if (view === "month") return CALENDAR_HEIGHT_MONTH;

  // Week & day: stessa griglia oraria compatta (7:00–22:00)
  return CALENDAR_TIME_VIEW_CHROME_PX + CALENDAR_TIME_HOURS * CALENDAR_TIME_VIEW_SLOT_PX;
}

const locales = { it, en: enGB };

const localizer = dateFnsLocalizer({
  format,
  parse,
  getDay,
  startOfWeek: (date, culture) =>
    startOfWeek(date, { locale: locales[culture] || it, weekStartsOn: 1 }),
  locales,
});

const emptyForm = () => ({
  _id: null,
  title: "",
  date: new Date().toISOString().slice(0, 10),
  startTime: "09:00",
  endTime: "10:00",
  location: "",
  department: "",
  audience: "",
  description: "",
});

function buildEventDescription(form) {
  const meta = [
    form.location && `Sede: ${form.location}`,
    form.department && `Reparto: ${form.department}`,
    form.audience && `Destinatari: ${form.audience}`,
  ]
    .filter(Boolean)
    .join("\n");
  return meta ? `${meta}\n\n${form.description}` : form.description;
}

function parseEventFields(ev) {
  const desc = ev.description || "";
  const lines = desc.split("\n");
  const meta = {
    location: "Tutte le sedi",
    department: "Aziendale",
    audience: "Team",
    kind: null,
    text: desc,
  };
  const metaLines = [];
  lines.forEach((line) => {
    if (line.startsWith("Tipo: ")) {
      const tipo = line.replace("Tipo: ", "").trim().toLowerCase();
      if (tipo === "riunione") meta.kind = "meeting";
      else if (tipo === "evento") meta.kind = "event";
    } else if (line.startsWith("Sede: ")) meta.location = line.replace("Sede: ", "");
    else if (line.startsWith("Reparto: "))
      meta.department = line.replace("Reparto: ", "");
    else if (line.startsWith("Destinatari: "))
      meta.audience = line.replace("Destinatari: ", "");
    else metaLines.push(line);
  });
  meta.text = metaLines.join("\n").trim() || desc;
  return meta;
}

const CustomToolbar = ({
  label,
  view,
  onView,
  onNavigate,
  showShiftScopeToggle = false,
  shiftScopeToggleLabel,
  onShiftScopeToggle,
}) => {
  const { t } = useLanguage();
  return (
    <div className="calendar-toolbar w-full">
      <span className="calendar-toolbar__period text-xl font-extrabold">
        {label}
      </span>

      <div className="calendar-toolbar__views">
        {["month", "week", "day"].map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onView(v)}
            className={`calendar-view-btn ${view === v ? "active" : ""}`}
          >
            {v === "month" ? t("mese") : v === "week" ? t("settimana") : t("giorno")}
          </button>
        ))}
      </div>

      <div className="calendar-toolbar__end">
        {showShiftScopeToggle && (
          <button
            type="button"
            onClick={onShiftScopeToggle}
            className="calendar-view-btn active calendar-toolbar__scope"
          >
            {shiftScopeToggleLabel}
          </button>
        )}

        <div className="calendar-toolbar__nav">
          <button type="button" onClick={() => onNavigate("PREV")} className="calendar-btn">
            ‹
          </button>
          <button type="button" onClick={() => onNavigate("NEXT")} className="calendar-btn">
            ›
          </button>
        </div>
      </div>
    </div>
  );
};

export function DashboardCalendar({ canManage = false }) {
  const { theme } = useTheme();
  const { t, lang } = useLanguage();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const token = useSelector((s) => s.auth.token);
  const authUser = useSelector((s) => s.auth.user);
  const eventsData = useSelector((s) => s.events.events);
  const users = useSelector((s) => s.users.list) || [];
  const shifts = useSelector((s) => s.shifts.list) || [];
  const workplaceShifts = useSelector((s) => s.shifts.workplaceList) || [];
  const userShifts = useSelector((s) => s.shifts.current);

  const userWorkplaceId = getWorkplaceId(authUser);

  const [mode, setMode] = useState("shifts");
  const [shiftScope, setShiftScope] = useState(canManage ? "workplace" : "mine");
  const [view, setView] = useState("week");
  const calendarHeight = useMemo(() => getDashboardCalendarHeight(view), [view]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedItem, setSelectedItem] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm());
  const [eventToDelete, setEventToDelete] = useState(null);
  const [manageOpen, setManageOpen] = useState(false);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [aiKeywords, setAiKeywords] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSource, setAiSource] = useState(null);

  const textColor = theme === "dark" ? "text-white" : "text-[#090c64]";
  const iconColor = theme === "dark" ? "white" : "#090c64";

  useEffect(() => {
    if (!token) return;
    dispatch(fetchEventsAsync({ token }));
    if (authUser?._id) {
      dispatch(fetchUserShiftsAsync({ userId: authUser._id, token }));
    }
    dispatch(fetchWorkplaceShiftsAsync({ token }));
    if (canManage) {
      dispatch(fetchUsersAsync(token));
      dispatch(fetchAllShiftsAsync({ token }));
    }
  }, [dispatch, token, canManage, authUser?._id]);

  const scopedWorkplaceShifts = useMemo(() => {
    const source = canManage ? shifts : workplaceShifts;
    return filterShiftsByWorkplace(source, userWorkplaceId);
  }, [canManage, shifts, workplaceShifts, userWorkplaceId]);

  const companyEvents = useMemo(() => {
    const { start, end } = getVisibleRange(currentDate, view, lang);

    const dbEvents = (eventsData || []).map((ev) => {
      const startDate = new Date(ev.startDate);
      const endDate = new Date(ev.endDate);
      const meta = parseEventFields(ev);
      return {
        id: ev._id,
        _id: ev._id,
        title: ev.title,
        start: startDate,
        end: endDate,
        location: meta.location,
        department: meta.department,
        description: meta.text,
        audience: meta.audience,
        eventKind: resolveCompanyEventKind({
          title: ev.title,
          description: ev.description,
          kind: meta.kind,
        }),
        isDb: true,
        isDemo: false,
        isShift: false,
      };
    });

    const inRange = filterEventsInRange(dbEvents, start, end);
    if (inRange.length > 0) return inRange;

    return buildDemoCompanyEvents(currentDate, lang);
  }, [eventsData, currentDate, view, lang]);

  const rawShiftEvents = useMemo(() => {
    const { start, end } = getVisibleRange(currentDate, view, lang);
    const realEvents = buildShiftCalendarEvents({
      rangeStart: start,
      rangeEnd: end,
      shifts: scopedWorkplaceShifts,
      users,
      scope: shiftScope,
      userShifts,
      authUser,
    });

    if (realEvents.length > 0) return realEvents;

    const hasShiftData =
      shiftScope === "mine"
        ? Boolean(userShifts?.shifts)
        : scopedWorkplaceShifts.length > 0;

    if (!hasShiftData && isRangeOverlappingCurrentWeek(start, end, lang)) {
      return buildDemoShiftEvents(lang);
    }

    return realEvents;
  }, [
    currentDate,
    view,
    lang,
    scopedWorkplaceShifts,
    users,
    shiftScope,
    userShifts,
    authUser,
  ]);

  const departments = useMemo(
    () => getShiftEventDepartments(rawShiftEvents),
    [rawShiftEvents],
  );

  const departmentColorMap = useMemo(
    () => buildDepartmentColorMap(departments),
    [departments],
  );

  useEffect(() => {
    setSelectedDepartments((current) => {
      if (!departments.length) return [];

      const stillAvailable = departments.filter((dept) => current.includes(dept));
      return stillAvailable.length ? stillAvailable : departments;
    });
  }, [departments]);

  const shiftEvents = useMemo(
    () => filterShiftEventsByDepartments(rawShiftEvents, selectedDepartments),
    [rawShiftEvents, selectedDepartments],
  );

  const allDepartmentsSelected =
    departments.length > 0 &&
    departments.every((dept) => selectedDepartments.includes(dept));

  const toggleAllDepartments = () => {
    setSelectedDepartments(allDepartmentsSelected ? [] : [...departments]);
  };

  const calendarEvents = mode === "shifts" ? shiftEvents : companyEvents;

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setSelectedItem(null);
  };

  const openCreate = () => {
    setFormData(emptyForm());
    setAiKeywords("");
    setAiSource(null);
    setFormOpen(true);
  };

  const openEditDbEvent = (event) => {
    if (!event.isDb) return;
    const meta = parseEventFields({ description: event.description });
    setFormData({
      _id: event._id,
      title: event.title,
      date: format(event.start, "yyyy-MM-dd"),
      startTime: format(event.start, "HH:mm"),
      endTime: format(event.end, "HH:mm"),
      location: event.location === "Tutte le sedi" ? "" : event.location,
      department: event.department === "Aziendale" ? "" : event.department,
      audience: event.audience === "Team" ? "" : event.audience,
      description: meta.text,
    });
    setFormOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!token || !formData.title.trim()) return;

    const start = new Date(`${formData.date}T${formData.startTime}`);
    const end = new Date(`${formData.date}T${formData.endTime}`);
    const payload = {
      title: formData.title,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      description: buildEventDescription(formData),
    };

    if (formData._id) {
      dispatch(updateEventAsync({ id: formData._id, data: payload, token }));
    } else {
      dispatch(createEventAsync({ data: payload, token }));
    }
    setFormOpen(false);
  };

  const handleGenerateAi = async () => {
    if (!token || aiKeywords.trim().length < 3) return;
    setAiLoading(true);
    try {
      const result = await generateCommunicationRequest({
        token,
        keywords: aiKeywords.trim(),
        lang,
      });
      setAiSource(result.source);
      setFormData((prev) => ({
        ...prev,
        title: result.title || prev.title,
        description: result.body || result.description || prev.description,
      }));
    } finally {
      setAiLoading(false);
    }
  };

  const confirmDelete = () => {
    if (!eventToDelete?._id || !token) return;
    dispatch(deleteEventAsync({ id: eventToDelete._id, token }));
    setEventToDelete(null);
    setSelectedItem(null);
  };

  const eventPropGetter = (event) => {
    const { backgroundColor, color } = event.isShift
      ? getShiftPeriodStyle(event.period)
      : getCompanyEventStyle(event.eventKind || "event");

    const shiftZIndex = event.isShift
      ? { early: 1, mid: 2, late: 3 }[event.period] || 1
      : undefined;

    return {
      style: {
        backgroundColor,
        color,
        borderRadius: "10px",
        border: "none",
        fontSize: "12px",
        boxSizing: "border-box",
        cursor: event.isShift ? "pointer" : undefined,
        ...(shiftZIndex != null && { zIndex: shiftZIndex }),
      },
    };
  };

  const handleSelectEvent = (event) => {
    if (event.isShift) {
      if (event.isDemo) {
        setSelectedItem(event);
        return;
      }
      if (canManage && event.personId) {
        navigate(`/personale/${event.personId}`);
        return;
      }
      if (!canManage) {
        navigate("/personale");
        return;
      }
    }
    setSelectedItem(event);
  };

  const headerTitle =
    mode === "shifts" ? t("turniSettimanali") : t("companyCalendarTitle");

  return (
    <>
      <section
        className={`app-surface company-events-calendar dashboard-calendar-card p-4 min-w-0 w-full ${textColor}`}
      >
        <div className="dashboard-card-header dashboard-calendar-header mb-3">
          <div className="dashboard-calendar-header__title-group">
            <div className="panel-header-leading panel-header-leading--single">
              <CalendarIcon size={24} color={iconColor} weight="duotone" className="shrink-0" />
              <h3 className="text-sm font-bold">{headerTitle}</h3>
            </div>
            <div className="calendar-mode-toggle">
              <button
                type="button"
                onClick={() => switchMode("shifts")}
                className={`calendar-mode-btn calendar-mode-btn--shifts${mode === "shifts" ? " is-active" : ""}`}
              >
                {t("calendarModeShifts")}
              </button>
              <button
                type="button"
                onClick={() => switchMode("events")}
                className={`calendar-mode-btn calendar-mode-btn--events${mode === "events" ? " is-active" : ""}`}
              >
                {t("calendarModeEvents")}
              </button>
            </div>
          </div>

          <div className="dashboard-calendar-header__actions">
            {mode === "events" && canManage && (
              <button type="button" onClick={openCreate} className="custom-button text-sm">
                + {t("companyEventAdd")}
              </button>
            )}
            {mode === "shifts" && canManage && (
              <button
                type="button"
                className="custom-button text-xs"
                onClick={() => setManageOpen(true)}
              >
                {t("shiftsManageBtn")}
              </button>
            )}
          </div>
        </div>

        {mode === "shifts" && (
          <div className="flex flex-nowrap items-center gap-2 mb-3 overflow-x-auto">
            {departments.map((dept) => {
              const active = selectedDepartments.includes(dept);
              const color = departmentColorMap[dept] || "#475569";

              return (
                <button
                  key={dept}
                  type="button"
                  onClick={() =>
                    setSelectedDepartments((prev) =>
                      prev.includes(dept)
                        ? prev.filter((d) => d !== dept)
                        : [...prev, dept],
                    )
                  }
                  className={`dept-filter ${active ? "active text-white" : "text-[#090c64] bg-white/70"}`}
                  style={{ backgroundColor: active ? color : undefined }}
                >
                  <span
                    className={`w-3 h-3 rounded flex items-center justify-center text-[10px] font-bold ${
                      active ? "bg-white text-black" : "border border-current"
                    }`}
                  >
                    {active ? "✓" : ""}
                  </span>
                  {getCalendarDepartmentLabel(dept)}
                  <span
                    className="w-2.5 h-2.5 rounded-xl"
                    style={{ backgroundColor: color }}
                  />
                </button>
              );
            })}

            <button
              type="button"
              onClick={toggleAllDepartments}
              className="custom-button text-[15px] shrink-0"
            >
              {allDepartmentsSelected ? t("deseleziona") : t("seleziona")}
            </button>
          </div>
        )}

        <div
          className={`company-events-calendar__body calendar-rbc-wrap calendar-rbc-wrap--${view}${mode === "shifts" ? " calendar-rbc-wrap--shifts" : ""} ${theme === "dark" ? "dark" : "light"}`}
        >
          <Calendar
            localizer={localizer}
            culture={lang === "en" ? "en" : "it"}
            events={calendarEvents}
            view={view}
            onView={setView}
            date={currentDate}
            onNavigate={setCurrentDate}
            defaultView="week"
            views={["month", "week", "day"]}
            startAccessor="start"
            endAccessor="end"
            style={{ height: calendarHeight }}
            scrollToTime={CALENDAR_SCROLL_TO}
            min={CALENDAR_MIN}
            max={CALENDAR_MAX}
            step={60}
            timeslots={1}
            dayLayoutAlgorithm={mode === "shifts" ? shiftStaggerDayLayout : "overlap"}
            eventPropGetter={eventPropGetter}
            onSelectEvent={handleSelectEvent}
            components={{
              toolbar: (toolbarProps) => (
                <CustomToolbar
                  {...toolbarProps}
                  showShiftScopeToggle={mode === "shifts"}
                  shiftScopeToggleLabel={
                    shiftScope === "mine"
                      ? t("calendarShiftScopeWorkplace")
                      : t("calendarShiftScopeMine")
                  }
                  onShiftScopeToggle={() =>
                    setShiftScope((scope) =>
                      scope === "mine" ? "workplace" : "mine"
                    )
                  }
                />
              ),
            }}
          />

          {mode === "shifts" && (
            <div className="calendar-shift-legend calendar-shift-legend--below">
              {SHIFT_PERIOD_KEYS.map((period) => (
                <span key={period} className="calendar-shift-legend__item">
                  <span
                    className={`calendar-shift-legend__dot calendar-shift-legend__dot--${period}`}
                  />
                  {getShiftPeriodLabel(period, t)} · {SHIFT_HOURS[period]}
                </span>
              ))}
            </div>
          )}

          {mode === "events" && (
            <div className="calendar-shift-legend calendar-shift-legend--below">
              <span className="calendar-shift-legend__item">
                <span className="calendar-shift-legend__dot calendar-shift-legend__dot--meeting" />
                {t("companyEventKindMeeting")}
              </span>
              <span className="calendar-shift-legend__item">
                <span
                  className="calendar-shift-legend__dot calendar-shift-legend__dot--company-event"
                />
                {t("companyEventKindEvent")}
              </span>
            </div>
          )}
        </div>
      </section>

      <Drawer
        open={Boolean(selectedItem?.isShift && selectedItem?.isDemo)}
        onClose={() => setSelectedItem(null)}
        title={selectedItem?.title || ""}
      >
        {selectedItem?.isShift && selectedItem?.isDemo && (
          <div className="company-event-drawer flex flex-col gap-3 text-sm">
            <p>
              <strong>{t("data")}:</strong> {format(selectedItem.start, "dd/MM/yyyy")} ·{" "}
              {format(selectedItem.start, "HH:mm")} – {format(selectedItem.end, "HH:mm")}
            </p>
            <p className="flex items-center gap-2">
              <ClockIcon size={16} />
              {getShiftPeriodLabel(selectedItem.period, t)} ·{" "}
              {SHIFT_HOURS[selectedItem.period]}
            </p>
            {selectedItem.department && (
              <p>
                <strong>{t("companyEventDepartment")}:</strong> {selectedItem.department}
              </p>
            )}
            <p className="text-xs opacity-60">{t("companyEventDemoHint")}</p>
          </div>
        )}
      </Drawer>

      <Drawer
        open={Boolean(selectedItem && !selectedItem.isShift)}
        onClose={() => setSelectedItem(null)}
        title={selectedItem?.title || ""}
      >
        {selectedItem && !selectedItem.isShift && (
          <div className="company-event-drawer flex flex-col gap-3 text-sm">
            <p>
              <strong>{t("data")}:</strong> {format(selectedItem.start, "dd/MM/yyyy HH:mm")} –{" "}
              {format(selectedItem.end, "HH:mm")}
            </p>
            <p className="flex items-center gap-2">
              <MapPinIcon size={16} />
              {selectedItem.location}
            </p>
            <p>
              <strong>{t("companyEventDepartment")}:</strong> {selectedItem.department}
            </p>
            <p className="flex items-center gap-2">
              <UsersIcon size={16} />
              {selectedItem.audience}
            </p>
            <p className="whitespace-pre-wrap leading-relaxed opacity-90">
              {selectedItem.description}
            </p>
            {canManage && selectedItem.isDb && (
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  className="custom-button text-sm"
                  onClick={() => {
                    openEditDbEvent(selectedItem);
                    setSelectedItem(null);
                  }}
                >
                  {t("modifica")}
                </button>
                <button
                  type="button"
                  className="custom-button-light text-sm text-red-500"
                  onClick={() => setEventToDelete(selectedItem)}
                >
                  {t("elimina")}
                </button>
              </div>
            )}
            {selectedItem.isDemo && (
              <p className="text-xs opacity-60">{t("companyEventDemoHint")}</p>
            )}
          </div>
        )}
      </Drawer>

      <Drawer
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={formData._id ? t("modificaEvento") : t("companyEventAdd")}
      >
        <form onSubmit={handleSave} className="flex flex-col gap-3">
          {canManage && !formData._id && (
            <div className="rounded-xl border border-white/30 bg-white/10 p-3 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">{t("aiCommTitle")}</span>
                <AiBadge source={aiSource} />
              </div>
              <input
                className="custom-input"
                placeholder={t("aiCommKeywordsPlaceholder")}
                value={aiKeywords}
                onChange={(e) => setAiKeywords(e.target.value)}
              />
              <button
                type="button"
                className="custom-button w-fit text-sm"
                disabled={aiLoading || aiKeywords.trim().length < 3}
                onClick={handleGenerateAi}
              >
                {aiLoading ? t("aiLoading") : t("aiCommGenerate")}
              </button>
            </div>
          )}
          <input
            className="custom-input"
            placeholder={t("titolo")}
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          <input
            type="date"
            className="custom-input"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="time"
              className="custom-input"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            />
            <input
              type="time"
              className="custom-input"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            />
          </div>
          <input
            className="custom-input"
            placeholder={t("companyEventLocation")}
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          />
          <input
            className="custom-input"
            placeholder={t("companyEventDepartment")}
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
          />
          <input
            className="custom-input"
            placeholder={t("companyEventAudience")}
            value={formData.audience}
            onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
          />
          <textarea
            className="custom-input min-h-[100px]"
            placeholder={t("descrizione")}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <div className="flex justify-end gap-2">
            <button type="button" className="custom-button-light" onClick={() => setFormOpen(false)}>
              {t("annulla")}
            </button>
            <button type="submit" className="custom-button">
              {t("salva")}
            </button>
          </div>
        </form>
      </Drawer>

      <AppFeedbackModal
        open={Boolean(eventToDelete)}
        title={t("modaleAttenzione")}
        message={
          eventToDelete ? `${t("seiSicuroEliminareEvento")} "${eventToDelete.title}"?` : ""
        }
        tone="warning"
        onClose={() => setEventToDelete(null)}
        actions={[
          {
            label: t("annulla"),
            onClick: () => setEventToDelete(null),
            className: "custom-button-light",
          },
          {
            label: t("elimina"),
            onClick: confirmDelete,
            className: "rounded-xl bg-red-600 px-4 py-2 font-bold text-white",
          },
        ]}
      />

      {canManage && (
        <ShiftQuickManageDrawer open={manageOpen} onClose={() => setManageOpen(false)} />
      )}
    </>
  );
}

export default DashboardCalendar;
