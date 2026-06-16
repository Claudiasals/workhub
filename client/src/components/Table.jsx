import { useState, useMemo } from "react";
import { useLanguage } from "../context/LanguageContext";

const Table = ({
  data,
  columns,
  columnLabels,
  toolbarTitle,
  customToolbar,
  customToolbarRight,
  actions,
  actionLabel = null,
  onRowClick,
  sortLogic = null,
  variant = "default",
  showSort = true,
  showSearch = true,
  searchTerm: controlledSearchTerm,
  onSearchTermChange,
}) => {
  const { t } = useLanguage();

  // Search query state
  const [internalSearchTerm, setInternalSearchTerm] = useState("");
  const searchTerm = controlledSearchTerm ?? internalSearchTerm;
  const setSearchTerm = onSearchTermChange ?? setInternalSearchTerm;

  // A–Z sorting toggle
  const [sortAZ, setSortAZ] = useState(false);

  // Resolves column header label
  const getColumnLabel = (col) => {
    if (columnLabels && columnLabels[col]) {
      return columnLabels[col];
    }
    return col.charAt(0).toUpperCase() + col.slice(1);
  };

  // Applies search filtering and optional sorting
  const filteredData = useMemo(() => {
    const normalizedQuery = searchTerm
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/\+/g, "");

    let result = data.filter((row) =>
      columns.some((col) => {
        const value = row[col];
        if (value === null || value === undefined) return false;

        const normalizedValue = String(value)
          .toLowerCase()
          .replace(/\s+/g, "")
          .replace(/\+/g, "");

        return normalizedValue.includes(normalizedQuery);
      })
    );

    if (sortAZ && sortLogic) {
      result = [...result].sort(sortLogic);
    } else if (sortAZ && columns.length > 1) {
      const sortColumn = columns[1];
      result = [...result].sort((a, b) =>
        String(a[sortColumn] || "").localeCompare(
          String(b[sortColumn] || "")
        )
      );
    }

    return result;
  }, [searchTerm, data, columns, sortAZ, sortLogic]);

  const isEmbedded = variant === "embedded";
  const showToolbar =
    toolbarTitle || showSort || showSearch || customToolbar || customToolbarRight;

  return (
    <div
      className={`table-container min-w-0 max-w-full ${
        isEmbedded ? "table-container-embedded" : "table-wrapper"
      }`}
    >
      {showToolbar && (
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            {toolbarTitle && (
              <h2 className="table-toolbar-title">
                {toolbarTitle}
              </h2>
            )}

            {showSort && (
              <button
                onClick={() => setSortAZ(!sortAZ)}
                className="table-sort-btn"
              >
                {sortAZ ? t("annullaAZ") : t("ordinaAZ")}
              </button>
            )}

            {customToolbar && customToolbar()}
          </div>

          {showSearch && (
            <div className="table-toolbar-search">
              <input
                type="text"
                placeholder={t("cerca")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="table-search w-full min-w-0"
              />
            </div>
          )}

          {customToolbarRight && (
            <div className="table-toolbar-right">
              {customToolbarRight()}
            </div>
          )}
        </div>
      )}

      <div className="table-scroll-wrapper">
        <table className="table-base">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`
                    ${idx === 0 ? "rounded-l-xl" : ""}
                    ${
                      !actionLabel && idx === columns.length - 1
                        ? "rounded-r-xl"
                        : ""
                    }
                  `}
                >
                  {getColumnLabel(col)}
                </th>
              ))}

              {actionLabel && (
                <th className="rounded-r-xl">
                  {actionLabel}
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {filteredData.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="table-row"
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col, colIndex) => (
                  <td
                    key={colIndex}
                    className={`
                      ${colIndex === 0 ? "rounded-l-xl" : ""}
                      ${
                        !actions &&
                        colIndex === columns.length - 1
                          ? "rounded-r-xl"
                          : ""
                      }
                    `}
                  >
                    {row[col] !== null && row[col] !== undefined
                      ? String(row[col]).charAt(0).toUpperCase() +
                        String(row[col]).slice(1)
                      : "-"}
                  </td>
                ))}

                {actions && actions.length > 0 && (
                  <td className="table-actions">
                    {actions.map((action) => (
                      <button
                        key={action.name}
                        className={`table-action-btn${
                          action.name === "edit" ? " table-action-btn--edit" : ""
                        }${
                          action.name === "delete" ? " table-action-btn--delete" : ""
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          action.onClick?.(row);
                        }}
                      >
                        {action.icon}
                      </button>
                    ))}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredData.length === 0 && (
        <p className="no-results-text">
          {t("nessunRisultatoTrovato")}
        </p>
      )}
    </div>
  );
};

export default Table;
