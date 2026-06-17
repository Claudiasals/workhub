import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { AiAlertList, AiInsightPanel } from "../ai/AiInsightPanel";
import { useLanguage } from "../../context/LanguageContext";
import { fetchWarehouseSuggestionsRequest } from "../../api/aiApi";
import { localizeWarehouseSuggestions } from "../../utils/warehouseSuggestionsI18n";
import { analyzeWarehouseSuggestionsLocal } from "../../utils/warehouseSuggestionsAnalyzer";
import { warehouseAiFingerprint } from "../../utils/aiDataFingerprint";
import { useAiApiAutoRefresh } from "../../hooks/useAiApiAutoRefresh";

const REORDER_SUGGESTION_TYPES = new Set(["reorder", "low_stock", "orders"]);

function pickReorderSuggestions(suggestions = []) {
  const focused = suggestions.filter((item) =>
    REORDER_SUGGESTION_TYPES.has(item.type)
  );
  if (focused.length) return focused;
  return suggestions.filter((item) => item.type === "ok");
}

export function OrdersReorderInsightsPanel({ token }) {
  const { t, lang } = useLanguage();
  const items = useSelector((state) => state.items.list) || [];
  const orders = useSelector((state) => state.orders.items) || [];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState(null);
  const snapshotRef = useRef({ items, orders });

  snapshotRef.current = { items, orders };

  const fingerprint = useMemo(
    () => warehouseAiFingerprint({ items, orders }),
    [items, orders]
  );

  const loadSuggestions = useCallback(async () => {
    if (!token) return;

    const local = analyzeWarehouseSuggestionsLocal(
      snapshotRef.current.items,
      snapshotRef.current.orders
    );
    setSuggestions(local);
    setLoading(true);
    setError("");

    try {
      const data = await fetchWarehouseSuggestionsRequest(token, lang);
      setSuggestions(data);
    } catch {
      setError("");
    } finally {
      setLoading(false);
    }
  }, [token, lang]);

  useEffect(() => {
    setSuggestions(analyzeWarehouseSuggestionsLocal(items, orders));
  }, [items, orders]);

  useAiApiAutoRefresh({
    enabled: Boolean(token),
    dataReady: true,
    fingerprint,
    onRefresh: loadSuggestions,
  });

  const alertItems = useMemo(() => {
    const localized = localizeWarehouseSuggestions(
      suggestions?.suggestions || [],
      t
    );
    return pickReorderSuggestions(localized);
  }, [suggestions?.suggestions, t]);

  return (
    <AiInsightPanel
      title={t("suggerimenti")}
      loading={loading}
      error={error}
      source={suggestions?.source}
      hasData={alertItems.length > 0}
      compact
      className="orders-reorder-insights w-full min-w-0"
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

export default OrdersReorderInsightsPanel;
