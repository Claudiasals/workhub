import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
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
import { businessOverviewFingerprint } from "../utils/aiDataFingerprint";
import { useAiApiAutoRefresh } from "../hooks/useAiApiAutoRefresh";
import { useSalesCommercialInsights } from "../hooks/useSalesCommercialInsights";

import DashboardKpiRow from "../components/dashboard/DashboardKpiRow";
import BusinessOverviewPanel, {
  OVERVIEW_ALERTS_LIMIT_OPS,
} from "../components/dashboard/BusinessOverviewPanel";
import SalesCommercialAiPanel from "../components/dashboard/SalesCommercialAiPanel";
import SalesTrendChart, {
  SalesTrendPeriodFilters,
} from "../components/dashboard/SalesTrendChart";
import { DEFAULT_SALES_TREND_MONTHS } from "../utils/salesTrend";
import DashboardCalendar from "../components/dashboard/DashboardCalendar";
import CompanyDocumentsSection from "../components/dashboard/CompanyDocumentsSection";
import { hasAnyShift } from "../utils/shiftPeriods";

const MS_DAY = 86400000;
const DAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

const getItemStock = (item) =>
  Number(item.stock?.["Mia Sede"] ?? item.stock ?? 0);

const BoardPage = () => {
  const dispatch = useDispatch();
  const location = useLocation();
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

  const coreDataReady =
    !isAdmin ||
    (!ordersLoading && itemsStatus !== "loading" && itemsStatus !== "idle");

  const [overviewData, setOverviewData] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState("");
  const [overviewOffline, setOverviewOffline] = useState(false);
  const overviewApiOkRef = useRef(false);

  const overviewFingerprint = useMemo(
    () =>
      businessOverviewFingerprint({
        orders: scopedOrders,
        tickets,
        items: scopedItems,
        shifts,
      }),
    [scopedOrders, tickets, scopedItems, shifts]
  );

  const {
    data: salesInsightsData,
    loading: salesInsightsLoading,
    error: salesInsightsError,
    offline: salesInsightsOffline,
    source: salesInsightsSource,
  } = useSalesCommercialInsights({
    enabled: isAdmin,
    orders: scopedOrders,
    customers: customers ?? [],
    items: scopedItems,
    dataReady: coreDataReady,
  });

  dataSnapshotRef.current = {
    items: scopedItems,
    orders: scopedOrders,
    tickets,
    shifts,
  };

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

  useEffect(() => {
    const hash = location.hash.replace("#", "");
    if (!hash) return;

    const target = document.getElementById(`dashboard-${hash}`);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [location.hash]);

  const loadBusinessOverview = useCallback(async () => {
    if (!token || !isAdmin) return;

    const local = analyzeBusinessOverviewLocal(dataSnapshotRef.current);
    if (!overviewApiOkRef.current) {
      setOverviewData(local);
    }
    setOverviewLoading(true);
    setOverviewError("");

    try {
      const data = await fetchBusinessOverviewRequest(token);
      setOverviewData(data);
      overviewApiOkRef.current = true;
      setOverviewOffline(false);
    } catch {
      overviewApiOkRef.current = false;
      setOverviewData(local);
      setOverviewOffline(true);
    } finally {
      setOverviewLoading(false);
    }
  }, [token, isAdmin]);

  useEffect(() => {
    overviewApiOkRef.current = false;
    setOverviewOffline(false);
  }, [token]);

  useAiApiAutoRefresh({
    enabled: isAdmin && Boolean(token),
    dataReady: coreDataReady,
    fingerprint: overviewFingerprint,
    onRefresh: loadBusinessOverview,
  });

  useEffect(() => {
    if (!isAdmin || !token) return;

    const local = analyzeBusinessOverviewLocal(dataSnapshotRef.current);
    if (!overviewApiOkRef.current || overviewOffline) {
      setOverviewData(local);
    }
  }, [isAdmin, token, scopedItems, scopedOrders, tickets, shifts, overviewOffline]);

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
        if (hasAnyShift(doc.shifts?.[todayKey])) staffOnShift += 1;
      });
    } else if (userShifts?.shifts?.[todayKey]) {
      staffOnShift = hasAnyShift(userShifts.shifts[todayKey]) ? 1 : 0;
    }

    return {
      revenue,
      ordersCount: scopedOrders.length,
      openTickets,
      criticalStock,
      staffOnShift,
    };
  }, [scopedOrders, tickets, scopedItems, shifts, userShifts, isAdmin]);

  const [salesTrendMonths, setSalesTrendMonths] = useState(DEFAULT_SALES_TREND_MONTHS);

  const salesInsightsPanelProps = {
    data: salesInsightsData,
    loading: salesInsightsLoading,
    error: salesInsightsError,
    source: salesInsightsSource,
    offlineHint: salesInsightsOffline,
  };

  const salesChartSection = (
    <section
      id="dashboard-sales"
      className={`app-surface dashboard-operations-hub__chart p-4 min-w-0 ${textColor}`}
    >
      <div className="sales-trend-header">
        <div className="dashboard-card-header min-w-0">
          <div className="panel-header-leading panel-header-leading--single">
            <ChartLineUpIcon
              size={24}
              color={theme === "dark" ? "white" : "#090c64"}
              weight="duotone"
              className="preserve-icon-size shrink-0"
            />
            <h3 className="text-sm font-bold">{t("andamentoVendite")}</h3>
          </div>
        </div>
        <SalesTrendPeriodFilters
          value={salesTrendMonths}
          onChange={setSalesTrendMonths}
          t={t}
        />
      </div>
      <SalesTrendChart
        orders={scopedOrders}
        customers={customers ?? []}
        theme={theme}
        monthsCount={salesTrendMonths}
      />
    </section>
  );

  return (
    <div
      data-page-scroll
      className="dashboard-page-section w-full h-full overflow-y-auto
      [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
    >
      {isAdmin && <DashboardKpiRow {...kpiMetrics} isAdmin={isAdmin} />}

      {isAdmin ? (
        <div className="dashboard-operations-hub">
          <div className="dashboard-operations-hub__top">
            <BusinessOverviewPanel
              data={overviewData}
              loading={overviewLoading}
              error={overviewError}
              source={overviewOffline ? "heuristic" : overviewData?.source}
              alertsInitialLimit={OVERVIEW_ALERTS_LIMIT_OPS}
              className="dashboard-operations-hub__overview"
            />
            <div
              id="dashboard-documents"
              className="dashboard-operations-hub__documents min-w-0"
            >
              <CompanyDocumentsSection canManage={isAdmin} />
            </div>
          </div>

          <div id="dashboard-calendar">
            <DashboardCalendar canManage={isAdmin} />
          </div>

          <div className="dashboard-operations-hub__sales-row">
            {salesChartSection}
            <SalesCommercialAiPanel
              {...salesInsightsPanelProps}
              section="insights"
              className="dashboard-operations-hub__insights"
            />
          </div>
        </div>
      ) : (
        <>
          <div id="dashboard-calendar">
            <DashboardCalendar canManage={isAdmin} />
          </div>
          <div id="dashboard-documents">
            <CompanyDocumentsSection canManage={isAdmin} />
          </div>
          {salesChartSection}
        </>
      )}
    </div>
  );
};

export default BoardPage;
