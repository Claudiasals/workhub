import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
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

const urgencyClassMap = {
  critical: "business-overview-item--urgency-alta",
  warning: "business-overview-item--urgency-media",
  info: "business-overview-item--urgency-bassa",
  success: "business-overview-item--urgency-normale",
};

function getUrgencyClass(item, variant) {
  if (item.type && urgencyClassMap[item.type]) {
    return urgencyClassMap[item.type];
  }

  return variant === "insight"
    ? urgencyClassMap.success
    : urgencyClassMap.info;
}

const areaClassMap = {
  magazzino: "business-overview-area--warehouse",
  ticket: "business-overview-area--ticket",
  vendite: "business-overview-area--sales",
  clienti: "business-overview-area--customers",
  turni: "business-overview-area--shifts",
};

const AREA_ROUTES = {
  magazzino: "/warehouse",
  ticket: "/ticket",
  vendite: "/orders",
  clienti: "/customers",
  turni: "/personale",
};

function getAreaActionLabel(item, t) {
  if (!item.area) return item.actionLabel || null;

  const key = `businessOverviewAction_${item.area}`;
  const translated = t(key);
  if (translated !== key) return translated;

  return item.actionLabel || null;
}

function getAreaActionRoute(item) {
  return item.targetRoute || AREA_ROUTES[item.area] || null;
}

const OVERVIEW_INITIAL_LIMIT = 2;

function OverviewList({ items, variant, t }) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setExpanded(false);
  }, [items?.length, variant]);

  if (!items?.length) {
    return (
      <p className="business-overview-empty">
        {variant === "alert"
          ? t("businessOverviewNoAlerts")
          : t("businessOverviewNoInsights")}
      </p>
    );
  }

  const hasHidden = items.length > OVERVIEW_INITIAL_LIMIT;
  const visibleItems = expanded
    ? items
    : items.slice(0, OVERVIEW_INITIAL_LIMIT);

  return (
    <div className="business-overview-list-wrap">
      <ul
        className={`business-overview-list${
          expanded ? " business-overview-list--expanded" : ""
        }`}
      >
        {visibleItems.map((item, index) => {
          const Icon =
            variant === "alert"
              ? alertIconMap[item.type] || InfoIcon
              : LightbulbIcon;

          return (
            <li
              key={`${item.title}-${index}`}
              className={`business-overview-item ${getUrgencyClass(item, variant)}`}
            >
              <span className="business-overview-item__icon" aria-hidden="true">
                <Icon size={16} weight="duotone" />
              </span>
              <div className="business-overview-item__body">
                {item.area ? (
                  <div className="business-overview-item__meta">
                    <span
                      className={`business-overview-area ${
                        areaClassMap[item.area] || ""
                      }`}
                    >
                      {t(`businessOverviewArea_${item.area}`) || item.area}
                    </span>
                    {getAreaActionRoute(item) && getAreaActionLabel(item, t) ? (
                      <Link
                        to={getAreaActionRoute(item)}
                        className="business-overview-action"
                      >
                        {getAreaActionLabel(item, t)}
                        <ArrowRightIcon size={12} weight="bold" />
                      </Link>
                    ) : null}
                  </div>
                ) : null}
                <p className="business-overview-item__title">{item.title}</p>
                {item.description ? (
                  <p className="business-overview-item__desc">{item.description}</p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      {hasHidden ? (
        <button
          type="button"
          className="ai-alert-toggle"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
        >
          {expanded
            ? t("aiShowLess")
            : t("aiShowMore").replace(
                "{count}",
                String(items.length - OVERVIEW_INITIAL_LIMIT)
              )}
        </button>
      ) : null}
    </div>
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
