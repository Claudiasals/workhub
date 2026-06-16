import { useTheme } from "../../../context/ThemeContext";
import { useLanguage } from "../../../context/LanguageContext";
import {
  CalendarCheckIcon,
  BagIcon,
  CalendarBlankIcon,
} from "@phosphor-icons/react";
import { createElement, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import Drawer from "../../../components/Drawer";
import { fetchPointsOfSalesAsync } from "../../../store/feature/pointOfSalesSlice";
import { fetchUserShiftsAsync } from "../../../store/feature/shiftsSlice";
import {
  fetchLeaveAsync,
  createLeaveRequestAsync,
} from "../../../store/feature/userLeave";
import {
  getDaySlots,
  getShiftPeriodHoursLabel,
  SHIFT_PERIOD_KEYS,
  countWorkingDays,
  countWeeklyHours,
} from "../../../utils/shiftPeriods";

/* STATUS DOT - Small colored dot based on request status*/
const StatusDot = ({ status }) => {
  const colors = {
    approved: "bg-green-500",
    pending: "bg-yellow-500",
    denied: "bg-red-500",
  };

  return (
    <span
      className={`inline-block w-3 h-3 rounded-full ${
        colors[status] || "bg-gray-400"
      }`}
    />
  );
};

const DEMO_FERIE_REQUESTS = [
  {
    from: "2026-06-10",
    to: "2026-06-14",
    hours: 40,
    status: "approved",
  },
  {
    from: "2026-07-22",
    to: "2026-07-23",
    hours: 16,
    status: "pending",
  },
];

const DEMO_PERMESSI_REQUESTS = [
  {
    from: "2026-05-30",
    timeFrom: "09:00",
    timeTo: "11:00",
    hours: 2,
    status: "approved",
  },
  {
    from: "2026-06-06",
    timeFrom: "15:00",
    timeTo: "18:00",
    hours: 3,
    status: "pending",
  },
];

const UserEmployeePage = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const dispatch = useDispatch();

  /* REDUX STATE */
  const authUser = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);
  const selectedUser = useSelector((state) => state.users.selected);
  const profileUser =
    selectedUser?._id === authUser?._id ? selectedUser : authUser;
  const { list: pointsOfSale = [] } = useSelector((state) => state.pos || {});
  const {
    current: userShifts,
    loading: shiftsLoading,
    error: shiftsError,
  } = useSelector((state) => state.shifts || {});
  const leave = useSelector((state) => state.leave.record);
  const leaveLoading = useSelector((state) => state.leave.loading);

  /* LOCAL STATE */
  const [workplaceName, setWorkplaceName] = useState("");

  const [openFerieDrawer, setOpenFerieDrawer] = useState(false);
  const [openPermessiDrawer, setOpenPermessiDrawer] = useState(false);

  const [dal, setDal] = useState("");
  const [al, setAl] = useState("");
  const [permessoData, setPermessoData] = useState("");
  const [oraInizio, setOraInizio] = useState("08:00");
  const [oraFine, setOraFine] = useState("18:00");

  /* INITIAL FETCH */
  useEffect(() => {
    if (!token) return;

    dispatch(fetchPointsOfSalesAsync({ token }));
    dispatch(fetchLeaveAsync(token));

    if (authUser?._id) {
      dispatch(fetchUserShiftsAsync({ userId: authUser._id, token }));
    }
  }, [token, authUser?._id, dispatch]);

  /* WORKPLACE LABEL */
  useEffect(() => {
    if (!profileUser?.workplace) return setWorkplaceName("");

    if (typeof profileUser.workplace === "string") {
      const found = pointsOfSale.find((p) => p._id === profileUser.workplace);
      setWorkplaceName(
        found
          ? `${found.name} – ${found.location?.city || ""}`
          : profileUser.workplace
      );
    } else {
      setWorkplaceName(
        `${profileUser.workplace.name} – ${
          profileUser.workplace.location?.city || ""
        }`
      );
    }
  }, [profileUser, pointsOfSale]);

  /* EMPLOYEE DATA */
  const anagrafica = useMemo(() => {
    if (!profileUser) return null;

    return {
      nome: `${profileUser.firstName || ""} ${profileUser.lastName || ""}`.trim(),
      ruolo: profileUser.department || "",
      matricola: profileUser.personnelNumber ?? "",
      email: profileUser.email || "",
      telefono: profileUser.phone || "",
      sede: workplaceName,
      contratto: profileUser.contractType || "",
      assunzione: profileUser.hireDate
        ? new Date(profileUser.hireDate).toLocaleDateString("it-IT")
        : "",
    };
  }, [profileUser, workplaceName]);

  /* WEEK DAYS */
  const weekDays = [
    { key: "monday", label: t("lunedi") },
    { key: "tuesday", label: t("martedi") },
    { key: "wednesday", label: t("mercoledi") },
    { key: "thursday", label: t("giovedi") },
    { key: "friday", label: t("venerdi") },
    { key: "saturday", label: t("sabato") },
  ];

  /* USER SHIFTS (MERGED) */
  const existingShifts = useMemo(() => {
    if (!userShifts?.shifts) return [];

    return weekDays
      .map((day) => {
        const d = getDaySlots(userShifts.shifts[day.key]);
        const activePeriod = SHIFT_PERIOD_KEYS.find((period) => d[period]);
        if (!activePeriod) return null;

        return {
          day: day.label,
          hours: getShiftPeriodHoursLabel(activePeriod),
        };
      })
      .filter(Boolean);
  }, [userShifts, weekDays]);

  const giorniLavorati = useMemo(
    () => countWorkingDays(userShifts?.shifts || {}),
    [userShifts]
  );
  const oreSettimanali = useMemo(
    () => countWeeklyHours(userShifts?.shifts || {}),
    [userShifts]
  );

  /* LEAVE LISTS */
  const realFerieList =
    leave?.requestedHours?.filter((r) => r.mode === "vacation") || [];
  const realPermessiList =
    leave?.requestedHours?.filter((r) => r.mode === "leave") || [];
  const ferieList = realFerieList.length
    ? realFerieList
    : DEMO_FERIE_REQUESTS;
  const permessiList = realPermessiList.length
    ? realPermessiList
    : DEMO_PERMESSI_REQUESTS;

  /* HELPERS */
  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, "0")}/${String(
      d.getMonth() + 1
    ).padStart(2, "0")}/${d.getFullYear()}`;
  };

  /* ACTIONS */
  const handleInviaFerie = () => {
    if (!dal || !al || !token) return;

    const fromDate = new Date(dal);
    const toDate = new Date(al);
    if (toDate < fromDate) return;

    const days =
      Math.floor((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1;

    dispatch(
      createLeaveRequestAsync({
        payload: {
          year: fromDate.getFullYear(),
          hours: days * 8,
          mode: "vacation",
          from: dal,
          to: al,
        },
        token,
      })
    ).then(() => {
      setDal("");
      setAl("");
      setOpenFerieDrawer(false);
    });
  };

  const handleInviaPermesso = () => {
    if (!permessoData || !oraInizio || !oraFine || !token) return;

    const start = new Date(`2020-01-01T${oraInizio}`);
    const end = new Date(`2020-01-01T${oraFine}`);
    if (end <= start) return;

    dispatch(
      createLeaveRequestAsync({
        payload: {
          year: new Date(permessoData).getFullYear(),
          hours: (end - start) / (1000 * 60 * 60),
          mode: "leave",
          from: permessoData,
          to: permessoData,
          timeFrom: oraInizio,
          timeTo: oraFine,
        },
        token,
      })
    ).then(() => {
      setPermessoData("");
      setOraInizio("08:00");
      setOraFine("18:00");
      setOpenPermessiDrawer(false);
    });
  };

  /* GUARD */
  if (!token || !profileUser) return null;

  return (
    <div
      data-page-scroll
      className="adminEmployee w-full h-full flex flex-col gap-6 overflow-y-auto"
    >
      {/* TOP STATS */}
      <section className="employee-stats-grid">
        {[
          {
            label: t("giorniLavorati"),
            value: existingShifts.length,
            icon: CalendarCheckIcon,
          },
          {
            label: t("ferieResidue"),
            value: leaveLoading ? "..." : leave?.vacationHours ?? 0,
            icon: BagIcon,
          },
          {
            label: t("permessiResidui"),
            value: leaveLoading ? "..." : leave?.leaveHours ?? 0,
            icon: CalendarBlankIcon,
          },
        ].map(({ label, value, icon: Icon }, i) => (
          <div
            key={i}
            className="custom-box page-info-box"
          >
            <span className="employee-stat-label">
              {createElement(Icon, {
                size: 24,
                weight: "duotone",
                color: theme === "dark" ? "white" : "#090c64",
              })}
              <span>{label}</span>
            </span>
            <span className="employee-stat-value font-semibold">{value}</span>
          </div>
        ))}
      </section>

      {/* PROFILE + SHIFTS */}
      <div className="employee-two-column">
        {/* PROFILE */}
        <div className="custom-box p-6">
          <div className="mb-4">
            <h2>{t("anagrafica")}</h2>
          </div>

          <div className="flex flex-col gap-2">
            {Object.entries(anagrafica).map(([k, v]) => (
              <div key={k}>
                <strong>{t(k)}:</strong> {v}
              </div>
            ))}
          </div>
        </div>

        {/* SHIFTS */}
        <div className="custom-box p-6">
          <div className="mb-4">
            <h2>{t("turniSettimanali")}</h2>
            <p className="text-xs opacity-70 mt-1">{t("shiftsWeeklyContractHint")}</p>
            {userShifts?.shifts && (
              <p className="text-xs font-semibold opacity-80 mt-1">
                {t("shiftsWeeklyHoursSummary")
                  .replace("{hours}", String(oreSettimanali))
                  .replace("{days}", String(giorniLavorati))}
              </p>
            )}
          </div>

          {shiftsLoading && (
            <p className="text-sm opacity-70">{t("caricamentoTurni")}</p>
          )}
          {shiftsError && (
            <p className="text-sm text-red-500">{shiftsError}</p>
          )}
          {!shiftsLoading && existingShifts.length === 0 && (
            <p className="text-sm opacity-70">{t("nessunTurnoAssegnato")}</p>
          )}

          <div className="flex flex-col gap-2">
            {existingShifts.map((s, i) => (
              <div
                key={i}
                className="employee-shift-row bg-white/40 rounded-xl p-2"
              >
                <span className="font-semibold">{s.day}</span>
                <span>{s.hours}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* LEAVE REQUESTS */}
      <div className="employee-two-column">
        {/* VACATION */}
        <div className="custom-box p-6">
          <div className="employee-card-header mb-4">
            <h2>{t("ferie")}</h2>
            <button
              className="custom-button"
              onClick={() => setOpenFerieDrawer(true)}
            >
              {t("richiediFerie")}
            </button>
          </div>

          {ferieList.map((f, i) => (
            <div
              key={i}
              className="employee-request-row bg-white/40 rounded-xl p-2 mb-2"
            >
              <span className="font-semibold">
                {formatDate(f.from)} – {formatDate(f.to)}
              </span>
              <div className="employee-request-actions">
                <span>{f.hours}h</span>
                <StatusDot status={f.status} />
              </div>
            </div>
          ))}
        </div>

        {/* PERMISSIONS */}
        <div className="custom-box p-6">
          <div className="employee-card-header mb-4">
            <h2>{t("permessi")}</h2>
            <button
              className="custom-button"
              onClick={() => setOpenPermessiDrawer(true)}
            >
              {t("richiediPermesso")}
            </button>
          </div>

          {permessiList.map((p, i) => (
            <div
              key={i}
              className="employee-request-row bg-white/40 rounded-xl p-2 mb-2"
            >
              <span className="font-semibold">{formatDate(p.from)}</span>
              <div className="employee-request-actions">
                <span>
                  {p.timeFrom} – {p.timeTo}
                </span>
                <span>{p.hours}h</span>
                <StatusDot status={p.status} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DRAWERS */}
      <Drawer
        open={openFerieDrawer}
        onClose={() => setOpenFerieDrawer(false)}
        title={t("richiestaFerie")}
      >
        <div className="flex flex-col gap-6">
          <input type="date" value={dal} onChange={(e) => setDal(e.target.value)} />
          <input type="date" value={al} onChange={(e) => setAl(e.target.value)} />
          <button className="custom-button" onClick={handleInviaFerie}>
            {t("inviaRichiestaFerie")}
          </button>
        </div>
      </Drawer>

      <Drawer
        open={openPermessiDrawer}
        onClose={() => setOpenPermessiDrawer(false)}
        title={t("richiestaPermessi")}
      >
        <div className="flex flex-col gap-6">
          <input
            type="date"
            value={permessoData}
            onChange={(e) => setPermessoData(e.target.value)}
          />
          <div className="employee-time-fields">
            <input
              type="time"
              value={oraInizio}
              onChange={(e) => setOraInizio(e.target.value)}
            />
            <input
              type="time"
              value={oraFine}
              onChange={(e) => setOraFine(e.target.value)}
            />
          </div>
          <button className="custom-button" onClick={handleInviaPermesso}>
            {t("inviaRichiestaPermessi")}
          </button>
        </div>
      </Drawer>
    </div>
  );
};

export default UserEmployeePage;
