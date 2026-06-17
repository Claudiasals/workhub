import { AiAlertList, AiInsightPanel } from "../ai/AiInsightPanel";
import { useLanguage } from "../../context/LanguageContext";

export function CustomerPortfolioSuggestionsPanel({
  data,
  loading = false,
  error = "",
  source,
  offlineHint = false,
  className = "",
}) {
  const { t } = useLanguage();

  const alertItems = (data?.suggestions || []).map((item) => ({
    severity: item.severity || "info",
    message: item.message || item.title,
    type: item.severity,
  }));

  return (
    <AiInsightPanel
      title={t("customerPortfolioSuggestionsTitle")}
      description={t("customerPortfolioSuggestionsDesc")}
      loading={loading}
      error={error}
      source={source}
      offlineHint={offlineHint}
      hasData={alertItems.length > 0}
      compact
      className={`customer-portfolio-panel customer-portfolio-panel--suggestions ${className}`.trim()}
    >
      <AiAlertList
        items={alertItems}
        sortBySeverity
        compact
        initialLimit={5}
      />
    </AiInsightPanel>
  );
}

export default CustomerPortfolioSuggestionsPanel;
