import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";

import { fetchSalesInsightsRequest } from "../api/aiApi";
import { analyzeSalesCommercialLocal } from "../utils/salesCommercialAnalyzer";
import { salesCommercialFingerprint } from "../utils/aiDataFingerprint";
import { useAiApiAutoRefresh } from "./useAiApiAutoRefresh";

export function useSalesCommercialInsights({
  enabled = true,
  orders = [],
  customers = [],
  items = [],
  dataReady = true,
}) {
  const token = useSelector((state) => state.auth.token);

  const dataSnapshotRef = useRef({ orders, customers, items });
  dataSnapshotRef.current = { orders, customers, items };

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [offline, setOffline] = useState(false);
  const apiOkRef = useRef(false);

  const fingerprint = useMemo(
    () => salesCommercialFingerprint({ orders, customers, items }),
    [orders, customers, items]
  );

  const refreshApi = useCallback(async () => {
    if (!token || !enabled) return;

    const local = analyzeSalesCommercialLocal({
      orders: dataSnapshotRef.current.orders,
      customers: dataSnapshotRef.current.customers,
      items: dataSnapshotRef.current.items,
    });
    if (!apiOkRef.current) {
      setData(local);
    }
    setLoading(true);
    setError("");

    try {
      const result = await fetchSalesInsightsRequest(token);
      setData(result);
      apiOkRef.current = true;
      setOffline(false);
    } catch {
      apiOkRef.current = false;
      setData(local);
      setOffline(true);
    } finally {
      setLoading(false);
    }
  }, [token, enabled]);

  useEffect(() => {
    apiOkRef.current = false;
    setOffline(false);
  }, [token, enabled]);

  useEffect(() => {
    if (!enabled) return;

    const local = analyzeSalesCommercialLocal({
      orders: dataSnapshotRef.current.orders,
      customers: dataSnapshotRef.current.customers,
      items: dataSnapshotRef.current.items,
    });

    if (!apiOkRef.current || offline) {
      setData(local);
    }
  }, [enabled, orders, customers, items, offline]);

  useAiApiAutoRefresh({
    enabled,
    dataReady,
    fingerprint,
    onRefresh: refreshApi,
  });

  return {
    data,
    loading,
    error,
    offline,
    source: offline ? "heuristic" : data?.source,
  };
}
