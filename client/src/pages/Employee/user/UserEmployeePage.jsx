import { useTheme } from "../../../context/ThemeContext";
import { useLanguage } from "../../../context/LanguageContext";
import {
  UserCircleIcon,
  CalendarCheckIcon,
  BagIcon,
  CalendarBlankIcon,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import Drawer from "../../../components/Drawer";
import { fetchPointsOfSalesAsync } from "../../../store/feature/pointOfSalesSlice";
import { fetchUserShiftsAsync } from "../../../store/feature/shiftsSlice";
import {
  fetchLeaveAsync,
  createLeaveRequestAsync,
} from "../../../store/feature/userLeave";

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

const UserEmployeePage = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const dispatch = useDispatch();

  /* REDUX STATE */
  const authUser = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);
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
    if (!authUser?.workplace) return setWorkplaceName("");

    if (typeof authUser.workplace === "string") {
      const found = pointsOfSale.find((p) => p._id === authUser.workplace);
      setWorkplaceName(
        found
          ? `${found.name} – ${found.location?.city || ""}`
          : authUser.workplace
      );
    } else {
      setWorkplaceName(
        `${authUser.workplace.name} – ${
          authUser.workplace.location?.city || ""
        }`
      );
    }
  }, [authUser, pointsOfSale]);

  /* EMPLOYEE DATA */
  const anagrafica = useMemo(() => {
    if (!authUser) return null;

    return {
      nome: `${authUser.firstName || ""} ${authUser.lastName || ""}`.trim(),
      ruolo: authUser.department || "",
      matricola: authUser.personnelNumber ?? "",
      email: authUser.email || "",
      telefono: authUser.phone || "",
      sede: workplaceName,
      contratto: authUser.contractType || "",
      assunzione: authUser.hireDate
        ? new Date(authUser.hireDate).toLocaleDateString("it-IT")
        : "",
    };
  }, [authUser, workplaceName]);

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
        const d = userShifts.shifts[day.key] || {};
        const morning = d.morning ? "08:00 - 13:00" : "";
        const afternoon = d.afternoon ? "14:00 - 18:00" : "";

        if (!morning && !afternoon) return null;

        return {
          day: day.label,
          hours:
            morning && afternoon
              ? `${morning} / ${afternoon}`
              : morning || afternoon,
        };
      })
      .filter(Boolean);
  }, [userShifts, weekDays]);

  /* LEAVE LISTS */
  const ferieList =
    leave?.requestedHours?.filter((r) => r.mode === "vacation") || [];
  const permessiList =
    leave?.requestedHours?.filter((r) => r.mode === "leave") || [];

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
  if (!token || !authUser) return null;

  return (
    <div className="adminEmployee w-full h-full flex flex-col gap-8 p-4 overflow-y-auto">
      {/* TOP STATS */}
      <section className="grid grid-cols-3 gap-6">
        {[
          {
            label: t("giorniLavorati"),
            value: existingShifts.length,
            icon: CalendarCheckIcon,
          },
          {
            label: t("ferieResidue"),
            value: leave?.vacationHours ?? 0,
            icon: BagIcon,
          },
          {
            label: t("permessiResidui"),
            value: leave?.leaveHours ?? 0,
            icon: CalendarBlankIcon,
          },
        ].map(({ label, value, icon: Icon }, i) => (
          <div key={i} className="custom-box flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Icon
                size={28}
                weight="duotone"
                color={theme === "dark" ? "white" : "#090c64"}
              />
              <span className="font-bold">{label}</span>
            </div>
            <span className="text-sm opacity-70 font-semibold">{value}</span>
          </div>
        ))}
      </section>

      {/* PROFILE + SHIFTS */}
      <div className="flex gap-6">
        {/* PROFILE */}
        <div className="flex-1 custom-box p-6">
          <div className="flex items-center gap-3 mb-4">
            <UserCircleIcon
              size={32}
              weight="duotone"
              color={theme === "dark" ? "white" : "#090c64"}
            />
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
        <div className="flex-1 custom-box p-6">
          <div className="flex items-center gap-3 mb-4">
            <CalendarCheckIcon
              size={32}
              weight="duotone"
              color={theme === "dark" ? "white" : "#090c64"}
            />
            <h2>{t("turniSettimanali")}</h2>
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
                className="flex justify-between bg-white/40 rounded-xl p-2"
              >
                <span className="font-semibold">{s.day}</span>
                <span>{s.hours}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* LEAVE REQUESTS */}
      <div className="flex gap-6">
        {/* VACATION */}
        <div className="flex-1 custom-box p-6">
          <div className="flex items-center justify-between mb-4">
            <h2>{t("ferie")}</h2>
            <button
              className="custom-button"
              onClick={() => setOpenFerieDrawer(true)}
            >
              {t("richiestaFerie")}
            </button>
          </div>

          {ferieList.map((f, i) => (
            <div
              key={i}
              className="flex justify-between bg-white/40 rounded-xl p-2 mb-2"
            >
              <span className="font-semibold">
                {formatDate(f.from)} – {formatDate(f.to)}
              </span>
              <div className="flex items-center gap-4">
                <span>{f.hours}h</span>
                <StatusDot status={f.status} />
              </div>
            </div>
          ))}
        </div>

        {/* PERMISSIONS */}
        <div className="flex-1 custom-box p-6">
          <div className="flex items-center justify-between mb-4">
            <h2>{t("permessi")}</h2>
            <button
              className="custom-button"
              onClick={() => setOpenPermessiDrawer(true)}
            >
              {t("richiestaPermessi")}
            </button>
          </div>

          {permessiList.map((p, i) => (
            <div
              key={i}
              className="flex justify-between bg-white/40 rounded-xl p-2 mb-2"
            >
              <span className="font-semibold">{formatDate(p.from)}</span>
              <div className="flex items-center gap-4">
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
          <div className="flex gap-4">
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
