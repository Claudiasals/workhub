const MS_DAY = 24 * 60 * 60 * 1000;

export function getOrderLineAmount(order) {
  const price = order.product?.price || 0;
  const qty = order.quantity || 1;
  return price * qty;
}

export function normalizeCustomerOrders(orders = []) {
  return [...orders]
    .map((order) => ({
      ...order,
      created: new Date(order.createdAt || order.updatedAt),
      categoryName:
        order.product?.category?.name ||
        order.product?.category ||
        "Senza categoria",
      productName: order.product?.name || "Prodotto",
      productId: order.product?._id?.toString?.() || order.product?._id,
      amount: getOrderLineAmount(order),
      locationName: order.pointOfSales?.name || order.pointOfSales?.city || "",
    }))
    .filter((o) => !Number.isNaN(o.created.getTime()))
    .sort((a, b) => a.created - b.created);
}

export function computePurchaseFrequencyDays(sortedOrders) {
  if (sortedOrders.length < 2) return null;
  const gaps = [];
  for (let i = 1; i < sortedOrders.length; i++) {
    gaps.push(
      Math.round((sortedOrders[i].created - sortedOrders[i - 1].created) / MS_DAY)
    );
  }
  return Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
}

export function countByCategory(orders) {
  return orders.reduce((acc, o) => {
    acc[o.categoryName] = (acc[o.categoryName] || 0) + 1;
    return acc;
  }, {});
}

export function topEntry(counts) {
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || null;
}

export function computeCustomerMetrics(customer, orders = []) {
  const normalized = normalizeCustomerOrders(orders);
  const totalOrders = normalized.length;
  const totalSpent = normalized.reduce((s, o) => s + o.amount, 0);
  const averageOrderValue =
    totalOrders > 0 ? Math.round((totalSpent / totalOrders) * 100) / 100 : 0;
  const frequencyDays = computePurchaseFrequencyDays(normalized);
  const categoryCounts = countByCategory(normalized);
  const preferred = topEntry(categoryCounts);
  const locationCounts = normalized.reduce((acc, o) => {
    if (o.locationName) acc[o.locationName] = (acc[o.locationName] || 0) + 1;
    return acc;
  }, {});
  const topLocation = topEntry(locationCounts);
  const lastOrder = normalized[normalized.length - 1];
  const lastPurchaseDaysAgo = lastOrder
    ? Math.floor((Date.now() - lastOrder.created.getTime()) / MS_DAY)
    : null;

  const points = customer?.affiliateProgram?.points || 0;
  const tier = customer?.affiliateProgram?.name || "standard";

  let loyaltyLevel = "Basso";
  if (tier === "premium" || totalOrders >= 10 || points >= 500) {
    loyaltyLevel = "Alto";
  } else if (totalOrders >= 3 || points >= 100) {
    loyaltyLevel = "Medio";
  }

  let profileLabel = "Cliente occasionale";
  if (tier === "premium" || totalOrders >= 10) {
    profileLabel = "Cliente fidelizzato";
  } else if (totalOrders >= 3) {
    profileLabel = "Cliente ricorrente";
  }

  const purchasedProductIds = new Set(
    normalized.map((o) => o.productId).filter(Boolean)
  );

  return {
    normalized,
    totalOrders,
    totalSpent,
    averageOrderValue,
    frequencyDays,
    preferredCategory: preferred?.[0] || "N/D",
    preferredCategoryCount: preferred?.[1] || 0,
    topLocation: topLocation?.[0] || customer?.location?.city || "N/D",
    lastPurchaseDaysAgo,
    loyaltyLevel,
    profileLabel,
    points,
    tier,
    categoryCounts,
    purchasedProductIds,
  };
}

/** Regole complementari tra categorie catalogo WorkHub */
export const COMPLEMENTARY_CATEGORIES = {
  Office: ["Tables & Chairs", "Storage", "Living"],
  Living: ["Tables & Chairs", "Storage", "Bedroom"],
  Bedroom: ["Living", "Storage"],
  Storage: ["Office", "Living"],
  "Tables & Chairs": ["Office", "Living", "Storage"],
};

export function ordersInLastMonths(normalized, months) {
  const cutoff = Date.now() - months * 30 * MS_DAY;
  return normalized.filter((o) => o.created.getTime() >= cutoff);
}
