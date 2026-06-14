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
      tone: "sales",
      show: true,
    },
    {
      icon: ShoppingCartSimpleIcon,
      label: t("dashboardKpiOrders"),
      value: ordersCount,
      tone: "orders",
      show: true,
    },
    {
      icon: TicketIcon,
      label: t("dashboardKpiTickets"),
      value: openTickets,
      tone: "tickets",
      show: isAdmin,
    },
    {
      icon: WarningOctagonIcon,
      label: t("dashboardKpiCriticalStock"),
      value: criticalStock,
      tone: criticalStock > 0 ? "critical" : "neutral",
      show: isAdmin,
    },
    {
      icon: UsersThreeIcon,
      label: isAdmin ? t("dashboardKpiStaffOnShift") : t("dashboardKpiMyShift"),
      value: staffOnShift,
      tone: "staff",
      show: true,
    },
  ];

  const kpis = allKpis.filter((k) => k.show);

  return (
    <div className="dashboard-kpi-grid">
      {kpis.map(({ icon: Icon, label, value, tone }) => (
        <div
          key={label}
          className={`dashboard-kpi-card dashboard-kpi-card--${tone} app-surface ${textColor}`}
        >
          <div className="dashboard-kpi-card__icon">
            <Icon size={22} color={iconColor} weight="duotone" />
          </div>
          <div className="dashboard-kpi-card__body">
            <span className="dashboard-kpi-card__label">{label}</span>
            <span className="dashboard-kpi-card__value">{value}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default DashboardKpiRow;
