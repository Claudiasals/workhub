import { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { fetchItems, addItem } from "../../store/feature/itemsSlice";
import { useTheme } from "../../context/ThemeContext.jsx";

import WarehouseTable from "../../components/Warehouse/WarehouseTable";
import DrawerAddNewProduct from "../../components/Warehouse/DrawerAddNewProduct";

import { WarehouseIcon, PlusCircleIcon } from "@phosphor-icons/react";

const WarehousePage = () => {
  const dispatch = useDispatch();

  const { t } = useLanguage();
  const { theme } = useTheme();

  // Redux state
  const items = useSelector((state) => state.items.list);
  const userWorkplaceId = useSelector(
    (state) => state.auth.user?.workplace?._id
  );

  const textColor = theme === "dark" ? "text-white" : "text-[#090c64]";

  // Fetch items on page load
  useEffect(() => {
    if (userWorkplaceId) {
      dispatch(fetchItems(userWorkplaceId));
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

  // Summary buttons config
  const summaryButtons = [
    {
      label: t("totArticoli"),
      number: items.length,
      icon: (
        <WarehouseIcon
          size={32}
          color={theme === "dark" ? "white" : "#090c64"}
          weight="duotone"
        />
      ),
      clickable: false,
    },
    {
      label: t("caricaGiacenza"),
      icon: (
        <PlusCircleIcon
          size={32}
          color={theme === "dark" ? "white" : "#090c64"}
          weight="duotone"
        />
      ),
      clickable: true,
      onClick: () => setDrawerAddOpen(true),
    },
  ];

  // Add product handler
  const handleAddProduct = (newProduct) => {
    dispatch(addItem(newProduct));
  };

  // Filter items by user workplace
  const filteredItems = useMemo(() => {
    if (!items || items.length === 0) return [];

    if (!userWorkplaceId) return items;

    return items.filter(
      (item) =>
        item.pointOfSales &&
        String(item.pointOfSales._id) === String(userWorkplaceId)
    );
  }, [items, userWorkplaceId]);

  return (
    <div className="warehouse-page">
      <div className="warehouse-container">

        {/* Summary boxes */}
        <div className="warehouse-summary">
          {summaryButtons.map((btn, index) => (
            <button
              key={index}
              disabled={!btn.clickable}
              onClick={btn.onClick}
              className={`warehouse-summary-btn ${
                btn.clickable ? "clickable" : "disabled"
              }`}
            >
              {btn.icon}
              <span className="inline-flex items-baseline gap-2">
                <span className={`font-bold ${textColor}`}>
                  {btn.label}
                </span>
                {btn.number !== undefined && (
                  <span className={`text-sm opacity-70 ${textColor}`}>
                    {btn.number}
                  </span>
                )}
              </span>
            </button>
          ))}
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
