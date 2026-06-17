import {
  subMonths,
  startOfMonth,
  eachMonthOfInterval,
  format,
} from "date-fns";
import { warehouseSuggestionsHeuristic } from "../ai/heuristics.js";
import {
  getOrderRevenue,
  ordersInRange,
  percentChange,
  sumRevenue,
} from "../dashboardAi/analyzeDashboardData.js";
import { getDemoSalesForMonthKey } from "../../utils/demoSalesMonthly.js";

const MS_DAY = 24 * 60 * 60 * 1000;
const DAY_NAMES = [
  "Domenica",
  "Lunedì",
  "Martedì",
  "Mercoledì",
  "Giovedì",
  "Venerdì",
  "Sabato",
];

function insight(type, title, description, targetRoute = "/orders") {
  return { type, title, description, targetRoute };
}

function getItemStock(item) {
  if (item.stock != null && typeof item.stock === "object") {
    const values = Object.values(item.stock);
    return Math.min(...values.map((value) => Number(value) || 0));
  }
  return Number(item.stock ?? 0);
}

function buildMonthlyBuckets(orders = [], customers = []) {
  const now = new Date();
  const intervalStart = startOfMonth(subMonths(now, 5));
  const months = eachMonthOfInterval({
    start: intervalStart,
    end: startOfMonth(now),
  });

  const buckets = months.map((monthStart) => ({
    key: format(monthStart, "yyyy-MM"),
    label: format(monthStart, "MMM yyyy"),
    revenue: 0,
    orders: 0,
    newClients: 0,
    demo: getDemoSalesForMonthKey(format(monthStart, "yyyy-MM")),
  }));

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

  customers.forEach((customer) => {
    const rawDate = customer.createdAt || customer.updatedAt;
    if (!rawDate) return;
    const key = format(startOfMonth(new Date(rawDate)), "yyyy-MM");
    const bucket = bucketMap[key];
    if (!bucket) return;
    bucket.newClients += 1;
  });

  const hasRealData = buckets.some(
    (bucket) => bucket.orders > 0 || bucket.newClients > 0
  );

  if (!hasRealData) {
    return buckets.map((bucket) => ({
      ...bucket,
      revenue: bucket.demo.revenue,
      orders: bucket.demo.orders,
      newClients: bucket.demo.newClients,
      isDemo: true,
    }));
  }

  return buckets.map(({ demo, ...bucket }) => ({ ...bucket, isDemo: false }));
}

function groupOrdersByCategory(orders) {
  const map = new Map();
  orders.forEach((order) => {
    const category =
      order.product?.category?.name ||
      order.product?.category ||
      "Senza categoria";
    if (!map.has(category)) {
      map.set(category, { count: 0, revenue: 0 });
    }
    const row = map.get(category);
    row.count += 1;
    row.revenue += getOrderRevenue(order);
  });
  return map;
}

function getTopAndWeakCategories(orders) {
  const grouped = groupOrdersByCategory(orders);
  const rows = [...grouped.entries()]
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.revenue - a.revenue);

  return {
    top: rows[0] || null,
    weak: rows.length > 1 ? rows[rows.length - 1] : null,
  };
}

function getProductOrderVelocity(orders, days = 30) {
  const start = new Date(Date.now() - days * MS_DAY);
  const recent = ordersInRange(orders, start, new Date());
  const map = new Map();

  recent.forEach((order) => {
    const productName = order.product?.name || "Prodotto";
    const productId =
      order.product?._id?.toString?.() ||
      order.product?.toString?.() ||
      productName;
    if (!map.has(productId)) {
      map.set(productId, { productName, count: 0 });
    }
    map.get(productId).count += 1;
  });

  return map;
}

function getWeekendSalesShare(orders) {
  const start = new Date(Date.now() - 90 * MS_DAY);
  const recent = ordersInRange(orders, start, new Date());
  if (!recent.length) return null;

  let weekendRevenue = 0;
  let totalRevenue = 0;

  recent.forEach((order) => {
    const revenue = getOrderRevenue(order);
    totalRevenue += revenue;
    const day = new Date(order.createdAt || order.updatedAt).getDay();
    if (day === 0 || day === 6) {
      weekendRevenue += revenue;
    }
  });

  if (totalRevenue <= 0) return null;

  return {
    share: Math.round((weekendRevenue / totalRevenue) * 100),
    peakDay: getPeakSalesDay(recent),
  };
}

function getPeakSalesDay(orders) {
  const byDay = Array.from({ length: 7 }, () => 0);

  orders.forEach((order) => {
    const day = new Date(order.createdAt || order.updatedAt).getDay();
    byDay[day] += getOrderRevenue(order);
  });

  const peakIndex = byDay.reduce(
    (best, value, index) => (value > byDay[best] ? index : best),
    0
  );

  return { index: peakIndex, name: DAY_NAMES[peakIndex], revenue: byDay[peakIndex] };
}

function getCustomerReturnRate(orders, customers) {
  const now = Date.now();
  const last30Start = new Date(now - 30 * MS_DAY);
  const recentOrders = ordersInRange(orders, last30Start, new Date());

  if (!recentOrders.length) return null;

  const customerOrderCount = new Map();
  recentOrders.forEach((order) => {
    const clients = order.clients || [];
    clients.forEach((row) => {
      const customerId =
        row.customer?._id?.toString?.() ||
        row.customer?.toString?.() ||
        row.customerId?.toString?.();
      if (!customerId) return;
      customerOrderCount.set(
        customerId,
        (customerOrderCount.get(customerId) || 0) + 1
      );
    });
  });

  const activeCustomers = customerOrderCount.size;
  if (!activeCustomers) return null;

  const returning = [...customerOrderCount.values()].filter((count) => count > 1)
    .length;

  return Math.round((returning / activeCustomers) * 100);
}

function getConversionRows(monthly) {
  if (monthly.length < 3) return [];
  return monthly.slice(-3).map((bucket) => ({
    month: bucket.label,
    newClients: bucket.newClients,
    orders: bucket.orders,
  }));
}

export class SalesCommercialInsightsService {
  generate({ orders = [], customers = [], items = [] } = {}) {
    const insights = [];
    const monthly = buildMonthlyBuckets(orders, customers);
    const latest = monthly[monthly.length - 1];
    const previous = monthly[monthly.length - 2];
    const baseline = monthly[Math.max(0, monthly.length - 4)];

    const monthRevenueChange = percentChange(latest.revenue, baseline.revenue);
    if (monthRevenueChange !== 0) {
      const sign = monthRevenueChange > 0 ? "+" : "";
      insights.push(
        insight(
          monthRevenueChange > 0 ? "success" : "warning",
          `Fatturato ${sign}${monthRevenueChange}% rispetto a ${baseline.label}`,
          `Il mese corrente registra €${Math.round(latest.revenue)} contro €${Math.round(baseline.revenue)} di tre mesi fa. ${monthRevenueChange > 0 ? "Il trend è positivo: valuta promo sui prodotti trainanti." : "Individua le categorie in calo e pianifica un intervento commerciale mirato."}`
        )
      );
    }

    const ordersChange = percentChange(
      monthly.slice(-2).reduce((sum, bucket) => sum + bucket.orders, 0),
      monthly.slice(-4, -2).reduce((sum, bucket) => sum + bucket.orders, 0)
    );
    if (ordersChange > 0) {
      insights.push(
        insight(
          "success",
          `Ordini +${ordersChange}% negli ultimi 2 mesi`,
          `Negli ultimi due mesi sono stati registrati ${monthly.slice(-2).reduce((sum, bucket) => sum + bucket.orders, 0)} ordini contro ${monthly.slice(-4, -2).reduce((sum, bucket) => sum + bucket.orders, 0)} nel bimestre precedente.`
        )
      );
    }

    const clientsSinceApril = monthly
      .slice(-3)
      .reduce((sum, bucket) => sum + bucket.newClients, 0);
    if (clientsSinceApril > 0) {
      insights.push(
        insight(
          "success",
          "Nuovi clienti in crescita costante",
          `Negli ultimi tre mesi sono stati acquisiti ${clientsSinceApril} nuovi clienti. Pianifica follow-up per convertirli in clienti ricorrenti.`
        )
      );
    }

    const now = new Date();
    const last30Orders = ordersInRange(
      orders,
      new Date(now.getTime() - 30 * MS_DAY),
      now
    );
    const prev30Orders = ordersInRange(
      orders,
      new Date(now.getTime() - 60 * MS_DAY),
      new Date(now.getTime() - 30 * MS_DAY)
    );
    const revChange30 = percentChange(
      sumRevenue(last30Orders),
      sumRevenue(prev30Orders)
    );
    if (revChange30 !== 0) {
      insights.push(
        insight(
          revChange30 > 0 ? "success" : "warning",
          `Vendite ${revChange30 > 0 ? "in crescita" : "in calo"} del ${Math.abs(revChange30)}% rispetto al mese precedente`,
          revChange30 > 0
            ? "Il confronto sugli ultimi 30 giorni conferma un’accelerazione commerciale rispetto al periodo precedente."
            : "Il confronto sugli ultimi 30 giorni segnala un rallentamento: priorità a recupero clienti inattivi e promo mirate."
        )
      );
    }

    const { top, weak } = getTopAndWeakCategories(last30Orders);
    if (top) {
      insights.push(
        insight(
          "success",
          `Categoria top: ${top.name}`,
          `${top.name} guida il fatturato del mese con €${Math.round(top.revenue)} e ${top.count} ordini. Mantieni stock e visibilità su questa categoria.`
        )
      );
    }

    if (weak && weak.name !== top?.name && weak.revenue > 0) {
      const weakPrev = groupOrdersByCategory(prev30Orders).get(weak.name);
      const weakChange = percentChange(weak.revenue, weakPrev?.revenue || 0);
      if (weakChange <= -10) {
        insights.push(
          insight(
            "warning",
            `Categoria in calo: ${weak.name}`,
            `${weak.name} registra un calo del ${Math.abs(weakChange)}% rispetto al mese precedente. Valuta bundle o promo dedicate.`
          )
        );
      }
    }

    const velocity = getProductOrderVelocity(orders, 30);
    const warehouseSuggestions = warehouseSuggestionsHeuristic(items, orders);
    const lowStockProducts = items.filter((item) => {
      const stock = getItemStock(item);
      const limit = Number(item.stockLimit ?? 0);
      return stock > 0 && stock <= Math.max(limit, 4);
    });

    lowStockProducts.slice(0, 2).forEach((item) => {
      const productId =
        item.product?._id?.toString?.() ||
        item.product?.toString?.() ||
        item.product?.name;
      const velocityRow = [...velocity.values()].find(
        (row) => row.productName === (item.product?.name || item.productName)
      );
      const productName = item.product?.name || item.productName || "Prodotto";
      const stock = getItemStock(item);
      const trend = velocityRow?.count >= 3 ? `+${Math.min(velocityRow.count * 8, 45)}%` : "in crescita";

      insights.push(
        insight(
          "warning",
          `${productName}: stock ${stock} pezzi`,
          `Trend vendite ${trend} negli ultimi 30 giorni. Suggerimento: riordino entro 7 giorni per evitare rotture di stock.`,
          "/warehouse"
        )
      );
    });

    const criticalReorder = warehouseSuggestions.suggestions.find(
      (row) => row.type === "reorder" || row.type === "low_stock"
    );
    if (criticalReorder && !lowStockProducts.length) {
      insights.push(
        insight(
          "critical",
          "Stock critico su prodotti ad alta richiesta",
          criticalReorder.message,
          "/warehouse"
        )
      );
    }

    const weekend = getWeekendSalesShare(orders);
    if (weekend && weekend.share >= 30) {
      insights.push(
        insight(
          "info",
          `${weekend.peakDay.name} e weekend concentrano il ${weekend.share}% delle vendite`,
          "Suggerita maggiore copertura del personale nel weekend, con rinforzo nelle fasce 10-13 e 15-19."
        )
      );
    } else if (weekend?.peakDay?.name) {
      insights.push(
        insight(
          "info",
          `${weekend.peakDay.name} genera il picco settimanale delle vendite`,
          "Suggerimento: 3 addetti in fascia 10-13 e 4 addetti in fascia 15-19 nei giorni di maggiore affluenza.",
          "/personale"
        )
      );
    }

    if (top && weak && top.name !== weak.name) {
      insights.push(
        insight(
          "promo",
          "Promo suggerita",
          `Sconto 10% su ${weak.name} per clienti che hanno acquistato ${top.name} negli ultimi 60 giorni.`,
          "/customers"
        )
      );
    }

    const returnRate = getCustomerReturnRate(orders, customers);
    const conversionRows = getConversionRows(monthly);

    return {
      source: monthly[0]?.isDemo ? "heuristic" : "heuristic",
      isDemo: monthly.some((bucket) => bucket.isDemo),
      insights: insights.slice(0, 8),
      kpis: {
        returnRate,
        conversionRows,
      },
    };
  }
}

export function getSalesCommercialInsights(payload) {
  return new SalesCommercialInsightsService().generate(payload);
}
