import {
  ChartLineUpIcon,
  ChartPieSliceIcon,
  LightbulbIcon,
  TagIcon,
  UsersThreeIcon,
  WarningIcon,
} from "@phosphor-icons/react";
import { AiLoadingIndicator } from "../ai/AiInsightPanel";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";

const iconMap = {
  success: ChartLineUpIcon,
  warning: WarningIcon,
  critical: WarningIcon,
  info: UsersThreeIcon,
  promo: TagIcon,
};

const classMap = {
  success: "business-overview-item--urgency-normale",
  warning: "business-overview-item--urgency-media",
  critical: "business-overview-item--urgency-alta",
  info: "business-overview-item--urgency-bassa",
  promo: "business-overview-item--urgency-normale",
};

function InsightList({ items = [] }) {
  const { t } = useLanguage();

  if (!items.length) {
    return (
      <p className="business-overview-empty">{t("customerPortfolioNoInsights")}</p>
    );
  }

  return (
    <ul className="business-overview-list business-overview-list--expanded customer-portfolio-insights">
      {items.map((item, index) => {
        const Icon = iconMap[item.type] || LightbulbIcon;
        return (
          <li
            key={`${item.title}-${index}`}
            className={`business-overview-item ${classMap[item.type] || classMap.info}`}
          >
            <span className="business-overview-item__icon" aria-hidden="true">
              <Icon size={16} weight="duotone" />
            </span>
            <div className="business-overview-item__body">
              <p className="business-overview-item__title">{item.title}</p>
              {item.description ? (
                <p className="business-overview-item__desc">{item.description}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function CustomerPortfolioInsightsPanel({ data, loading = false, className = "" }) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const textColor = theme === "dark" ? "text-white" : "text-[#090c64]";
  const iconColor = theme === "dark" ? "white" : "#090c64";
  const hasData = Boolean(data?.insights?.length);

  return (
    <section
      className={`app-surface customer-portfolio-panel customer-portfolio-panel--insights p-4 min-w-0 w-full h-full ${textColor}${className ? ` ${className}` : ""}`}
    >
      <div className="business-overview-panel__header">
        <div className="panel-header-leading min-w-0">
          <ChartPieSliceIcon
            size={24}
            weight="duotone"
            color={iconColor}
            className="preserve-icon-size shrink-0"
          />
          <div className="panel-header-leading__text min-w-0">
            <h2 className="text-sm font-bold leading-tight">
              {t("customerPortfolioInsightsTitle")}
            </h2>
            <p className="customer-portfolio-panel__desc">
              {t("customerPortfolioInsightsDesc")}
            </p>
          </div>
        </div>
      </div>

      {loading && !hasData ? (
        <AiLoadingIndicator className="business-overview-loading" />
      ) : null}

      {hasData ? (
        <div className="customer-portfolio-panel__section">
          <h3 className="customer-portfolio-panel__subtitle">
            {t("customerPortfolioHealthTitle")}
          </h3>
          <InsightList items={data?.insights} />
        </div>
      ) : null}
    </section>
  );
}

export default CustomerPortfolioInsightsPanel;
