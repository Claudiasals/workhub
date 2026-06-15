import {
  ChartLineUpIcon,
  ShoppingCartSimpleIcon,
  TicketIcon,
  WarningOctagonIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";

const formatCurrency = (value) =>
  new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);

export function DashboardKpiRow({
  revenue = 0,
  ordersCount = 0,
  openTickets = 0,
  criticalStock = 0,
  staffOnShift = 0,
  isAdmin = true,
}) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const textColor = theme === "dark" ? "text-white" : "text-[#090c64]";
  const iconColor = theme === "dark" ? "white" : "#090c64";

  const allKpis = [
    {
      icon: ChartLineUpIcon,
      label: t("dashboardKpiSales"),
      value: formatCurrency(revenue),
      show: true,
    },
    {
      icon: ShoppingCartSimpleIcon,
      label: t("dashboardKpiOrders"),
      value: ordersCount,
      show: true,
    },
    {
      icon: TicketIcon,
      label: t("dashboardKpiTickets"),
      value: openTickets,
      show: isAdmin,
    },
    {
      icon: WarningOctagonIcon,
      label: t("dashboardKpiCriticalStock"),
      value: criticalStock,
      show: isAdmin,
    },
    {
      icon: UsersThreeIcon,
      label: isAdmin ? t("dashboardKpiStaffOnShift") : t("dashboardKpiMyShift"),
      value: staffOnShift,
      show: true,
    },
  ];

  const kpis = allKpis.filter((k) => k.show);

  return (
    <div className="dashboard-kpi-grid">
      {kpis.map(({ icon: Icon, label, value }) => (
        <div
          key={label}
          className={`warehouse-summary-btn disabled ${textColor}`}
        >
          <span className="warehouse-summary-label">
            <Icon size={24} color={iconColor} weight="duotone" />
            <span>{label}</span>
          </span>
          <span className="warehouse-summary-value">
            <span>{value}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

export default DashboardKpiRow;
