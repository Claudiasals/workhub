import React, { useState, useMemo } from "react";
import { useLanguage } from "../../context/LanguageContext.jsx";

// Formats numeric values as EUR currency
const formatEuro = (value) => {
  if (value === null || value === undefined || isNaN(value)) return "-";
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(Number(value));
};

const OrdersTable = ({
  data,
  columns,
  columnsLabels = {},
  customToolbar,
  actions,
  actionLabel = null,
  onRowClick,
}) => {
  // Search filter state
  const [searchTerm, setSearchTerm] = useState("");

  // A–Z sorting toggle
  const [sortAZ, setSortAZ] = useState(false);

  // Expanded row identifier
  const [openRowId, setOpenRowId] = useState(null);

  const { t } = useLanguage();

  // Applies search filtering and optional sorting
  const filteredData = useMemo(() => {
    const query = searchTerm.toLowerCase();

    let result = data.filter((row) =>
      columns.some((col) => {
        const value = row[col];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(query);
      })
    );

    if (sortAZ && columns.length > 1) {
      const sortColumn = columns[1];
      result = [...result].sort((a, b) =>
        String(a[sortColumn] || "").localeCompare(
          String(b[sortColumn] || "")
        )
      );
    }

    return result;
  }, [searchTerm, data, columns, sortAZ]);

  // Columns requiring centered alignment
  const centeredCols = [
    "quantità totale",
    "data",
    "stato",
    "corriere",
    "totale",
  ];

  return (
    <div className="table-container">
      <div className="table-toolbar">
        <div className="table-toolbar-left">
          <h2 className="text-lg font-bold">
            {t("ordiniTitolo")}
          </h2>

          <button
            onClick={() => setSortAZ(!sortAZ)}
            className="table-sort-btn"
          >
            {sortAZ ? t("annullaAZ") : t("ordinaAZ")}
          </button>
        </div>

        <div className="table-toolbar-search">
          <input
            type="text"
            placeholder="Cerca..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="table-search"
          />
        </div>

        {customToolbar && (
          <div className="table-toolbar-right">
            {customToolbar}
          </div>
        )}
      </div>

      <div className="table-scroll-wrapper">
        <table className="table-base orders-table-base">
          <thead>
            <tr>
              {columns.map((item, idx) => {
                const isCentered = centeredCols.includes(item);
                return (
                  <th
                    key={idx}
                    className={`
                      ${idx === 0 ? "rounded-l-xl" : ""}
                      ${
                        !actionLabel && idx === columns.length - 1
                          ? "rounded-r-xl"
                          : ""
                      }
                      ${
                        isCentered
                          ? "orders-cell-center"
                          : "orders-cell-left"
                    }`}
                  >
                    {columnsLabels[item] ?? t(item)}
                  </th>
                );
              })}

              {actionLabel && (
                <th className="rounded-r-xl orders-cell-center">
                  {actionLabel}
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {filteredData.map((row) => {
              const isOpen = openRowId === row._id;
              const totalColumns =
                columns.length + (actions && actions.length > 0 ? 1 : 0);
              const toggleRow = () => {
                setOpenRowId(isOpen ? null : row._id);
                if (onRowClick) onRowClick(row);
              };

              return (
                <React.Fragment key={row._id}>
                  <tr className="table-row" onClick={toggleRow}>
                    {columns.map((col, j) => {
                      if (col === "stato") {
                        return (
                          <td key={j} className="orders-cell-center">
                            {row.stato || "-"}
                          </td>
                        );
                      }

                      if (col === "corriere") {
                        return (
                          <td key={j} className="orders-cell-center">
                            {row.corriere || "-"}
                          </td>
                        );
                      }

                      if (col === "prodotto") {
                        return (
                          <td key={j} className="orders-cell-left">
                            <div className="flex items-center gap-3">
                              <span
                                className={`cursor-pointer text-base transition-transform ${
                                  isOpen ? "rotate-180" : ""
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleRow();
                                }}
                              >
                                ⌵
                              </span>
                              <span>{row.prodotto}</span>
                            </div>
                          </td>
                        );
                      }

                      if (col === "totale") {
                        return (
                          <td key={j} className="orders-cell-center">
                            {formatEuro(row.totale)}
                          </td>
                        );
                      }

                      const centered = centeredCols.includes(col);
                      return (
                        <td
                          key={j}
                          className={`${
                            centered
                              ? "orders-cell-center"
                              : "orders-cell-left"
                          }`}
                        >
                          {row[col] ?? "-"}
                        </td>
                      );
                    })}

                    {actions && actions.length > 0 && (
                      <td className="table-actions orders-cell-center">
                        {actions.map((action) => (
                          <button
                            key={action.name}
                            className="table-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              action.onClick(row);
                            }}
                          >
                            {action.icon}
                          </button>
                        ))}
                      </td>
                    )}
                  </tr>

                  {isOpen && (
                    <tr>
                      <td
                        colSpan={totalColumns}
                        className="orders-details-cell text-sm md:text-base"
                      >
                        <div className="flex flex-col gap-6 p-4">
                          <div className="flex gap-6">
                            <div className="shrink-0 flex justify-center md:justify-start">
                              {row.prodottoDettaglio?.image && (
                                <img
                                  src={row.prodottoDettaglio.image}
                                  alt={
                                    row.prodottoDettaglio.name ||
                                    "Immagine prodotto"
                                  }
                                  className="max-w-[140px] rounded-xl object-cover shadow-md border border-white/40 bg-white/40"
                                />
                              )}
                            </div>

                            <div className="flex-1 flex justify-between items-start mt-3">
                              <div className="flex-1">
                                <h3 className="font-bold text-sm md:text-base">
                                  {t("prodottoDettagli")}
                                </h3>

                                <p className="text-sm md:text-base font-semibold">
                                  {row.prodottoDettaglio?.name ||
                                    row.prodotto}
                                </p>

                                {row.prodottoDettaglio?.description && (
                                  <p className="text-xs md:text-sm mt-1">
                                    {row.prodottoDettaglio.description}
                                  </p>
                                )}
                              </div>

                              <div className="text-right">
                                <p className="text-sm md:text-base font-semibold whitespace-nowrap">
                                  {t("prezzoUnitario")}:{" "}
                                  {row.prodottoDettaglio?.price
                                    ? formatEuro(
                                        row.prodottoDettaglio.price
                                      )
                                    : "-"}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            <h4 className="text-md font-semibold">
                              {t("clienteDettagli")} (
                              {row.clienti.length})
                            </h4>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {row.clienti.map((cliente) => (
                              <div
                                key={cliente._id}
                                className="rounded-2xl bg-[rgba(255,255,255,0.15)] border border-white/20 backdrop-blur-lg p-4 shadow-sm text-sm md:text-base flex flex-col gap-1"
                              >
                                <p className="font-bold">
                                  {cliente.firstName}{" "}
                                  {cliente.lastName}
                                </p>

                                <p className="text-xs md:text-sm">
                                  {cliente.email}
                                </p>

                                {cliente.phoneNumber && (
                                  <p className="text-xs md:text-sm">
                                    {t("tel")}:{" "}
                                    {cliente.phoneNumber}
                                  </p>
                                )}

                                {cliente.location && (
                                  <p className="text-xs md:text-sm">
                                    {cliente.location.address},{" "}
                                    {cliente.location.city}{" "}
                                    {cliente.location.zipCode}
                                  </p>
                                )}

                                <div className="flex justify-between mt-3 items-center text-xs md:text-sm">
                                  <div className="flex items-center gap-2">
                                    <span>Qty:</span>
                                    <strong>{cliente.qty}</strong>
                                  </div>
                                  <span>
                                    Tot:{" "}
                                    <strong>
                                      {formatEuro(cliente.totale)}
                                    </strong>
                                  </span>
                                </div>

                                <div className="mt-3 pt-3 border-t border-white/30 text-md flex flex-col gap-1">
                                  <div className="flex justify-between font-bold">
                                    <span>
                                      {t("puntiOrdine")}:
                                    </span>
                                    <span>
                                      +{cliente.puntiOrdine ?? 0}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {(() => {
                            const totalQuantity =
                              Number(row["quantità totale"]) || 0;

                            const totClientQty = Array.isArray(
                              row.clienti
                            )
                              ? row.clienti.reduce(
                                  (sum, c) =>
                                    sum + (Number(c.qty) || 0),
                                  0
                                )
                              : 0;

                            const giacenza =
                              totalQuantity - totClientQty;

                            return (
                              <div className="mt-4 flex flex-wrap gap-4 justify-end text-md">
                                <div>
                                  <span className="font-semibold">
                                    {t(
                                      "totaleOrdinatoClienti"
                                    )}
                                    :{" "}
                                  </span>
                                  <span>{totClientQty}</span>
                                </div>

                                <div>
                                  <span className="font-semibold">
                                    {t(
                                      "quantitaTotaleProdotto"
                                    )}
                                    :{" "}
                                  </span>
                                  <span>{totalQuantity}</span>
                                </div>

                                <div>
                                  <span className="font-semibold">
                                    {t(
                                      "giacenzaDisponibile"
                                    )}
                                    :{" "}
                                  </span>
                                  <span>{giacenza}</span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrdersTable;
