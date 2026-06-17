import { Link } from "react-router-dom";
import {
  ChartLineUpIcon,
  WarningCircleIcon,
  WarningIcon,
  LightbulbIcon,
  SparkleIcon,
  TagIcon,
  UsersThreeIcon,
  ArrowRightIcon,
  ChartPieSliceIcon,
} from "@phosphor-icons/react";
import { AiBadge, AiLoadingIndicator } from "../ai/AiInsightPanel";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";

const iconMap = {
  success: ChartLineUpIcon,
  warning: WarningIcon,
  critical: WarningCircleIcon,
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

function SalesInsightList({ items, t }) {
  if (!items?.length) {
    return <p className="business-overview-empty">{t("salesCommercialNoInsights")}</p>;
  }

  return (
    <ul className="business-overview-list business-overview-list--expanded sales-commercial-insights">
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
              {item.targetRoute ? (
                <Link to={item.targetRoute} className="business-overview-action">
                  {t("salesCommercialOpenModule")}
                  <ArrowRightIcon size={12} weight="bold" />
                </Link>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function ConversionKpis({ kpis, t }) {
  if (!kpis?.conversionRows?.length) {
    return <p className="business-overview-empty">{t("salesCommercialNoInsights")}</p>;
  }

  return (
    <div className="sales-commercial-kpis">
      {kpis.returnRate != null ? (
        <p className="sales-commercial-kpis__return">
          {t("salesCommercialReturnRate").replace("{rate}", String(kpis.returnRate))}
        </p>
      ) : null}
      <div className="sales-commercial-kpis__table-wrap">
        <table className="sales-commercial-kpis__table">
          <thead>
            <tr>
              <th>{t("salesCommercialKpiMonth")}</th>
              <th>{t("salesCommercialKpiNewClients")}</th>
              <th>{t("salesCommercialKpiOrders")}</th>
            </tr>
          </thead>
          <tbody>
            {kpis.conversionRows.map((row) => (
              <tr key={row.month}>
                <td>{row.month}</td>
                <td>{row.newClients}</td>
                <td>{row.orders}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SalesCommercialAiPanel({
  data,
  loading = false,
  error = "",
  source,
  offlineHint = false,
  className = "",
  section = "insights",
}) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const textColor = theme === "dark" ? "text-white" : "text-[#090c64]";
  const iconColor = theme === "dark" ? "white" : "#090c64";
  const isInsights = section === "insights";
  const isKpis = section === "kpis";
  const hasData = isInsights
    ? Boolean(data?.insights?.length)
    : Boolean(data?.kpis?.conversionRows?.length);

  const HeaderIcon = isKpis ? ChartPieSliceIcon : SparkleIcon;
  const title = isKpis ? t("salesCommercialKpiTitle") : t("salesCommercialTitle");
  const description = isInsights ? t("salesCommercialDesc") : null;

  return (
    <section
      className={`app-surface sales-commercial-panel sales-commercial-panel--${section} p-4 min-w-0 w-full ${textColor}${className ? ` ${className}` : ""}`}
    >
      <div className="business-overview-panel__header">
        <div className="panel-header-leading min-w-0">
          <HeaderIcon
            size={24}
            weight="duotone"
            color={iconColor}
            className="preserve-icon-size shrink-0"
          />
          <div className="panel-header-leading__text min-w-0">
            <h2 className="text-sm font-bold leading-tight">{title}</h2>
            {description ? (
              <p className="text-xs opacity-75 mt-0.5">{description}</p>
            ) : null}
          </div>
          {isInsights ? <AiBadge source={source} /> : null}
        </div>
      </div>

      {loading && !data ? <AiLoadingIndicator className="business-overview-loading" /> : null}

      {offlineHint && !loading && isInsights ? (
        <p className="business-overview-offline-hint">{t("businessOverviewOffline")}</p>
      ) : null}

      {error && !loading ? <p className="business-overview-error">{error}</p> : null}

      {!error && (!loading || hasData) ? (
        <>
          {isInsights ? <SalesInsightList items={data?.insights} t={t} /> : null}
          {isKpis ? <ConversionKpis kpis={data?.kpis} t={t} /> : null}
        </>
      ) : null}
    </section>
  );
}

export default SalesCommercialAiPanel;
