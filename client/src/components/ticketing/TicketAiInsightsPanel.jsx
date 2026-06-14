import { useMemo } from "react";
import { AiAlertList, AiInsightPanel } from "../ai/AiInsightPanel";
import { useLanguage } from "../../context/LanguageContext";

function mapTicketInsightsToAlertItems(data) {
  const items = [];

  (data?.alerts || []).forEach((alert) => {
    const severity =
      alert.type === "critical"
        ? "high"
        : alert.type === "warning"
          ? "medium"
          : "info";

    items.push({
      type: alert.type || "alert",
      severity,
      message: alert.description
        ? `${alert.title} — ${alert.description}`
        : alert.title,
    });
  });

  (data?.insights || []).forEach((insight) => {
    items.push({
      type: "insight",
      severity: "low",
      message: insight.description
        ? `${insight.title} — ${insight.description}`
        : insight.title,
    });
  });

  return items;
}

export function TicketAiInsightsPanel({
  data,
  loading = false,
  error = "",
  onRefresh,
  source,
}) {
  const { t } = useLanguage();

  const alertItems = useMemo(() => mapTicketInsightsToAlertItems(data), [data]);
  const hasInsightsData = Boolean(
    (data?.alerts?.length || 0) + (data?.insights?.length || 0)
  );

  return (
    <AiInsightPanel
      title={t("ticketAiInsightsTitle")}
      loading={loading}
      error={error}
      source={source}
      onRefresh={onRefresh}
      hasData={hasInsightsData}
      compact
      className="ticket-ai-insights-compact w-full min-w-0 mb-0"
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
