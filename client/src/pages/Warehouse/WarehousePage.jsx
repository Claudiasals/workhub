import { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { fetchItems, addItem } from "../../store/feature/itemsSlice";
import { useTheme } from "../../context/ThemeContext.jsx";

import WarehouseTable from "../../components/Warehouse/WarehouseTable";
import DrawerAddNewProduct from "../../components/Warehouse/DrawerAddNewProduct";

import {
  WarehouseIcon,
  PlusCircleIcon,
  WarningOctagonIcon,
} from "@phosphor-icons/react";

const getItemStock = (item) =>
  Number(item.stock?.["Mia Sede"] ?? item.stock ?? 0);

const getItemStockLimit = (item) => Number(item.stockLimit ?? 0);

const isLowStockItem = (item) => getItemStock(item) <= getItemStockLimit(item);

const WarehousePage = () => {
  const dispatch = useDispatch();

  const { t } = useLanguage();
  const { theme } = useTheme();

  // Redux state
  const items = useSelector((state) => state.items.list);
  const userWorkplace = useSelector((state) => state.auth.user?.workplace);
  const userWorkplaceId =
    typeof userWorkplace === "string"
      ? userWorkplace
      : userWorkplace?._id || userWorkplace?.id;

  const textColor = theme === "dark" ? "text-white" : "text-[#090c64]";

  // Fetch items on page load
  useEffect(() => {
    if (userWorkplaceId) {
      dispatch(fetchItems());
    }
  }, [userWorkplaceId, dispatch]);

  // Table columns
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

  const [drawerAddOpen, setDrawerAddOpen] = useState(false);

  // Add product handler
  const handleAddProduct = (newProduct) => {
    dispatch(addItem(newProduct));
  };

  // Filter items by user workplace
  const filteredItems = useMemo(() => {
    if (!items || items.length === 0) return [];

    if (!userWorkplaceId) return items;

    return items.filter((item) => {
      const itemWorkplaceId =
        typeof item.pointOfSales === "string"
          ? item.pointOfSales
          : item.pointOfSales?._id || item.pointOfSales?.id;

      return String(itemWorkplaceId) === String(userWorkplaceId);
    });
  }, [items, userWorkplaceId]);

  const lowStockItems = useMemo(
    () => filteredItems.filter(isLowStockItem),
    [filteredItems]
  );

  const summaryButtons = [
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
  ];

  return (
    <div className="warehouse-page">
      <div className="warehouse-container">

        {/* Summary boxes */}
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
                } ${isPrimary ? "primary" : ""}`}
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

        {/* Warehouse table */}
        <WarehouseTable
          data={filteredItems}
          allItems={items}
          columns={columns}
        />

        {/* Add product drawer */}
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
