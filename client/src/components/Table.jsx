import { useState, useMemo } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";

const Table = ({
  data,
  columns,
  columnLabels,
  customToolbar,
  actions,
  actionLabel = null,
  onRowClick,
  sortLogic = null,
}) => {
  const { t } = useLanguage();
  const { theme } = useTheme();

  // Search query state
  const [searchTerm, setSearchTerm] = useState("");

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

  return (
    <div className="table-container table-wrapper">
      <div className="table-toolbar">
        <div className="table-toolbar-left">
          <button
            onClick={() => setSortAZ(!sortAZ)}
            className="table-sort-btn"
          >
            {sortAZ ? t("annullaAZ") : t("ordinaAZ")}
          </button>

          {customToolbar && customToolbar()}
        </div>

        <input
          type="text"
          placeholder={t("cerca")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="table-search"
        />
      </div>

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
                        className="table-action-btn"
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
