import { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { fetchItems, addItem } from "../../store/feature/itemsSlice";
import { fetchOrders } from "../../store/feature/orderSlice";
import { useTheme } from "../../context/ThemeContext.jsx";
import { fetchWarehouseSuggestionsRequest } from "../../api/aiApi";
import { localizeWarehouseSuggestions } from "../../utils/warehouseSuggestionsI18n";
import { AiAlertList, AiInsightPanel } from "../../components/ai/AiInsightPanel";

import WarehouseTable from "../../components/Warehouse/WarehouseTable";
import DrawerAddNewProduct from "../../components/Warehouse/DrawerAddNewProduct";
import { getWorkplaceId } from "../../utils/shiftsCalendar";

import {
  WarehouseIcon,
  PlusCircleIcon,
  WarningOctagonIcon,
  SparkleIcon,
} from "@phosphor-icons/react";

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
  const itemsStatus = useSelector((state) => state.items.status);
  const itemsError = useSelector((state) => state.items.error);

  const textColor = theme === "dark" ? "text-white" : "text-[#090c64]";

  const [drawerAddOpen, setDrawerAddOpen] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState(null);

  useEffect(() => {
    if (token) {
      dispatch(fetchItems());
    }
  }, [token, dispatch]);

  const loadWarehouseAi = useCallback(async () => {
    if (!token) return;
    setAiLoading(true);
    setAiError("");
    try {
      const data = await fetchWarehouseSuggestionsRequest(token, lang);
      setAiSuggestions(data);
    } catch (err) {
      setAiError(err.message || t("aiError"));
    } finally {
      setAiLoading(false);
    }
  }, [token, t, lang]);

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
    if (token) {
      loadWarehouseAi();
    }
  }, [token, loadWarehouseAi]);

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

  const lowStockItems = useMemo(
    () => filteredItems.filter(isLowStockItem),
    [filteredItems]
  );

  const summaryButtons = isAdmin
    ? [
        {
          label: t("totArticoli"),
          number: filteredItems.length,
          icon: WarehouseIcon,
          clickable: false,
        },
        {
          label: t("articoliInEsaurimento"),
          number: lowStockItems.length,
          icon: WarningOctagonIcon,
          clickable: false,
        },
        {
          label: t("caricaGiacenza"),
          icon: PlusCircleIcon,
          clickable: true,
          variant: "primary",
          onClick: () => setDrawerAddOpen(true),
        },
      ]
    : [
        {
          label: t("totArticoli"),
          number: filteredItems.length,
          icon: WarehouseIcon,
          clickable: false,
        },
        {
          label: t("aiWarehouseSummary"),
          number: localizedSuggestions.length,
          icon: SparkleIcon,
          clickable: true,
          active: aiPanelOpen,
          onClick: toggleUserAiPanel,
        },
        {
          label: t("caricaGiacenza"),
          icon: PlusCircleIcon,
          clickable: true,
          variant: "primary",
          onClick: () => setDrawerAddOpen(true),
        },
      ];

  return (
    <div className="warehouse-page">
      <div className="warehouse-container">

        <div className="warehouse-summary">
          {summaryButtons.map((btn, index) => {
            const Icon = btn.icon;
            const isPrimary = btn.variant === "primary";
            const SummaryControl = btn.clickable ? "button" : "div";

            return (
              <SummaryControl
                key={index}
                type={btn.clickable ? "button" : undefined}
                onClick={btn.clickable ? btn.onClick : undefined}
                className={`warehouse-summary-btn ${
                  btn.clickable ? "clickable" : "disabled"
                } ${isPrimary ? "primary" : ""}${btn.active ? " is-active" : ""}`}
              >
                <span className="warehouse-summary-label">
                  <Icon
                    size={24}
                    color={
                      isPrimary
                        ? "white"
                        : theme === "dark"
                          ? "white"
                          : "#090c64"
                    }
                    weight="duotone"
                  />
                  <span className={isPrimary ? "text-white" : textColor}>
                    {btn.label}
                  </span>
                </span>
                <span className="warehouse-summary-value">
                  {btn.number !== undefined && (
                    <span className={isPrimary ? "text-white" : textColor}>
                      {btn.number}
                    </span>
                  )}
                </span>
              </SummaryControl>
            );
          })}
        </div>

        {(isAdmin || aiPanelOpen) && (
          <AiInsightPanel
            title={t("aiWarehouseTitle")}
            loading={aiLoading}
            error={aiError}
            source={aiSuggestions?.source}
            onRefresh={loadWarehouseAi}
            onClose={!isAdmin ? () => setAiPanelOpen(false) : undefined}
            hasData={localizedSuggestions.length > 0}
            className={`w-full mb-4 ${textColor}`}
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
