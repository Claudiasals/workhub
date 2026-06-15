import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import { fetchShiftAnalysisRequest } from "../../api/aiApi";
import { AiAlertList, AiInsightPanel } from "../ai/AiInsightPanel";

export function ShiftAiInsightsPanel({
  token,
  active = false,
  analyzeRequest = 0,
  className = "",
}) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const textColor = theme === "dark" ? "text-white" : "text-[#090c64]";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    if (!token || !active) return;
    setLoading(true);
    setError("");
    try {
      const result = await fetchShiftAnalysisRequest(token);
      setData(result);
    } catch (err) {
      setError(err.message || t("aiError"));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [token, active, t]);

  useEffect(() => {
    if (!active) return;
    load();
  }, [active, analyzeRequest, load]);

  if (!active) return null;

  const alerts = data?.alerts || [];

  return (
    <AiInsightPanel
      title={t("aiShiftTitle")}
      loading={loading}
      error={error}
      source={data?.source}
      onRefresh={load}
      refreshLabel={t("aiShiftAnalyze")}
      hasData={alerts.length > 0}
      compact
      className={`mb-3 ${textColor}${className ? ` ${className}` : ""}`}
    >
      <p className="text-xs opacity-70 mb-2">{t("aiShiftHint")}</p>
      {alerts.length > 0 ? (
        <AiAlertList
          items={alerts}
          labelKey="message"
          sortBySeverity
          compact
          initialLimit={5}
        />
      ) : (
        !loading &&
        !error && <p className="text-xs opacity-60">{t("aiShiftNoAlerts")}</p>
      )}
    </AiInsightPanel>
  );
}

export default ShiftAiInsightsPanel;
