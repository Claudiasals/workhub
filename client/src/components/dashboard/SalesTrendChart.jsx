import { useMemo } from "react";
import { Line } from "react-chartjs-2";

import "../../utils/chartSetup";
import { useLanguage } from "../../context/LanguageContext";
import { buildBaseChartOptions } from "../../utils/chartTheme";
import {
  DEFAULT_SALES_TREND_MONTHS,
  SALES_TREND_MONTH_OPTIONS,
  resolveSalesTrendData,
} from "../../utils/salesTrend";

export const SALES_TREND_PERIOD_LABEL_KEYS = {
  3: "venditeFilter3M",
  6: "venditeFilter6M",
  12: "venditeFilter12M",
};

export function SalesTrendPeriodFilters({ value, onChange, t }) {
  return (
    <div
      className="sales-trend-filters"
      role="group"
      aria-label={t("venditePeriodLabel")}
    >
      {SALES_TREND_MONTH_OPTIONS.map((months) => (
        <button
          key={months}
          type="button"
          className={`calendar-view-btn sales-trend-filter-btn${
            value === months ? " active" : ""
          }`}
          aria-pressed={value === months}
          onClick={() => onChange(months)}
        >
          {t(SALES_TREND_PERIOD_LABEL_KEYS[months])}
        </button>
      ))}
    </div>
  );
}

const SalesTrendChart = ({
  orders = [],
  customers = [],
  theme = "light",
  monthsCount = DEFAULT_SALES_TREND_MONTHS,
}) => {
  const { t, lang } = useLanguage();
  const isDark = theme === "dark";

  const { data: trend, isDemo, isEmpty } = useMemo(
    () => resolveSalesTrendData(orders, customers, lang, monthsCount),
    [orders, customers, lang, monthsCount]
  );

  const chartData = useMemo(
    () => ({
      labels: trend.map((bucket) => bucket.label),
      datasets: [
        {
          label: t("venditeImporto"),
          data: trend.map((bucket) => Math.round(bucket.revenue * 100) / 100),
          borderColor: isDark ? "#60a5fa" : "#3B82F6",
          backgroundColor: isDark
            ? "rgba(96,165,250,0.18)"
            : "rgba(59,130,246,0.14)",
          pointBackgroundColor: isDark ? "#60a5fa" : "#3B82F6",
          pointBorderColor: isDark ? "#60a5fa" : "#3B82F6",
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6,
          yAxisID: "y",
        },
        {
          label: t("venditeOrdini"),
          data: trend.map((bucket) => bucket.orders),
          borderColor: isDark ? "#fbbf24" : "#F59E0B",
          backgroundColor: "transparent",
          pointBackgroundColor: isDark ? "#fbbf24" : "#F59E0B",
          pointBorderColor: isDark ? "#fbbf24" : "#F59E0B",
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6,
          yAxisID: "y1",
        },
        {
          label: t("venditeNuoviClienti"),
          data: trend.map((bucket) => bucket.newClients),
          borderColor: isDark ? "#a78bfa" : "#8b5cf6",
          backgroundColor: "transparent",
          pointBackgroundColor: isDark ? "#a78bfa" : "#8b5cf6",
          pointBorderColor: isDark ? "#a78bfa" : "#8b5cf6",
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6,
          yAxisID: "y1",
        },
      ],
    }),
    [trend, t, isDark]
  );

  const options = useMemo(
    () => ({
      ...buildBaseChartOptions({
        theme,
        lang,
        scales: {
          y: {
            type: "linear",
            position: "left",
            ticks: {
              callback: (value) =>
                `€${Number(value).toLocaleString(lang === "it" ? "it-IT" : "en-GB", {
                  maximumFractionDigits: 0,
                })}`,
            },
          },
          y1: {
            type: "linear",
            position: "right",
            ticks: {
              stepSize: 1,
              precision: 0,
            },
            grid: { drawOnChartArea: false },
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label(context) {
                const value = context.parsed.y ?? 0;
                if (context.dataset.yAxisID === "y") {
                  return `${context.dataset.label}: €${value.toLocaleString(
                    lang === "it" ? "it-IT" : "en-GB",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}`;
                }
                return `${context.dataset.label}: ${value}`;
              },
            },
          },
        },
      }),
      layout: {
        padding: { top: 4, right: 8, bottom: 0, left: 4 },
      },
    }),
    [theme, lang]
  );

  const hintMessage = isDemo
    ? t("venditeDemoHint").replace("{months}", String(monthsCount))
    : isEmpty
      ? t("venditeNessunDato").replace("{months}", String(monthsCount))
      : null;

  return (
    <div className="sales-trend-chart-body flex flex-col gap-2 min-w-0">
      {hintMessage ? (
        <p className="text-xs font-semibold opacity-70">{hintMessage}</p>
      ) : null}

      <div className="app-line-chart">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default SalesTrendChart;
