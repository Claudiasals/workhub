import { useMemo } from "react";
import { Line } from "react-chartjs-2";

import "../../utils/chartSetup";
import { useLanguage } from "../../context/LanguageContext";
import { buildBaseChartOptions } from "../../utils/chartTheme";
import { resolveSalesTrendData } from "../../utils/salesTrend";

const SalesTrendChart = ({ orders = [], customers = [], theme = "light" }) => {
  const { t, lang } = useLanguage();
  const isDark = theme === "dark";

  const { data: trend, isDemo } = useMemo(
    () => resolveSalesTrendData(orders, customers, lang),
    [orders, customers, lang]
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
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6,
          yAxisID: "y1",
        },
        {
          label: t("venditeNuoviClienti"),
          data: trend.map((bucket) => bucket.newClients),
          borderColor: isDark ? "#4ade80" : "#22C55E",
          backgroundColor: "transparent",
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
    () =>
      buildBaseChartOptions({
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
    [theme, lang]
  );

  return (
    <div className="flex flex-col gap-2 min-w-0">
      {isDemo && (
        <p className="text-xs font-semibold opacity-70">{t("venditeDemoHint")}</p>
      )}
      <div className="app-line-chart">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default SalesTrendChart;
