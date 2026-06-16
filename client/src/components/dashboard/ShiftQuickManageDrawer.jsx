import { useMemo, useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import Drawer from "../Drawer";

import { useLanguage } from "../../context/LanguageContext";

import {

  updateShiftAsync,

  fetchAllShiftsAsync,

  fetchWorkplaceShiftsAsync,

} from "../../store/feature/shiftsSlice";

import {

  SHIFT_PERIOD_KEYS,

  getDaySlots,

  getShiftPeriodLabel,

} from "../../utils/shiftPeriods";



const WEEK_DAYS = [

  { key: "monday", labelIt: "Lunedì" },

  { key: "tuesday", labelIt: "Martedì" },

  { key: "wednesday", labelIt: "Mercoledì" },

  { key: "thursday", labelIt: "Giovedì" },

  { key: "friday", labelIt: "Venerdì" },

  { key: "saturday", labelIt: "Sabato" },

];



export function ShiftQuickManageDrawer({ open, onClose }) {

  const { t } = useLanguage();

  const dispatch = useDispatch();

  const token = useSelector((s) => s.auth.token);

  const users = useSelector((s) => s.users.list) || [];

  const shifts = useSelector((s) => s.shifts.list) || [];

  const [selectedUserId, setSelectedUserId] = useState("");

  const [busy, setBusy] = useState(false);



  const userShifts = useMemo(() => {

    if (!selectedUserId) return null;

    return shifts.find(

      (s) =>

        String(typeof s.user === "string" ? s.user : s.user?._id) ===

        String(selectedUserId)

    );

  }, [shifts, selectedUserId]);



  const toggleShift = async (dayKey, period) => {

    if (!token || !userShifts?._id) return;

    const slots = getDaySlots(userShifts.shifts?.[dayKey]);

    const turningOn = !slots[period];

    setBusy(true);

    try {

      await dispatch(

        updateShiftAsync({

          id: userShifts._id,

          day: dayKey,

          period,

          value: turningOn,

          token,

        })

      ).unwrap();

      dispatch(fetchAllShiftsAsync({ token }));

      dispatch(fetchWorkplaceShiftsAsync({ token }));

    } finally {

      setBusy(false);

    }

  };



  return (

    <Drawer open={open} onClose={onClose} title={t("shiftsManageTitle")}>

      <div className="flex flex-col gap-4">

        <p className="text-xs opacity-70">{t("shiftsWeeklyContractHint")}</p>



        <label className="text-sm font-semibold">{t("selezionaDipendente")}</label>

        <select

          className="custom-input"

          value={selectedUserId}

          onChange={(e) => setSelectedUserId(e.target.value)}

        >

          <option value="">{t("selezionaDipendente")}</option>

          {users.map((u) => (

            <option key={u._id} value={u._id}>

              {u.firstName} {u.lastName} — {u.department || t("noDepartment")}

            </option>

          ))}

        </select>



        {selectedUserId && !userShifts && (

          <p className="text-sm opacity-70">{t("shiftsNoRecord")}</p>

        )}



        {userShifts && (

          <div className="flex flex-col gap-2">

            {WEEK_DAYS.map(({ key, labelIt }) => {

              const day = getDaySlots(userShifts.shifts?.[key]);

              return (

                <div

                  key={key}

                  className="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-white/10"

                >

                  <span className="w-24 text-sm font-bold">{labelIt}</span>

                  {SHIFT_PERIOD_KEYS.map((period) => (

                    <button

                      key={period}

                      type="button"

                      disabled={busy}

                      className={`custom-button text-xs ${day[period] ? "" : "custom-button-light"}`}

                      onClick={() => toggleShift(key, period)}

                    >

                      {getShiftPeriodLabel(period, t)} {day[period] ? "✓" : "—"}

                    </button>

                  ))}

                </div>

              );

            })}

          </div>

        )}

      </div>

    </Drawer>

  );

}



export default ShiftQuickManageDrawer;


