import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { fetchTickets, selectTickets } from "../store/feature/ticketSlice";
import { fetchLeaveAsync } from "../store/feature/userLeave";
import { fetchEventsAsync } from "../store/feature/eventsSlice";
import { fetchUserShiftsAsync } from "../store/feature/shiftsSlice";
import { loadCompanyDocuments } from "../utils/companyDocumentsStorage";
import {
  buildUserNotifications,
  markNotificationItemRead,
} from "../utils/buildUserNotifications";
import { useLanguage } from "../context/LanguageContext";

const DOCUMENTS_STORAGE_KEY = "workhub_company_documents";
const REFRESH_MS = 60_000;

export function useUserNotifications() {
  const dispatch = useDispatch();
  const { t } = useLanguage();

  const authUser = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);
  const tickets = useSelector(selectTickets);
  const leaveRecord = useSelector((state) => state.leave.record);
  const events = useSelector((state) => state.events.events) || [];
  const userShifts = useSelector((state) => state.shifts.current);

  const userId = authUser?._id || authUser?.id;
  const isAdmin = authUser?.role === "admin";

  const [documents, setDocuments] = useState(() => loadCompanyDocuments());
  const [tick, setTick] = useState(0);

  const refreshDocuments = useCallback(() => {
    setDocuments(loadCompanyDocuments());
  }, []);

  useEffect(() => {
    if (!token || !userId) return;

    dispatch(fetchTickets());
    dispatch(fetchLeaveAsync(token));
    dispatch(fetchEventsAsync({ token }));

    if (!isAdmin) {
      dispatch(fetchUserShiftsAsync({ userId, token }));
    }
  }, [dispatch, token, userId, isAdmin]);

  useEffect(() => {
    if (!token || !userId) return;

    const interval = setInterval(() => {
      dispatch(fetchTickets());
      dispatch(fetchLeaveAsync(token));
      dispatch(fetchEventsAsync({ token }));
      if (!isAdmin) {
        dispatch(fetchUserShiftsAsync({ userId, token }));
      }
      refreshDocuments();
      setTick((value) => value + 1);
    }, REFRESH_MS);

    return () => clearInterval(interval);
  }, [dispatch, token, userId, isAdmin, refreshDocuments]);

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === DOCUMENTS_STORAGE_KEY) {
        refreshDocuments();
      }
    };

    const onDocumentsUpdated = () => refreshDocuments();

    window.addEventListener("storage", onStorage);
    window.addEventListener("workhub-documents-updated", onDocumentsUpdated);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(
        "workhub-documents-updated",
        onDocumentsUpdated
      );
    };
  }, [refreshDocuments]);

  const { items, count, snapshot } = useMemo(() => {
    void tick;

    const result = buildUserNotifications({
      authUser,
      tickets,
      leaveRecord,
      documents,
      events,
      userShifts,
      isAdmin,
      t,
    });

    return {
      items: result.items,
      count: result.count,
      snapshot: result.snapshot,
    };
  }, [
    authUser,
    tickets,
    leaveRecord,
    documents,
    events,
    userShifts,
    isAdmin,
    t,
    tick,
  ]);

  const markItemRead = useCallback(
    (item) => {
      if (!userId || !snapshot || !item) return;
      markNotificationItemRead(userId, item, snapshot);
      setTick((value) => value + 1);
    },
    [userId, snapshot]
  );

  const refresh = useCallback(() => {
    if (!token || !userId) return;

    dispatch(fetchTickets());
    dispatch(fetchLeaveAsync(token));
    dispatch(fetchEventsAsync({ token }));
    if (!isAdmin) {
      dispatch(fetchUserShiftsAsync({ userId, token }));
    }
    refreshDocuments();
    setTick((value) => value + 1);
  }, [dispatch, token, userId, isAdmin, refreshDocuments]);

  return {
    items,
    count,
    markItemRead,
    refresh,
  };
}
