import { Chart } from "chart.js";

export const getChartTheme = (theme = "light") => {
  const isDark = theme === "dark";

  return {
    isDark,
    textColor: isDark ? "#ffffff" : "#090c64",
    gridColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(9,12,100,0.12)",
    tooltipBackground: isDark ? "rgba(90,74,122,0.96)" : "#ffffff",
    tooltipTitleColor: isDark ? "#ffffff" : "#090c64",
    tooltipBodyColor: isDark ? "#ffffff" : "#090c64",
    tooltipBorderColor: isDark
      ? "rgba(255,255,255,0.22)"
      : "rgba(9,12,100,0.12)",
  };
};

const buildLegendLabels = (chart, textColor) =>
  Chart.defaults.plugins.legend.labels.generateLabels(chart).map((item) => {
    const dataset = chart.data.datasets[item.datasetIndex];
    if (!dataset) return item;

    const color =
      (typeof dataset.pointBackgroundColor === "string" &&
        dataset.pointBackgroundColor) ||
      (typeof dataset.borderColor === "string" && dataset.borderColor) ||
      (typeof dataset.backgroundColor === "string" &&
      dataset.backgroundColor !== "transparent"
        ? dataset.backgroundColor
        : undefined);

    if (color) {
      item.fillStyle = color;
      item.strokeStyle = color;
      item.lineWidth = 0;
    }

    item.fontColor = textColor;
    return item;
  });

export const buildBaseChartOptions = ({
  theme = "light",
  lang = "it",
  onPointClick,
  scales = {},
  plugins = {},
}) => {
  const {
    textColor,
    gridColor,
    tooltipBackground,
    tooltipTitleColor,
    tooltipBodyColor,
    tooltipBorderColor,
  } = getChartTheme(theme);

  const locale = lang === "it" ? "it-IT" : "en-GB";

  const baseScales = {
    x: {
      ticks: {
        color: textColor,
        font: { family: "Nunito", weight: "600", size: 11 },
        maxRotation: 0,
      },
      grid: { color: gridColor },
      ...(scales.x || {}),
    },
    y: {
      ticks: {
        color: textColor,
        font: { family: "Nunito", weight: "600", size: 11 },
        ...(scales.y?.ticks || {}),
      },
      grid: { color: gridColor },
      ...(scales.y || {}),
    },
  };

  if (scales.y1) {
    baseScales.y1 = {
      ticks: {
        color: textColor,
        font: { family: "Nunito", weight: "600", size: 11 },
        ...(scales.y1.ticks || {}),
      },
      grid: { drawOnChartArea: false, ...(scales.y1.grid || {}) },
      ...scales.y1,
    };
  }

  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    onClick: onPointClick
      ? (_event, elements, chart) => {
          if (!elements.length) return;
          const index = elements[0].index;
          const label = chart.data.labels[index];
          onPointClick(label, index);
        }
      : undefined,
    plugins: {
      legend: {
        labels: {
          color: textColor,
          font: { family: "Nunito", weight: "700", size: 12 },
          usePointStyle: true,
          pointStyle: "circle",
          boxWidth: 8,
          boxHeight: 8,
          padding: 16,
          generateLabels: (chart) => buildLegendLabels(chart, textColor),
        },
      },
      tooltip: {
        backgroundColor: tooltipBackground,
        titleColor: tooltipTitleColor,
        bodyColor: tooltipBodyColor,
        borderColor: tooltipBorderColor,
        borderWidth: 1,
        padding: 12,
        titleFont: { family: "Nunito", weight: "800" },
        bodyFont: { family: "Nunito", weight: "600" },
      },
      ...plugins,
    },
    scales: baseScales,
    locale,
  };
};
