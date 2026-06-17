import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  WarningIcon,
  LightbulbIcon,
  SparkleIcon,
  ArrowRightIcon,
} from "@phosphor-icons/react";
import { AiBadge, AiLoadingIndicator } from "../ai/AiInsightPanel";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";

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
const OVERVIEW_ALERTS_LIMIT_OPS = 3;

const ALERT_URGENCY_ORDER = {
  critical: 0,
  warning: 1,
  info: 2,
  success: 3,
};

function sortAlertsByUrgency(items = []) {
  return [...items].sort((a, b) => {
    const orderA = ALERT_URGENCY_ORDER[a.type] ?? 2;
    const orderB = ALERT_URGENCY_ORDER[b.type] ?? 2;
    return orderA - orderB;
  });
}

function OverviewList({ items, variant, t, initialLimit = OVERVIEW_INITIAL_LIMIT }) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setExpanded(false);
  }, [items?.length, variant, initialLimit]);

  if (!items?.length) {
    return (
      <p className="business-overview-empty">
        {variant === "alert"
          ? t("businessOverviewNoAlerts")
          : t("businessOverviewNoInsights")}
      </p>
    );
  }

  const hasHidden = items.length > initialLimit;
  const visibleItems = expanded
    ? items
    : items.slice(0, initialLimit);
  const visibleSlotCount = expanded
    ? items.length
    : Math.max(1, Math.min(items.length, initialLimit));

  return (
    <div className="business-overview-list-wrap">
      <ul
        className={`business-overview-list${
          expanded ? " business-overview-list--expanded" : ""
        }`}
        style={{ "--overview-visible-count": visibleSlotCount }}
      >
        {visibleItems.map((item, index) => (
            <li
              key={`${item.title}-${index}`}
              className={`business-overview-item ${getUrgencyClass(item, variant)}`}
            >
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
        ))}
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
                String(items.length - initialLimit)
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
  source,
  className = "",
  alertsInitialLimit = OVERVIEW_INITIAL_LIMIT,
  insightsInitialLimit = OVERVIEW_INITIAL_LIMIT,
}) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const textColor = theme === "dark" ? "text-white" : "text-[#090c64]";
  const iconColor = theme === "dark" ? "white" : "#090c64";
  const hasData = Boolean(data?.alerts?.length || data?.insights?.length);
  const showGrid = !error && (!loading || hasData);
  const sortedAlerts = useMemo(
    () => sortAlertsByUrgency(data?.alerts || []),
    [data?.alerts]
  );

  return (
    <section
      className={`app-surface business-overview-panel p-4 min-w-0 w-full ${textColor}${className ? ` ${className}` : ""}`}
    >
      <div className="business-overview-panel__header">
        <div className="panel-header-leading min-w-0 flex-1">
          <SparkleIcon
            size={24}
            weight="duotone"
            color={iconColor}
            className="preserve-icon-size shrink-0"
          />
          <div className="panel-header-leading__text min-w-0">
            <h2 className="text-sm font-bold leading-tight">
              {t("businessOverviewTitle")}
            </h2>
            <p className="text-xs opacity-75 mt-0.5">
              {t("businessOverviewDesc")}
            </p>
          </div>
          <AiBadge source={source} />
        </div>
      </div>

      {loading && !data && <AiLoadingIndicator className="business-overview-loading" />}

      {error && !loading && (
        <p className="business-overview-error">{error}</p>
      )}

      {showGrid && (
        <div className="business-overview-panel__grid">
          <div className="business-overview-panel__column business-overview-panel__column--alerts">
            <h3 className="business-overview-panel__subtitle">
              <WarningIcon size={18} weight="duotone" />
              {t("businessOverviewAlertsTitle")}
            </h3>
            <OverviewList
              items={sortedAlerts}
              variant="alert"
              t={t}
              initialLimit={alertsInitialLimit}
            />
          </div>
          <div className="business-overview-panel__column business-overview-panel__column--insights">
            <h3 className="business-overview-panel__subtitle">
              <LightbulbIcon size={18} weight="duotone" />
              {t("businessOverviewInsightsTitle")}
            </h3>
            <OverviewList
              items={data?.insights}
              variant="insight"
              t={t}
              initialLimit={insightsInitialLimit}
            />
          </div>
        </div>
      )}
    </section>
  );
}

export { OVERVIEW_ALERTS_LIMIT_OPS };
export default BusinessOverviewPanel;
