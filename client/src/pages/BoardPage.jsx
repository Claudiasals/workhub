import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ChartLineUpIcon } from "@phosphor-icons/react";

import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { fetchProducts } from "../store/feature/productsSlice";
import { fetchOrders } from "../store/feature/orderSlice";
import { fetchTickets } from "../store/feature/ticketSlice";
import { fetchItems } from "../store/feature/itemsSlice";
import { fetchCustomersAsync } from "../store/feature/customerSlice";
import { fetchUsersAsync } from "../store/feature/userSlice";
import { fetchAllShiftsAsync, fetchUserShiftsAsync } from "../store/feature/shiftsSlice";
import { fetchBusinessOverviewRequest } from "../api/aiApi";
import { analyzeBusinessOverviewLocal } from "../utils/businessOverviewAnalyzer";

import DashboardKpiRow from "../components/dashboard/DashboardKpiRow";
import BusinessOverviewPanel from "../components/dashboard/BusinessOverviewPanel";
import SalesTrendChart from "../components/dashboard/SalesTrendChart";
import DashboardCalendar from "../components/dashboard/DashboardCalendar";
import CompanyDocumentsSection from "../components/dashboard/CompanyDocumentsSection";

const MS_DAY = 86400000;
const DAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

const getItemStock = (item) =>
  Number(item.stock?.["Mia Sede"] ?? item.stock ?? 0);

const BoardPage = () => {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const token = useSelector((state) => state.auth.token);
  const authUser = useSelector((state) => state.auth.user);
  const customers = useSelector((state) => state.customers.list);
  const role = authUser?.role;
  const userWorkplaceId =
    typeof authUser?.workplace === "string"
      ? authUser.workplace
      : authUser?.workplace?._id || authUser?.workplace?.id;
  const isAdmin = role === "admin";

  const orders = useSelector((state) => state.orders);
  const ordersLoading = useSelector((state) => state.orders.loading);
  const itemsStatus = useSelector((state) => state.items.status);
  const tickets = useSelector((state) => state.tickets.tickets) || [];
  const warehouseItems = useSelector((state) => state.items.list) || [];
  const shifts = useSelector((state) => state.shifts.list) || [];
  const userShifts = useSelector((state) => state.shifts.current);
  const users = useSelector((state) => state.users.list) || [];

  const dataSnapshotRef = useRef({ items: [], orders: [], tickets: [], shifts: [] });

  const scopedOrders = useMemo(() => {
    const list = orders?.items ?? [];
    if (!userWorkplaceId || isAdmin) return list;
    return list.filter((order) => {
      const posId =
        typeof order.pointOfSales === "string"
          ? order.pointOfSales
          : order.pointOfSales?._id || order.pointOfSales?.id;
      return String(posId) === String(userWorkplaceId);
    });
  }, [orders?.items, userWorkplaceId, isAdmin]);

  const scopedItems = useMemo(() => {
    if (!userWorkplaceId || isAdmin) return warehouseItems;
    return warehouseItems.filter((item) => {
      const itemPos =
        typeof item.pointOfSales === "string"
          ? item.pointOfSales
          : item.pointOfSales?._id || item.pointOfSales?.id;
      return String(itemPos) === String(userWorkplaceId);
    });
  }, [warehouseItems, userWorkplaceId, isAdmin]);

  const [overviewData, setOverviewData] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState("");
  const [overviewOffline, setOverviewOffline] = useState(false);
  const overviewAutoLoadedRef = useRef(false);

  dataSnapshotRef.current = {
    items: scopedItems,
    orders: scopedOrders,
    tickets,
    shifts,
  };

  const coreDataReady =
    !isAdmin ||
    (!ordersLoading && itemsStatus !== "loading" && itemsStatus !== "idle");

  const textColor = theme === "dark" ? "text-white" : "text-[#090c64]";

  useEffect(() => {
    if (!token) return;

    dispatch(fetchProducts(token));
    dispatch(fetchOrders({ token }));
    dispatch(fetchCustomersAsync(token));

    if (isAdmin) {
      dispatch(fetchItems());
      dispatch(fetchTickets());
      dispatch(fetchUsersAsync(token));
      dispatch(fetchAllShiftsAsync({ token }));
    } else if (authUser?._id) {
      dispatch(fetchUserShiftsAsync({ userId: authUser._id, token }));
    }
  }, [dispatch, token, isAdmin, authUser?._id]);

  const loadBusinessOverview = useCallback(async () => {
    if (!token || !isAdmin) return;
    setOverviewLoading(true);
    setOverviewError("");
    try {
      const data = await fetchBusinessOverviewRequest(token);
      setOverviewData(data);
      setOverviewOffline(false);
    } catch {
      setOverviewData(analyzeBusinessOverviewLocal(dataSnapshotRef.current));
      setOverviewOffline(true);
      setOverviewError("");
    } finally {
      setOverviewLoading(false);
    }
  }, [token, isAdmin]);

  useEffect(() => {
    overviewAutoLoadedRef.current = false;
  }, [token]);

  useEffect(() => {
    if (isAdmin && token && coreDataReady && !overviewAutoLoadedRef.current) {
      overviewAutoLoadedRef.current = true;
      loadBusinessOverview();
    }
  }, [isAdmin, token, coreDataReady, loadBusinessOverview]);

  const kpiMetrics = useMemo(() => {
    const now = Date.now();
    const last30 = scopedOrders.filter(
      (o) => now - new Date(o.createdAt).getTime() <= 30 * MS_DAY
    );
    const revenue = last30.reduce((sum, o) => {
      const price = Number(o.product?.price) || 0;
      const qty = Number(o.totalQuantity) || Number(o.quantity) || 1;
      return sum + price * qty;
    }, 0);

    const openTickets = isAdmin
      ? tickets.filter((ticket) => ticket.status === "open").length
      : 0;

    const criticalStock = isAdmin
      ? scopedItems.filter(
          (item) => getItemStock(item) <= Number(item.stockLimit ?? 0)
        ).length
      : 0;

    const todayKey = DAY_KEYS[new Date().getDay()];
    let staffOnShift = 0;

    if (isAdmin) {
      shifts.forEach((doc) => {
        const slots = doc.shifts?.[todayKey];
        if (slots?.morning) staffOnShift += 1;
        if (slots?.afternoon) staffOnShift += 1;
      });
    } else if (userShifts?.shifts?.[todayKey]) {
      const slots = userShifts.shifts[todayKey];
      staffOnShift = (slots.morning ? 1 : 0) + (slots.afternoon ? 1 : 0);
    }

    return {
      revenue,
      ordersCount: scopedOrders.length,
      openTickets,
      criticalStock,
      staffOnShift,
    };
  }, [scopedOrders, tickets, scopedItems, shifts, userShifts, isAdmin]);

  return (
    <div
      data-page-scroll
      className="dashboard-page-section w-full h-full overflow-y-auto
      [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
    >
      <DashboardKpiRow {...kpiMetrics} isAdmin={isAdmin} />

      {isAdmin && (
        <BusinessOverviewPanel
          data={overviewData}
          loading={overviewLoading}
          error={overviewError}
          source={overviewOffline ? "heuristic" : overviewData?.source}
          offlineHint={overviewOffline}
          onRefresh={loadBusinessOverview}
        />
      )}

      <section className={`app-surface flex flex-col gap-3 p-4 min-w-0 w-full ${textColor}`}>
        <div className="dashboard-card-header flex items-center gap-3">
          <ChartLineUpIcon
            size={24}
            color={theme === "dark" ? "white" : "#090c64"}
            weight="duotone"
          />
          <h3 className="text-sm font-bold">{t("andamentoVendite")}</h3>
        </div>
        <SalesTrendChart
          orders={scopedOrders}
          customers={customers ?? []}
          theme={theme}
        />
      </section>

      <DashboardCalendar canManage={isAdmin} />

      <CompanyDocumentsSection canManage={isAdmin} />
    </div>
  );
};

export default BoardPage;
