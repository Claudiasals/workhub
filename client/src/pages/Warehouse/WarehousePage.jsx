import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { fetchItems, addItem } from "../../store/feature/itemsSlice";
import { fetchOrders } from "../../store/feature/orderSlice";
import { useTheme } from "../../context/ThemeContext.jsx";
import { fetchWarehouseSuggestionsRequest } from "../../api/aiApi";
import { localizeWarehouseSuggestions } from "../../utils/warehouseSuggestionsI18n";
import { analyzeWarehouseSuggestionsLocal } from "../../utils/warehouseSuggestionsAnalyzer";
import { warehouseAiFingerprint } from "../../utils/aiDataFingerprint";
import { useAiApiAutoRefresh } from "../../hooks/useAiApiAutoRefresh";
import { AiAlertList, AiInsightPanel } from "../../components/ai/AiInsightPanel";

import WarehouseTable from "../../components/Warehouse/WarehouseTable";
import DrawerAddNewProduct from "../../components/Warehouse/DrawerAddNewProduct";
import { getWorkplaceId } from "../../utils/shiftsCalendar";

import {
  PackageIcon,
  WarningOctagonIcon,
  TrendUpIcon,
  TrendDownIcon,
} from "@phosphor-icons/react";
import { computeWarehouseProductTrends } from "../../utils/warehouseProductTrends";

const getItemStock = (item) =>
  Number(item.stock?.["Mia Sede"] ?? item.stock ?? 0);

const getItemStockLimit = (item) => Number(item.stockLimit ?? 0);

const isLowStockItem = (item) => getItemStock(item) <= getItemStockLimit(item);

const WarehousePage = () => {
  const dispatch = useDispatch();

  const { t, lang } = useLanguage();
  const { theme } = useTheme();
  const token = useSelector((state) => state.auth.token);
  const role = useSelector((state) => state.auth.user?.role);
  const authUser = useSelector((state) => state.auth.user);
  const isAdmin = role === "admin";
  const userWorkplaceId = getWorkplaceId(authUser);

  const items = useSelector((state) => state.items.list);
  const orders = useSelector((state) => state.orders.items) || [];
  const itemsStatus = useSelector((state) => state.items.status);
  const itemsError = useSelector((state) => state.items.error);

  const textColor = theme === "dark" ? "text-white" : "text-[#090c64]";

  const [drawerAddOpen, setDrawerAddOpen] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const aiSnapshotRef = useRef({ items: [], orders: [] });

  useEffect(() => {
    if (token) {
      dispatch(fetchItems());
    }
  }, [token, dispatch]);

  const filteredItems = useMemo(() => {
    if (!items?.length) return [];
    if (isAdmin || !userWorkplaceId) return items;

    return items.filter((item) => {
      const itemWorkplaceId =
        typeof item.pointOfSales === "string"
          ? item.pointOfSales
          : item.pointOfSales?._id || item.pointOfSales?.id;

      return String(itemWorkplaceId) === String(userWorkplaceId);
    });
  }, [items, userWorkplaceId, isAdmin]);

  aiSnapshotRef.current = { items: filteredItems, orders };

  const loadWarehouseAi = useCallback(async () => {
    if (!token) return;

    const { items: scopedItems, orders: scopedOrders } = aiSnapshotRef.current;
    setAiSuggestions(analyzeWarehouseSuggestionsLocal(scopedItems, scopedOrders));
    setAiLoading(true);
    setAiError("");

    try {
      const data = await fetchWarehouseSuggestionsRequest(token, lang);
      setAiSuggestions(data);
    } catch {
      setAiError("");
    } finally {
      setAiLoading(false);
    }
  }, [token, lang]);

  const warehouseFingerprint = useMemo(
    () => warehouseAiFingerprint({ items: filteredItems, orders }),
    [filteredItems, orders]
  );

  const warehouseDataReady =
    itemsStatus !== "loading" && itemsStatus !== "idle";

  const localizedSuggestions = useMemo(
    () => localizeWarehouseSuggestions(aiSuggestions?.suggestions || [], t),
    [aiSuggestions?.suggestions, t]
  );

  useEffect(() => {
    if (token) {
      dispatch(fetchOrders({ token }));
    }
  }, [token, dispatch]);

  useEffect(() => {
    setAiSuggestions(
      analyzeWarehouseSuggestionsLocal(filteredItems, orders)
    );
  }, [filteredItems, orders]);

  useAiApiAutoRefresh({
    enabled: Boolean(token),
    dataReady: warehouseDataReady,
    fingerprint: warehouseFingerprint,
    onRefresh: loadWarehouseAi,
  });

  const toggleUserAiPanel = () => {
    setAiPanelOpen((current) => !current);
  };

  const columns = [
    "sku",
    "product",
    "category",
    "pointOfSales",
    "stock",
    "stockLimit",
    "promo",
    "note",
    "stato",
  ];

  const handleAddProduct = (newProduct) => {
    dispatch(addItem(newProduct));
  };

  const lowStockItems = useMemo(
    () => filteredItems.filter(isLowStockItem),
    [filteredItems]
  );

  const productTrends = useMemo(
    () => computeWarehouseProductTrends(filteredItems, orders),
    [filteredItems, orders]
  );

  const summaryKpis = [
    {
      label: t("warehouseKpiTotal"),
      number: filteredItems.length,
      icon: PackageIcon,
    },
    {
      label: t("warehouseKpiCriticalStock"),
      number: lowStockItems.length,
      icon: WarningOctagonIcon,
    },
    {
      label: t("warehouseKpiGrowing"),
      number: productTrends.growing,
      icon: TrendUpIcon,
    },
    {
      label: t("warehouseKpiDeclining"),
      number: productTrends.declining,
      icon: TrendDownIcon,
    },
  ];

  return (
    <div className="warehouse-page">
      <div className="warehouse-container page-section-stack page-section-stack--warehouse">

        <div className="warehouse-summary">
          {summaryKpis.map((kpi) => {
            const Icon = kpi.icon;

            return (
              <div
                key={kpi.label}
                className="warehouse-summary-btn warehouse-summary-btn--kpi disabled"
              >
                <span className="warehouse-summary-label">
                  <Icon
                    size={24}
                    color={theme === "dark" ? "white" : "#090c64"}
                    weight="duotone"
                  />
                  <span className={textColor}>{kpi.label}</span>
                </span>
                <span className="warehouse-summary-value">
                  <span className={textColor}>{kpi.number}</span>
                </span>
              </div>
            );
          })}
        </div>

        {(isAdmin || aiPanelOpen) && (
          <AiInsightPanel
            title={t("aiWarehouseTitle")}
            loading={aiLoading}
            error={aiError}
            source={aiSuggestions?.source}
            onClose={!isAdmin ? () => setAiPanelOpen(false) : undefined}
            hasData={localizedSuggestions.length > 0}
            className={`w-full ${textColor}`}
          >
            <AiAlertList
              items={localizedSuggestions}
              sortBySeverity
              compact
              initialLimit={isAdmin ? 3 : null}
            />
          </AiInsightPanel>
        )}

        {itemsStatus === "failed" && (
          <p className="mb-3 text-sm font-semibold text-red-500">
            {itemsError || t("erroreCaricamentoMagazzino")}
          </p>
        )}

        {itemsStatus === "loading" && !items?.length && (
          <p className="mb-3 text-sm opacity-70">{t("caricamentoMagazzino")}</p>
        )}

        <WarehouseTable
          data={filteredItems}
          allItems={items}
          columns={columns}
          onAddStock={() => setDrawerAddOpen(true)}
          onToggleAi={!isAdmin ? toggleUserAiPanel : undefined}
          aiPanelOpen={aiPanelOpen}
        />

        <DrawerAddNewProduct
          open={drawerAddOpen}
          onClose={() => setDrawerAddOpen(false)}
          onAddStock={handleAddProduct}
        />

      </div>
    </div>
  );
};

export default WarehousePage;
