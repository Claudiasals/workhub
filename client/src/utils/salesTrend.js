import {
  subMonths,
  startOfMonth,
  eachMonthOfInterval,
  format,
} from "date-fns";
import { it, enGB } from "date-fns/locale";

import { getDemoSalesForMonthKey } from "./demoSalesMonthly.js";

export const SALES_TREND_MONTH_OPTIONS = [3, 6, 12];
export const DEFAULT_SALES_TREND_MONTHS = 6;

export const getOrderRevenue = (order) => {
  const unitPrice = Number(order.product?.price) || 0;

  if (order.quantity != null) {
    return Number(order.quantity) * unitPrice;
  }

  const clients = order.clients || [];
  const qtyFromClients = clients.reduce(
    (sum, clientRow) => sum + (Number(clientRow.quantity) || 0),
    0
  );
  const quantity = qtyFromClients || Number(order.totalQuantity) || 0;

  return quantity * unitPrice;
};

const buildMonthBuckets = (lang = "it", monthsCount = DEFAULT_SALES_TREND_MONTHS) => {
  const locale = lang === "it" ? it : enGB;
  const now = new Date();
  const safeMonths = Math.max(1, monthsCount);
  const intervalStart = startOfMonth(subMonths(now, safeMonths - 1));
  const months = eachMonthOfInterval({
    start: intervalStart,
    end: startOfMonth(now),
  });

  return months.map((monthStart) => ({
    key: format(monthStart, "yyyy-MM"),
    label: format(monthStart, "MMM yyyy", { locale }),
    revenue: 0,
    orders: 0,
    newClients: 0,
  }));
};

const aggregateCustomersByMonth = (customers, bucketMap) => {
  customers.forEach((customer) => {
    const rawDate = customer.createdAt || customer.updatedAt;
    if (!rawDate) return;

    const key = format(startOfMonth(new Date(rawDate)), "yyyy-MM");
    const bucket = bucketMap[key];
    if (!bucket) return;

    bucket.newClients += 1;
  });
};

const hasMeaningfulTrend = (buckets) => {
  const activeMonths = buckets.filter((bucket) => bucket.orders >= 5).length;
  const totalRevenue = buckets.reduce((sum, bucket) => sum + bucket.revenue, 0);

  return activeMonths >= Math.min(3, buckets.length) && totalRevenue >= 15000;
};

export const buildDemoSalesTrendData = (
  lang = "it",
  monthsCount = DEFAULT_SALES_TREND_MONTHS
) => {
  const buckets = buildMonthBuckets(lang, monthsCount);

  return buckets.map((bucket) => {
    const demo = getDemoSalesForMonthKey(bucket.key);

    return {
      ...bucket,
      revenue: demo.revenue,
      orders: demo.orders,
      newClients: demo.newClients,
    };
  });
};

export const buildSalesTrendData = (
  orders = [],
  customers = [],
  lang = "it",
  monthsCount = DEFAULT_SALES_TREND_MONTHS
) => {
  const buckets = buildMonthBuckets(lang, monthsCount);
  const bucketMap = Object.fromEntries(buckets.map((bucket) => [bucket.key, bucket]));

  orders.forEach((order) => {
    const rawDate = order.createdAt || order.updatedAt;
    if (!rawDate) return;

    const key = format(startOfMonth(new Date(rawDate)), "yyyy-MM");
    const bucket = bucketMap[key];
    if (!bucket) return;

    bucket.orders += 1;
    bucket.revenue += getOrderRevenue(order);
  });

  aggregateCustomersByMonth(customers, bucketMap);

  return buckets;
};

export const resolveSalesTrendData = (
  orders = [],
  customers = [],
  lang = "it",
  monthsCount = DEFAULT_SALES_TREND_MONTHS
) => {
  const real = buildSalesTrendData(orders, customers, lang, monthsCount);
  const hasAnyRecords = orders.length > 0 || customers.length > 0;

  if (hasMeaningfulTrend(real)) {
    return { data: real, isDemo: false, isEmpty: false, monthsCount };
  }

  if (hasAnyRecords) {
    return {
      data: buildDemoSalesTrendData(lang, monthsCount),
      isDemo: true,
      isEmpty: false,
      monthsCount,
    };
  }

  return {
    data: buildDemoSalesTrendData(lang, monthsCount),
    isDemo: true,
    isEmpty: false,
    monthsCount,
  };
};
