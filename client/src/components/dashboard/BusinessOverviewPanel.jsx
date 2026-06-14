import { Link } from "react-router-dom";
import {
  WarningCircleIcon,
  WarningIcon,
  InfoIcon,
  LightbulbIcon,
  SparkleIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from "@phosphor-icons/react";
import { AiBadge, AiLoadingIndicator } from "../ai/AiInsightPanel";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";

const alertIconMap = {
  critical: WarningCircleIcon,
  warning: WarningIcon,
  info: InfoIcon,
  success: CheckCircleIcon,
};

const alertClassMap = {
  critical: "business-overview-item--critical",
  warning: "business-overview-item--warning",
  info: "business-overview-item--info",
  success: "business-overview-item--success",
};

const areaClassMap = {
  magazzino: "business-overview-area--warehouse",
  ticket: "business-overview-area--ticket",
  vendite: "business-overview-area--sales",
  clienti: "business-overview-area--customers",
  turni: "business-overview-area--shifts",
};

function OverviewList({ items, variant, t }) {
  if (!items?.length) {
    return (
      <p className="business-overview-empty">
        {variant === "alert"
          ? t("businessOverviewNoAlerts")
          : t("businessOverviewNoInsights")}
      </p>
    );
  }

  return (
    <ul className="business-overview-list">
      {items.map((item, index) => {
        const Icon =
          variant === "alert"
            ? alertIconMap[item.type] || InfoIcon
            : LightbulbIcon;

        return (
          <li
            key={`${item.title}-${index}`}
            className={`business-overview-item ${
              variant === "alert"
                ? alertClassMap[item.type] || alertClassMap.info
                : "business-overview-item--insight"
            }`}
          >
            <span className="business-overview-item__icon" aria-hidden="true">
              <Icon size={20} weight="duotone" />
            </span>
            <div className="business-overview-item__body">
              <div className="business-overview-item__meta">
                {item.area && (
                  <span
                    className={`business-overview-area ${
                      areaClassMap[item.area] || ""
                    }`}
                  >
                    {t(`businessOverviewArea_${item.area}`) || item.area}
                  </span>
                )}
              </div>
              <p className="business-overview-item__title">{item.title}</p>
              <p className="business-overview-item__desc">{item.description}</p>
              {item.actionLabel && item.targetRoute && (
                <Link
                  to={item.targetRoute}
                  className="business-overview-action"
                >
                  {item.actionLabel}
                  <ArrowRightIcon size={14} weight="bold" />
                </Link>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function BusinessOverviewPanel({
  data,
  loading = false,
  error = "",
  onRefresh,
  source,
  offlineHint = false,
  className = "",
}) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const textColor = theme === "dark" ? "text-white" : "text-[#090c64]";
  const iconColor = theme === "dark" ? "white" : "#090c64";
  const hasData = Boolean(data?.alerts?.length || data?.insights?.length);
  const showGrid = !error && (!loading || hasData);

  return (
    <section
      className={`app-surface business-overview-panel p-4 min-w-0 w-full ${textColor}${className ? ` ${className}` : ""}`}
    >
      <div className="business-overview-panel__header">
        <div className="flex items-center gap-3 min-w-0">
          <SparkleIcon
            size={24}
            weight="duotone"
            color={iconColor}
            className="preserve-icon-size shrink-0"
          />
          <div className="min-w-0">
            <h2 className="text-sm font-bold leading-tight">
              {t("businessOverviewTitle")}
            </h2>
            <p className="text-xs opacity-75 mt-0.5">
              {t("businessOverviewDesc")}
            </p>
          </div>
          <AiBadge source={source} />
        </div>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="custom-button shrink-0 whitespace-nowrap text-sm"
          >
            {t("aiRefresh")}
          </button>
        )}
      </div>

      {loading && !data && <AiLoadingIndicator className="business-overview-loading" />}

      {offlineHint && !loading && (
        <p className="business-overview-offline-hint">{t("businessOverviewOffline")}</p>
      )}

      {error && !loading && (
        <p className="business-overview-error">{error}</p>
      )}

      {showGrid && (
        <div className="business-overview-panel__grid">
          <div className="business-overview-panel__column">
            <h3 className="business-overview-panel__subtitle">
              <WarningIcon size={18} weight="duotone" />
              {t("businessOverviewAlertsTitle")}
            </h3>
            <OverviewList items={data?.alerts} variant="alert" t={t} />
          </div>
          <div className="business-overview-panel__column">
            <h3 className="business-overview-panel__subtitle">
              <LightbulbIcon size={18} weight="duotone" />
              {t("businessOverviewInsightsTitle")}
            </h3>
            <OverviewList items={data?.insights} variant="insight" t={t} />
          </div>
        </div>
      )}
    </section>
  );
}

export default BusinessOverviewPanel;
