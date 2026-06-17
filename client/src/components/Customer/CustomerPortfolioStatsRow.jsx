import {
  ChartLineUpIcon,
  CrownIcon,
  UserPlusIcon,
  UsersThreeIcon,
  WarningIcon,
} from "@phosphor-icons/react";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";

export function CustomerPortfolioStatsRow({ database }) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const textColor = theme === "dark" ? "text-white" : "text-[#090c64]";
  const iconColor = theme === "dark" ? "white" : "#090c64";

  if (!database) return null;

  const stats = [
    {
      icon: UsersThreeIcon,
      label: t("customerPortfolioStatTotal"),
      value: database.total,
    },
    {
      icon: UserPlusIcon,
      label: t("customerPortfolioStatNewQuarter"),
      value: database.newLastQuarter,
    },
    {
      icon: ChartLineUpIcon,
      label: t("customerPortfolioStatRecurring"),
      value: database.recurring,
    },
    {
      icon: WarningIcon,
      label: t("customerPortfolioStatInactive"),
      value: database.inactive,
    },
    {
      icon: CrownIcon,
      label: t("customerPortfolioStatPremium"),
      value: database.premium,
    },
  ];

  return (
    <section className="employee-stats-grid customer-portfolio-stats-row">
      {stats.map(({ icon: Icon, label, value }) => (
        <div
          key={label}
          className={`app-surface page-info-box ${textColor}`}
        >
          <span className="employee-stat-label">
            <Icon size={24} color={iconColor} weight="duotone" aria-hidden="true" />
            <span>{label}</span>
          </span>
          <span className="employee-stat-value font-semibold">{value}</span>
        </div>
      ))}
    </section>
  );
}

export default CustomerPortfolioStatsRow;
