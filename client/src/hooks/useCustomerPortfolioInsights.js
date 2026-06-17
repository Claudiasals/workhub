import { useEffect, useRef, useState } from "react";

import { analyzeCustomerPortfolioLocal } from "../utils/customerPortfolioAnalyzer";

export function useCustomerPortfolioInsights({
  enabled = true,
  orders = [],
  customers = [],
  items = [],
} = {}) {
  const dataSnapshotRef = useRef({ orders, customers, items });
  dataSnapshotRef.current = { orders, customers, items };

  const [data, setData] = useState(null);

  useEffect(() => {
    if (!enabled) return;

    setData(
      analyzeCustomerPortfolioLocal({
        orders: dataSnapshotRef.current.orders,
        customers: dataSnapshotRef.current.customers,
        items: dataSnapshotRef.current.items,
      })
    );
  }, [enabled, orders, customers, items]);

  return {
    data,
    loading: false,
    error: "",
    offline: true,
    source: data?.source,
  };
}
