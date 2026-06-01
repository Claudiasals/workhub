import { useMemo, useState, useEffect, useRef } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { it, enGB } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";

import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { useSelector, useDispatch } from "react-redux";

import { fetchUsersAsync } from "../store/feature/userSlice";
import { fetchAllShiftsAsync } from "../store/feature/shiftsSlice";
import { fetchEventsAsync } from "../store/feature/eventsSlice";
import { fetchPointsOfSalesAsync } from "../store/feature/pointOfSalesSlice";

/* Date-fns localization setup */
const locales = { it, en: enGB };

const localizer = dateFnsLocalizer({
  format,
  parse,
  getDay,
  startOfWeek: (date, culture) =>
    startOfWeek(date, { locale: locales[culture] || it, weekStartsOn: 1 }),
  locales,
});

// Returns user initials or fallback symbol
const getInitials = (firstName, lastName) => {
  if (!firstName && !lastName) return "?";
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
};

// Fixed shift time ranges
const SHIFT_HOURS = {
  morning: "08:00-13:00",
  afternoon: "14:00-18:00",
};

const DEFAULT_DEPARTMENTS = [
  "specialist reparto it",
  "cybersecurity",
  "magazziniere",
  "Capo reparto",
  "Manager",
];

const getDepartmentLabel = (department) =>
  department.toLowerCase() === "specialist reparto it"
    ? "reparto IT"
    : department;

const WEEKDAY_OFFSETS = {
  monday: 0,
  tuesday: 1,
  wednesday: 2,
  thursday: 3,
  friday: 4,
  saturday: 5,
};

const DEMO_TURNS = [
  [
    { dayOffset: 0, orari: [SHIFT_HOURS.morning] },
    { dayOffset: 1, orari: [SHIFT_HOURS.morning] },
  ],
  [
    { dayOffset: 1, orari: [SHIFT_HOURS.morning] },
    { dayOffset: 2, orari: [SHIFT_HOURS.morning] },
    { dayOffset: 4, orari: [SHIFT_HOURS.morning] },
    { dayOffset: 5, orari: [SHIFT_HOURS.morning] },
  ],
  [
    { dayOffset: 2, orari: [SHIFT_HOURS.morning] },
    { dayOffset: 3, orari: [SHIFT_HOURS.morning, SHIFT_HOURS.afternoon] },
  ],
  [
    { dayOffset: 3, orari: [SHIFT_HOURS.morning] },
    { dayOffset: 4, orari: [SHIFT_HOURS.afternoon] },
  ],
  [
    { dayOffset: 4, orari: [SHIFT_HOURS.morning] },
    { dayOffset: 5, orari: [SHIFT_HOURS.morning] },
  ],
];

const DEMO_COMPANY_EVENTS = [
  { title: "Brief reparto", dayOffset: 0, startHour: 10, endHour: 11 },
  { title: "Riunione team vendite", dayOffset: 1, startHour: 9, endHour: 10 },
  { title: "Formazione sicurezza", dayOffset: 2, startHour: 15, endHour: 17 },
  { title: "Open day clienti", dayOffset: 3, startHour: 11, endHour: 13 },
  { title: "Inventario settimanale", dayOffset: 4, startHour: 9, endHour: 10 },
  { title: "Chiusura mensile", dayOffset: 5, startHour: 16, endHour: 18 },
];

// Weekday index mapping (Monday-based)
const weekOffset = {
  Lunedì: 0,
  Martedì: 1,
  Mercoledì: 2,
  Giovedì: 3,
  Venerdì: 4,
  Sabato: 5,
};

// Custom calendar toolbar component
const CustomToolbar = ({ label, view, onView, onNavigate }) => {
  const { t } = useLanguage();

  return (
    <div className="calendar-toolbar w-full">
      <div className="flex items-center gap-2">
        <button onClick={() => onNavigate("PREV")} className="calendar-btn">
          ‹
        </button>
        <button onClick={() => onNavigate("NEXT")} className="calendar-btn">
          ›
        </button>
      </div>

      <span className="text-xl font-extrabold">{label}</span>

      <div className="flex items-center gap-2">
        {["month", "week", "day"].map((v) => (
          <button
            key={v}
            onClick={() => onView(v)}
            className={`calendar-view-btn ${view === v ? "active" : ""}`}
          >
            {v === "month"
              ? t("mese")
              : v === "week"
              ? t("settimana")
              : t("giorno")}
          </button>
        ))}
      </div>
    </div>
  );
};

const CalendarBox = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { t, lang } = useLanguage();

  const dispatch = useDispatch();
  const token = useSelector((s) => s.auth.token);
  const role = useSelector((s) => s.auth.user?.role || s.auth.role);
  const isAdmin = String(role || "").toLowerCase() === "admin";

  const users = useSelector((s) => s.users.list);
  const shifts = useSelector((s) => s.shifts.list);
  const eventsData = useSelector((s) => s.events.events);

  // UI state
  const [mode, setMode] = useState("turni");
  const [view, setView] = useState("week");
  const [expandedId, setExpandedId] = useState(null);

  const wrapperRef = useRef(null);

  // Initial data loading
  useEffect(() => {
    if (!token) return;

    if (isAdmin) {
      dispatch(fetchUsersAsync(token));
      dispatch(fetchAllShiftsAsync({ token }));
    }

    dispatch(fetchEventsAsync({ token }));
    dispatch(fetchPointsOfSalesAsync({ token }));
  }, [dispatch, isAdmin, token]);

  // Closes expanded event on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setExpandedId(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () =>
      document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Normalizes employees and attaches shifts
  const EmployeeList = useMemo(() => {
    if (!users || !shifts) return [];

    const employees = new Map();

    users.forEach((u) => {
      employees.set(u._id, {
        id: u._id,
        firstName: u.firstName,
        lastName: u.lastName,
        fullName: `${u.firstName} ${u.lastName}`,
        email: u.email,
        department: u.department || "Senza reparto",
        matricola: u.personnelNumber,
        turni: [],
      });
    });

    shifts.forEach((shiftDoc) => {
      const empId =
        typeof shiftDoc.user === "string"
          ? shiftDoc.user
          : shiftDoc.user?._id;

      const emp = employees.get(empId);
      if (!emp) return;

      Object.entries(shiftDoc.shifts || {}).forEach(([dayKey, val]) => {
        const dayOffset = WEEKDAY_OFFSETS[dayKey];
        if (dayOffset === undefined) return;

        const orari = [];
        if (val?.morning) orari.push(SHIFT_HOURS.morning);
        if (val?.afternoon) orari.push(SHIFT_HOURS.afternoon);

        if (orari.length) {
          emp.turni.push({ dayOffset, orari });
        }
      });
    });

    return [...employees.values()];
  }, [users, shifts]);

  const fallbackEmployees = useMemo(
    () =>
      DEFAULT_DEPARTMENTS.map((department, index) => ({
        id: `demo-calendar-${department}`,
        firstName: department.split(" ")[0] || "Demo",
        lastName: "",
        fullName: department,
        email: `demo-calendar-${index}@workhub.demo`,
        department,
        matricola: index + 1,
        turni: DEMO_TURNS[index % DEMO_TURNS.length],
      })),
    []
  );

  const displayedEmployees = useMemo(() => {
    const employeesWithShifts = EmployeeList.filter(
      (employee) => employee.turni.length > 0
    );
    const departmentsWithRealShifts = new Set(
      employeesWithShifts.map((employee) => employee.department)
    );
    const missingDemoDepartments = fallbackEmployees.filter(
      (employee) => !departmentsWithRealShifts.has(employee.department)
    );

    return employeesWithShifts.length > 0
      ? [...employeesWithShifts, ...missingDemoDepartments]
      : fallbackEmployees;
  }, [EmployeeList, fallbackEmployees]);

  // Department list
  const departments = useMemo(
    () => [...new Set(displayedEmployees.map((e) => e.department))],
    [displayedEmployees]
  );

  // Department color mapping
  const roleColorMap = useMemo(() => {
    const palette = [
      "#6C8AE4",
      "#5EC2E0",
      "#A88EF0",
      "#F5A97F",
      "#8DD0A6",
      "#7BB8E8",
      "#F97373",
      "#FACC15",
      "#2DD4BF",
      "#4ADE80",
    ];

    const map = {};
    departments.forEach((d, i) => {
      map[d] = palette[i % palette.length];
    });
    return map;
  }, [departments]);

  const getDepartmentColor = (d) => roleColorMap[d] || "#475569";

  // Selected departments filter
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  useEffect(() => {
    setSelectedDepartments((current) => {
      if (!departments.length) return [];

      const stillAvailable = departments.filter((dept) =>
        current.includes(dept)
      );

      return stillAvailable.length ? stillAvailable : departments;
    });
  }, [departments]);

  // Merges events in month view
  const mergeMonthly = (events) => {
    const map = new Map();
    events.forEach((ev) => {
      const key = `${ev.fullName}-${ev.start.toDateString()}`;
      if (!map.has(key)) {
        map.set(key, {
          ...ev,
          id: key,
          orariMultipli: [ev.orario],
        });
      } else {
        map.get(key).orariMultipli.push(ev.orario);
      }
    });
    return [...map.values()];
  };

  // Shift events generation
  const eventiTurni = useMemo(() => {
    if (!displayedEmployees.length) return [];

    const result = [];
    const monday = startOfWeek(new Date(), { locale: it, weekStartsOn: 1 });
    const weeks = 52;

    for (let w = -weeks; w <= weeks; w++) {
      const startWeek = new Date(monday);
      startWeek.setDate(monday.getDate() + w * 7);

      displayedEmployees.forEach((e) => {
        if (!selectedDepartments.includes(e.department)) return;

        e.turni.forEach((t) => {
          const offset = t.dayOffset ?? weekOffset[t.giorno];
          if (offset === undefined) return;

          const currentDay = new Date(startWeek);
          currentDay.setDate(startWeek.getDate() + offset);

          t.orari.forEach((range, idx) => {
            const [sh, sm] = range.split("-")[0].split(":").map(Number);
            const [eh, em] = range.split("-")[1].split(":").map(Number);

            const start = new Date(
              currentDay.getFullYear(),
              currentDay.getMonth(),
              currentDay.getDate(),
              sh,
              sm
            );

            const end = new Date(
              currentDay.getFullYear(),
              currentDay.getMonth(),
              currentDay.getDate(),
              eh,
              em
            );

            result.push({
              id: `${e.id}-${offset}-${idx}-${w}`,
              title: getInitials(e.firstName, e.lastName),
              fullName: e.fullName,
              department: e.department,
              orario: range,
              start,
              end,
              type: "shift",
              color: getDepartmentColor(e.department),
            });
          });
        });
      });
    }

    return view === "month" ? mergeMonthly(result) : result;
  }, [displayedEmployees, selectedDepartments, view]);

  // Company events mapping
  const eventiAziendali = useMemo(
    () => {
      const mappedEvents = (eventsData || []).map((ev) => {
        const start = new Date(ev.startDate);
        start.setHours(8, 0, 0, 0);

        const end = new Date(ev.endDate);
        end.setHours(18, 0, 0, 0);

        return {
          id: ev._id,
          title: ev.title,
          fullName: "Evento aziendale",
          department: "Eventi",
          orario: "08:00-18:00",
          start,
          end,
          type: "event",
          color: "#F59E0B",
        };
      });

      const monday = startOfWeek(new Date(), { locale: it, weekStartsOn: 1 });

      const demoEvents = DEMO_COMPANY_EVENTS.map((ev, index) => {
        const start = new Date(monday);
        start.setDate(monday.getDate() + ev.dayOffset);
        start.setHours(ev.startHour, 0, 0, 0);

        const end = new Date(start);
        end.setHours(ev.endHour, 0, 0, 0);

        return {
          id: `demo-company-event-${index}`,
          title: ev.title,
          fullName: "Evento aziendale",
          department: "Eventi",
          orario: `${String(ev.startHour).padStart(2, "0")}:00-${String(
            ev.endHour
          ).padStart(2, "0")}:00`,
          start,
          end,
          type: "event",
          color: "#F59E0B",
        };
      });

      return [...mappedEvents, ...demoEvents];
    },
    [eventsData]
  );

  const eventi = mode === "turni" ? eventiTurni : eventiAziendali;
  const allDepartmentsSelected =
    departments.length > 0 &&
    departments.every((dept) => selectedDepartments.includes(dept));

  const toggleAllDepartments = () => {
    setSelectedDepartments(
      allDepartmentsSelected ? [] : [...departments]
    );
  };

  // Dynamic event styling
  const eventStyleGetter = (event) => ({
    style: {
      backgroundColor: event.color,
      color: "white",
      borderRadius: "10px",
      padding: expandedId === event.id ? "10px" : "6px 10px",
      fontSize: expandedId === event.id ? "15px" : "13px",
      transform: expandedId === event.id ? "scale(1.02)" : "scale(1)",
      transition: "all .18s ease",
      zIndex: expandedId === event.id ? 10 : 1,
    },
  });

  // Custom event renderer
  const EventComponent = ({ event }) => {
    const expanded = expandedId === event.id;

    if (view === "month") {
      return (
        <div className="flex flex-col items-center select-none">
          <div
            className="calendar-event-dot"
            style={{ backgroundColor: event.color }}
            onClick={(e) => {
              e.stopPropagation();
              setExpandedId(expanded ? null : event.id);
            }}
          >
            {event.title}
          </div>

          {expanded && (
            <div className="calendar-event-month-expanded">
              <div className="italic font-bold">{event.fullName}</div>
              <div className="italic">{event.department}</div>
              {event.orariMultipli?.map((o, i) => (
                <div key={i}>{o}</div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="calendar-event">
        <div className="flex items-center gap-2">
          {event.type === "shift" && (
            <div className="calendar-event-shift-pill">
              {event.title}
            </div>
          )}

          {event.type === "event" && (
            <div className="font-semibold text-[13px] truncate">
              {event.title}
            </div>
          )}
        </div>

        {expanded && (
          <div className="calendar-event-details">
            <div className="italic font-bold truncate">
              {event.fullName}
            </div>
            <div className="italic truncate">{event.department}</div>
            {event.orario && (
              <div className="truncate">{event.orario}</div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div ref={wrapperRef} className="w-full flex flex-col">
      <div className="flex flex-nowrap items-center gap-2 px-0 mt-4 overflow-x-auto">
        {mode === "turni" && (
          <>
            {departments.map((dept) => {
              const active = selectedDepartments.includes(dept);
              const color = getDepartmentColor(dept);

              return (
                <div
                  key={dept}
                  onClick={() =>
                    setSelectedDepartments((prev) =>
                      prev.includes(dept)
                        ? prev.filter((d) => d !== dept)
                        : [...prev, dept]
                    )
                  }
                  className={`
                    dept-filter
                    ${active ? "active text-white" : "text-[#090c64] bg-white/70"}
                  `}
                  style={{ backgroundColor: active ? color : undefined }}
                >
                  <div
                    className={`
                      w-3 h-3 rounded flex items-center justify-center text-[10px] font-bold
                      ${active ? "bg-white text-black" : "border border-current"}
                    `}
                  >
                    {active ? "✓" : ""}
                  </div>

                  {getDepartmentLabel(dept)}

                  <div
                    className="w-2.5 h-2.5 rounded-xl"
                    style={{ backgroundColor: color }}
                  />
                </div>
              );
            })}

            <button
              onClick={toggleAllDepartments}
              className="custom-button text-[15px] shrink-0"
              type="button"
            >
              {allDepartmentsSelected ? t("deseleziona") : t("seleziona")}
            </button>
          </>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="calendar-select text-[15px]"
          >
            <option value="turni">{t("turni")}</option>
            <option value="eventi">{t("eventi")}</option>
          </select>
        </div>
      </div>

      <div className="w-full min-h-[700px] flex justify-center">
        <div className="calendar-rbc-wrap w-full mt-3 h-full relative">
          <Calendar
            localizer={localizer}
            events={eventi}
            view={view}
            onView={setView}
            startAccessor="start"
            endAccessor="end"
            views={["month", "week", "day"]}
            defaultView="week"
            culture={lang}
            scrollToTime={new Date(1970, 0, 1, 7, 0)}
            min={new Date(1970, 0, 1, 7, 0)}
            max={new Date(1970, 0, 1, 20, 0)}
            components={{
              event: EventComponent,
              toolbar: (props) => (
                <CustomToolbar {...props} view={view} />
              ),
            }}
            eventPropGetter={eventStyleGetter}
            onSelectEvent={(e) =>
              setExpandedId((prev) =>
                prev === e.id ? null : e.id
              )
            }
            style={{ height: 800 }}
            className={isDark ? "text-white" : "text-[#090c64]"}
          />
        </div>
      </div>
    </div>
  );
};

export default CalendarBox;
