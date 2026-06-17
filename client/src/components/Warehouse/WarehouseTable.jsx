import { useState, useMemo, useEffect } from "react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { useNavigate } from "react-router-dom";
import DrawerSede from "../Warehouse/DrawerSede.jsx";

import { useSelector, useDispatch } from "react-redux";
import {
  setSelectedCategory,
  setSearchTerm,
  toggleSortAZ,
  toggleLowStockFilter,
} from "../../store/feature/warehouseFiltersSlice";
import { getWorkplaceId } from "../../utils/shiftsCalendar";

const getItemStock = (item) =>
  Number(item.stock?.["Mia Sede"] ?? item.stock ?? 0);

const getItemStockLimit = (item) => Number(item.stockLimit ?? 0);

const isLowStockItem = (item) => getItemStock(item) <= getItemStockLimit(item);

const WarehouseTable = ({
  data,
  allItems,
  columns,
  onAddStock,
  onToggleAi,
  aiPanelOpen = false,
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const dispatch = useDispatch();

  // Selected category filter
  const selectedCategory = useSelector(
    (state) => state.warehouseFilters.selectedCategory
  );

  // Search query filter
  const searchTerm = useSelector(
    (state) => state.warehouseFilters.searchTerm
  );

  // A–Z sorting flag
  const sortAZ = useSelector(
    (state) => state.warehouseFilters.sortAZ
  );

  // Low stock filter flag
  const lowStockFilter = useSelector(
    (state) => state.warehouseFilters.lowStockFilter
  );

  // Logged user's workplace ID
  const authUser = useSelector((state) => state.auth.user);
  const userWorkplaceId = getWorkplaceId(authUser);

  const allCategoriesLabel = t("tutteCategorie");
  const activeCategory = selectedCategory || allCategoriesLabel;

  useEffect(() => {
    if (selectedCategory == null || selectedCategory === "All categories") {
      dispatch(setSelectedCategory(allCategoriesLabel));
    }
  }, [selectedCategory, allCategoriesLabel, dispatch]);

  // Drawer visibility state
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Column labels mapping
  const columnLabels = {
    sku: "SKU",
    product: t("prodotto"),
    category: t("categoria"),
    pointOfSales: t("puntoVendita"),
    stock: t("disponibilita"),
    stockLimit: t("limiteRiordino"),
    promo: t("promo"),
    note: t("note"),
    stato: t("stato"),
  };

  // Available product categories
  const categories = useMemo(() => {
    const names = allItems
      .map((p) => p.product?.category?.name)
      .filter(Boolean);

    return [t("tutteCategorie"), ...new Set(names)];
  }, [allItems, t]);

  // Category name to ID lookup map
  const categoryMap = useMemo(() => {
    const map = new Map();

    allItems.forEach((item) => {
      const cat = item.product?.category;
      if (cat?.name && cat?._id) {
        map.set(cat.name, cat._id);
      }
    });

    return map;
  }, [allItems]);

  // Applies search, category, stock filters and sorting
  const filteredData = useMemo(() => {
    let result = [...data];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          String(p.product?.name || "")
            .toLowerCase()
            .includes(q) ||
          String(p._id).toLowerCase().includes(q)
      );
    }

    if (activeCategory !== allCategoriesLabel) {
      const selectedCategoryId = categoryMap.get(activeCategory);
      if (selectedCategoryId) {
        result = result.filter(
          (p) =>
            String(p.product?.category?._id) ===
            String(selectedCategoryId)
        );
      }
    }

    if (lowStockFilter) {
      result = result.filter(isLowStockItem);
    }

    if (sortAZ) {
      result.sort((a, b) =>
        (a.product?.name || "").localeCompare(
          b.product?.name || ""
        )
      );
    }

    return result;
  }, [
    data,
    searchTerm,
    activeCategory,
    sortAZ,
    lowStockFilter,
    categoryMap,
    allCategoriesLabel,
  ]);

  return (
    <div className="warehouse-wrapper">
      <div className="warehouse-toolbar">
        <div className="warehouse-toolbar-left">
          <h2 className="text-lg font-bold">
            {t("magazzino")}
          </h2>

          <button
            onClick={() => dispatch(toggleSortAZ())}
            className="custom-button text-sm"
          >
            {sortAZ ? t("annullaAZ") : t("ordinaAZ")}
          </button>

          <select
            value={activeCategory}
            onChange={(e) =>
              dispatch(setSelectedCategory(e.target.value))
            }
            className="custom-button text-sm focus:outline-none"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="warehouse-toolbar-search">
          <input
            type="text"
            placeholder={t("cercaIdNomeProdotto")}
            value={searchTerm}
            onChange={(e) =>
              dispatch(setSearchTerm(e.target.value))
            }
            className="warehouse-search"
          />
        </div>

        <div className="warehouse-toolbar-actions">
          {onToggleAi && (
            <button
              type="button"
              onClick={onToggleAi}
              aria-pressed={aiPanelOpen}
              className={`custom-button text-sm${aiPanelOpen ? " is-active" : ""}`}
            >
              {t("aiWarehouseTitle")}
            </button>
          )}

          {onAddStock && (
            <button
              type="button"
              onClick={onAddStock}
              className="custom-button text-sm"
            >
              {t("caricaGiacenza")}
            </button>
          )}

          <button
            onClick={() => dispatch(toggleLowStockFilter())}
            aria-pressed={lowStockFilter}
            className="custom-button text-sm"
          >
            {lowStockFilter
              ? t("mostraTutti")
              : t("articoliInEsaurimento")}
          </button>

          <button
            onClick={() => setDrawerOpen(true)}
            className="custom-button text-sm"
          >
            {t("disponibilitaAltreSedi")}
          </button>
        </div>
      </div>

      <table className="warehouse-table">
        <thead>
          <tr>
            {columns.map((c, i) => (
              <th key={i}>{columnLabels[c]}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {filteredData.map((row, i) => (
            <tr
              key={i}
              onClick={() =>
                navigate(`/product/${row._id}`, {
                  state: row,
                })
              }
            >
              {columns.map((col, j) => {
                if (col === "stato") {
                  const stockVal =
                    getItemStock(row);

                  let text;
                  let style;

                  if (stockVal > 0) {
                    style = "status-ok";
                    text = "Disponibile";
                  } else if (row.outOfProduction) {
                    style = "status-off";
                    text = "Fuori produzione";
                  } else {
                    style = "status-no";
                    text = "Terminato";
                  }

                  return (
                    <td key={j}>
                      <span
                        className={`status-badge ${style}`}
                      >
                        {text}
                      </span>
                    </td>
                  );
                }

                if (col === "stock") {
                  return (
                    <td key={j}>
                      {getItemStock(row)}
                    </td>
                  );
                }

                if (col === "stockLimit") {
                  return (
                    <td key={j}>
                      {getItemStockLimit(row)}
                    </td>
                  );
                }

                if (col === "quantita") {
                  return (
                    <td key={j}>
                      {getItemStock(row)}
                    </td>
                  );
                }

                if (col === "promo") {
                  const promo = row.promo;
                  if (!promo || promo.value == null) {
                    return <td key={j}>—</td>;
                  }

                  return (
                    <td key={j}>
                      {promo.mode === "percentage"
                        ? `${promo.value}%`
                        : `${promo.value}€`}
                    </td>
                  );
                }

                if (col === "sku") {
                  return (
                    <td key={j}>
                      {row.product?.sku || ""}
                    </td>
                  );
                }

                if (col === "product") {
                  return (
                    <td key={j}>
                      {row.product?.name || ""}
                    </td>
                  );
                }

                if (col === "category") {
                  return (
                    <td key={j}>
                      {row.product?.category?.name ||
                        ""}
                    </td>
                  );
                }

                if (col === "pointOfSales") {
                  return (
                    <td key={j}>
                      {row.pointOfSales?.name || ""}
                    </td>
                  );
                }

                return (
                  <td key={j}>
                    {String(row[col] ?? "")}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {data.length === 0 && (
        <p className="warehouse-empty">
          Nessun prodotto disponibile.
        </p>
      )}

      {data.length > 0 && filteredData.length === 0 && (
        <p className="warehouse-empty">
          Nessun risultato trovato.
        </p>
      )}

      <DrawerSede
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        productData={allItems}
        userWorkplaceId={userWorkplaceId}
      />
    </div>
  );
};

export default WarehouseTable;
