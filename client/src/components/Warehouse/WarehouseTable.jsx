import { useState, useMemo } from "react";
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

const WarehouseTable = ({ data, allItems, columns }) => {
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
  const userWorkplaceId = useSelector(
    (state) => state.auth.user?.workplace?._id
  );

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

    if (selectedCategory !== t("tutteCategorie")) {
      const selectedCategoryId = categoryMap.get(selectedCategory);
      if (selectedCategoryId) {
        result = result.filter(
          (p) =>
            String(p.product?.category?._id) ===
            String(selectedCategoryId)
        );
      }
    }

    if (lowStockFilter) {
      result = result.filter(
        (p) => (p.stock?.["Mia Sede"] || p.stock || 0) < 15
      );
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
    selectedCategory,
    sortAZ,
    lowStockFilter,
    categoryMap,
    t,
  ]);

  return (
    <div className="warehouse-wrapper">
      <div className="warehouse-toolbar">
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
          value={selectedCategory}
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

        <input
          type="text"
          placeholder={t("cercaIdNomeProdotto")}
          value={searchTerm}
          onChange={(e) =>
            dispatch(setSearchTerm(e.target.value))
          }
          className="warehouse-search"
        />

        <button
          onClick={() => dispatch(toggleLowStockFilter())}
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
                    row.stock?.["Mia Sede"] || row.stock || 0;

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
                    text = "Non disponibile";
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

                if (col === "quantita") {
                  return (
                    <td key={j}>
                      {row.stock?.["Mia Sede"] ||
                        row.stock ||
                        0}
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
