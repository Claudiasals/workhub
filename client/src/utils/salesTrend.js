import {
  subMonths,
  startOfMonth,
  eachMonthOfInterval,
  format,
} from "date-fns";
import { it, enGB } from "date-fns/locale";

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

const DEMO_MONTHLY_SALES = [
  { orders: 6, revenue: 2840, newClients: 3 },
  { orders: 8, revenue: 3920, newClients: 5 },
  { orders: 7, revenue: 3150, newClients: 4 },
  { orders: 11, revenue: 5280, newClients: 7 },
  { orders: 9, revenue: 4410, newClients: 6 },
  { orders: 14, revenue: 6720, newClients: 9 },
];

const buildMonthBuckets = (lang = "it") => {
  const locale = lang === "it" ? it : enGB;
  const now = new Date();
  const intervalStart = startOfMonth(subMonths(now, 5));
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

export const buildDemoSalesTrendData = (lang = "it") => {
  const buckets = buildMonthBuckets(lang);

  return buckets.map((bucket, index) => {
    const demo = DEMO_MONTHLY_SALES[index] || {
      orders: 0,
      revenue: 0,
      newClients: 0,
    };

    return {
      ...bucket,
      revenue: demo.revenue,
      orders: demo.orders,
      newClients: demo.newClients,
    };
  });
};

export const buildSalesTrendData = (orders = [], customers = [], lang = "it") => {
  const buckets = buildMonthBuckets(lang);
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

export const resolveSalesTrendData = (orders = [], customers = [], lang = "it") => {
  const real = buildSalesTrendData(orders, customers, lang);
  const hasRealData = real.some(
    (bucket) => bucket.orders > 0 || bucket.newClients > 0
  );

  if (hasRealData) {
    return { data: real, isDemo: false };
  }

  return { data: buildDemoSalesTrendData(lang), isDemo: true };
};
