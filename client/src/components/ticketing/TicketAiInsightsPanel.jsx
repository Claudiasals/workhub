import { useMemo } from "react";
import { AiAlertList, AiInsightPanel } from "../ai/AiInsightPanel";
import { useLanguage } from "../../context/LanguageContext";

function mapTicketAlerts(data) {
  return (data?.alerts || []).map((alert) => ({
    type: alert.type || "alert",
    severity:
      alert.type === "critical"
        ? "high"
        : alert.type === "warning"
          ? "medium"
          : "info",
    message: alert.description
      ? `${alert.title} — ${alert.description}`
      : alert.title,
  }));
}

function mapTicketInsights(data) {
  return (data?.insights || [])
    .filter((insight) => {
      const title = String(insight.title || "").trim();
      return !/^Panoramica(\s|$)/i.test(title);
    })
    .map((insight) => ({
      type: "insight",
      severity: "low",
      message: insight.description
        ? `${insight.title} — ${insight.description}`
        : insight.title,
    }));
}

export function TicketAiInsightsPanel({
  data,
  loading = false,
  error = "",
  source,
}) {
  const { t } = useLanguage();

  const alertItems = useMemo(() => {
    const alerts = mapTicketAlerts(data);
    const insights = mapTicketInsights(data);
    return [...alerts, ...insights];
  }, [data]);

  const hasInsightsData = Boolean(
    (data?.alerts?.length || 0) + (data?.insights?.length || 0)
  );

  return (
    <AiInsightPanel
      title={t("ticketAiInsightsTitle")}
      loading={loading}
      error={error}
      source={source}
      hasData={hasInsightsData}
      compact
      className="w-full min-w-0"
    >
      <AiAlertList
        items={alertItems}
        sortBySeverity
        compact
        initialLimit={3}
      />
    </AiInsightPanel>
  );
}

export default TicketAiInsightsPanel;
