import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "../../../context/ThemeContext";
import { useLanguage } from "../../../context/LanguageContext";
import {
  UserCircleIcon,
  CalendarCheckIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";

import { fetchUserByIdAsync } from "../../../store/feature/userSlice";
import { fetchPointsOfSalesAsync } from "../../../store/feature/pointOfSalesSlice";
import {
  fetchUserShiftsAsync,
  updateShiftAsync,
} from "../../../store/feature/shiftsSlice";
import {
  fetchLeaveByUserIdAsync,
  updateLeaveStatusAsync,
} from "../../../store/feature/userLeave";

/* STATUS DOT COMPONENT */
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

const AdminEmployeeDetailsPage = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const dispatch = useDispatch();
  const { id } = useParams();
  const prevIdRef = useRef(null);

  const token = useSelector((state) => state.auth?.token);

  /* REDUX STATE */
  const { selected: user, loading, error } = useSelector(
    (state) => state.users
  );
  const { list: pointsOfSale = [] } = useSelector((state) => state.pos);
  const {
    current: userShifts,
    error: shiftsError,
  } = useSelector((state) => state.shifts);

  const leave = useSelector((state) => state.leave.record);
  const leaveLoading = useSelector((state) => state.leave.loading);

  /* LOCAL STATE */
  const [workplaceName, setWorkplaceName] = useState("");
  const [shiftMessage, setShiftMessage] = useState("");

  /* WEEK DAYS CONFIG */
  const weekDays = [
    { key: "monday", label: t("lunedi") },
    { key: "tuesday", label: t("martedi") },
    { key: "wednesday", label: t("mercoledi") },
    { key: "thursday", label: t("giovedi") },
    { key: "friday", label: t("venerdi") },
    { key: "saturday", label: t("sabato") },
  ];

  /* INITIAL FETCH */
  useEffect(() => {
    if (!id || !token) return;
    if (prevIdRef.current === id) return;

    prevIdRef.current = id;
    dispatch(fetchUserByIdAsync({ id, token }));
    dispatch(fetchPointsOfSalesAsync({ token }));
    dispatch(fetchUserShiftsAsync({ userId: id, token }));
    dispatch(fetchLeaveByUserIdAsync({ userId: id, token }));
  }, [id, token, dispatch]);

  /* WORKPLACE LABEL */
  useEffect(() => {
    if (!user?.workplace) return setWorkplaceName("");

    if (typeof user.workplace === "string") {
      const found = pointsOfSale.find((p) => p._id === user.workplace);
      setWorkplaceName(
        found
          ? `${found.name} – ${found.location?.city || ""}`
          : user.workplace
      );
    } else {
      setWorkplaceName(
        `${user.workplace.name} – ${user.workplace.location?.city || ""}`
      );
    }
  }, [user, pointsOfSale]);

  /* EMPLOYEE DATA */
  const anagrafica = useMemo(() => {
    if (!user) return null;

    return {
      nome: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      ruolo: user.department || "",
      matricola: user.personnelNumber ?? "",
      email: user.email || "",
      telefono: user.phone || "",
      sede: workplaceName,
      contratto: user.contractType || "",
      assunzione: user.hireDate
        ? new Date(user.hireDate).toLocaleDateString("it-IT")
        : "",
    };
  }, [user, workplaceName]);

  /* HELPERS */
  const showShiftMessage = (msg) => {
    setShiftMessage(msg);
    setTimeout(() => setShiftMessage(""), 2500);
  };

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, "0")}/${String(
      d.getMonth() + 1
    ).padStart(2, "0")}/${d.getFullYear()}`;
  };

  /* SHIFTS ACTIONS */
  const handleCreateShift = async (dayKey, period) => {
    if (!token || !userShifts?._id) return;

    if (userShifts?.shifts?.[dayKey]?.[period]) {
      showShiftMessage(t("turnoPresente"));
      return;
    }

    try {
      await dispatch(
        updateShiftAsync({
          id: userShifts._id,
          day: dayKey,
          period,
          value: true,
          token,
        })
      ).unwrap();
      showShiftMessage(t("turnoCreato"));
    } catch {
      showShiftMessage(t("erroreCreazioneTurno"));
    }
  };

  const handleDeleteSingleShift = async (dayKey, period) => {
    if (!token || !userShifts?._id) return;

    try {
      await dispatch(
        updateShiftAsync({
          id: userShifts._id,
          day: dayKey,
          period,
          value: false,
          token,
        })
      ).unwrap();
      showShiftMessage(t("turnoEliminato"));
    } catch {
      showShiftMessage(t("erroreEliminazioneTurno"));
    }
  };

  /* LEAVE REQUESTS */
  const ferie =
    leave?.requestedHours?.filter((r) => r.mode === "vacation") || [];
  const permessi =
    leave?.requestedHours?.filter((r) => r.mode === "leave") || [];

  const handleUpdateLeave = async (richiesta, status) => {
    if (!token || !richiesta?._id) return;
    await dispatch(
      updateLeaveStatusAsync({
        requestId: richiesta._id,
        status,
        token,
      })
    );
  };

  /* TOP STATS */
  const giorniLavorati = useMemo(() => {
    if (!userShifts?.shifts) return 0;
    return weekDays.reduce((acc, d) => {
      const day = userShifts.shifts[d.key] || {};
      return day.morning || day.afternoon ? acc + 1 : acc;
    }, 0);
  }, [userShifts, weekDays]);

  const topStats = [
    { label: t("giorniLavorati"), number: giorniLavorati },
    { label: t("ferieResidue"), number: leave?.vacationHours ?? 0 },
    { label: t("permessiResidui"), number: leave?.leaveHours ?? 0 },
    { label: t("richieste"), number: leave?.requestedHours?.length || 0 },
  ];

  /* GUARDS */
  if (!token) return null;
  if (loading && !anagrafica)
    return <p className="p-4">{t("caricamentoDipendenti")}</p>;
  if (error && !anagrafica)
    return (
      <p className="p-4 text-red-500">
        {t("erroreCaricamentoDipendenti")}: {error}
      </p>
    );
  if (!anagrafica)
    return <p className="p-4">{t("nessunDipendenteTrovato")}</p>;
  if (leaveLoading)
    return <p className="p-4">{t("caricamentoRichieste")}</p>;

  return (
    <div className="adminEmployee w-full h-full flex flex-col gap-8 p-4 overflow-y-auto">
      {/* TOP STATS */}
      <div className="grid grid-cols-4 gap-6">
        {topStats.map((s, i) => (
          <div key={i} className="custom-box flex flex-col items-center">
            <span className="font-bold">{s.label}</span>
            <span className="text-sm opacity-70 font-semibold">{s.number}</span>
          </div>
        ))}
      </div>

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
          <div className="flex items-center gap-3 mb-2">
            <CalendarCheckIcon
              size={32}
              weight="duotone"
              color={theme === "dark" ? "white" : "#090c64"}
            />
            <h2>{t("turniSettimanali")}</h2>
          </div>

          {shiftMessage && (
            <div className="mb-3 px-3 py-2 rounded-xl bg-green-500 text-white text-sm font-semibold">
              {shiftMessage}
            </div>
          )}

          {shiftsError && (
            <div className="mb-3 px-3 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold">
              {shiftsError}
            </div>
          )}

          <div className="flex flex-col gap-2">
            {weekDays.map((day) => {
              const d = userShifts?.shifts?.[day.key] || {};
              const hasAny = d.morning || d.afternoon;

              return (
                <div
                  key={day.key}
                  className="flex items-center justify-between bg-white/40 dark:bg-white/20 rounded-xl p-2"
                >
                  <span className="font-semibold">{day.label}</span>

                  <div className="flex items-center gap-2">
                    {d.morning ? (
                      <span className="bg-[#090c64] text-white text-xs px-3 py-1 rounded-xl">
                        08:00 - 13:00
                      </span>
                    ) : (
                      <button
                        onClick={() =>
                          handleCreateShift(day.key, "morning")
                        }
                        className="bg-white/40 text-[#090c64] text-sm px-3 py-1 rounded-xl"
                      >
                        08:00 - 13:00
                      </button>
                    )}

                    {d.afternoon ? (
                      <span className="bg-[#090c64] text-white text-xs px-3 py-1 rounded-xl">
                        14:00 - 18:00
                      </span>
                    ) : (
                      <button
                        onClick={() =>
                          handleCreateShift(day.key, "afternoon")
                        }
                        className="bg-white/40 text-[#090c64] text-sm px-3 py-1 rounded-xl"
                      >
                        14:00 - 18:00
                      </button>
                    )}

                    {hasAny && (
                      <button
                        onClick={() => {
                          if (d.morning)
                            handleDeleteSingleShift(day.key, "morning");
                          if (d.afternoon)
                            handleDeleteSingleShift(day.key, "afternoon");
                        }}
                        className="p-2 bg-white/60 rounded-xl"
                      >
                        <TrashIcon
                          size={18}
                          weight="duotone"
                          color={theme === "dark" ? "white" : "#090c64"}
                        />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* LEAVE REQUESTS */}
      <div className="flex gap-6">
        {[{ list: ferie, title: t("richiestaFerie"), mode: "vacation" },
          { list: permessi, title: t("richiestaPermessi"), mode: "leave" },
        ].map(({ list, title }, i) => (
          <div key={i} className="flex-1 custom-box p-6">
            <h2 className="mb-4">{title}</h2>

            {list.length === 0 && (
              <p className="text-sm opacity-70">
                {t("nessunaRichiesta")}
              </p>
            )}

            {list.map((r) => (
              <div
                key={r._id}
                className="flex items-center justify-between bg-white/40 dark:bg-white/20 rounded-xl p-2 mb-2"
              >
                <span className="font-semibold">
                  {anagrafica.nome} – {formatDate(r.from)} →{" "}
                  {formatDate(r.to)} ({r.hours}h)
                </span>

                <div className="flex items-center gap-4">
                  <StatusDot status={r.status} />
                  <button
                    onClick={() => handleUpdateLeave(r, "approved")}
                    className="custom-button text-sm px-3 py-1"
                  >
                    {t("accetta")}
                  </button>
                  <button
                    onClick={() => handleUpdateLeave(r, "denied")}
                    className="custom-button-light text-sm px-3 py-1"
                  >
                    {t("rifiuta")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminEmployeeDetailsPage;
