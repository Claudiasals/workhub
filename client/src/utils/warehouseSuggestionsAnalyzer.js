function getItemStock(item) {
  if (item.stock != null && typeof item.stock === "object") {
    const values = Object.values(item.stock);
    return Math.min(...values.map((value) => Number(value) || 0));
  }
  return Number(item.stock ?? 0);
}

export function analyzeWarehouseSuggestionsLocal(items = [], orders = []) {
  const suggestions = [];

  items.forEach((item) => {
    const stock = getItemStock(item);
    const limit = Number(item.stockLimit ?? 0);
    const productName = item.product?.name || item.productName || "Prodotto";
    const location = item.pointOfSales?.name || item.locationName || "Sede";

    if (stock <= 0) {
      suggestions.push({
        type: "reorder",
        severity: "high",
        params: { productName, location },
      });
    } else if (stock <= limit) {
      suggestions.push({
        type: "low_stock",
        severity: "medium",
        params: { productName, location, stock, limit },
      });
    }
  });

  const byProduct = new Map();
  items.forEach((item) => {
    const sku = item.product?.sku || item.sku || item.product?._id;
    if (!sku) return;
    if (!byProduct.has(sku)) byProduct.set(sku, []);
    byProduct.get(sku).push(item);
  });

  byProduct.forEach((rows, sku) => {
    const low = rows.filter((r) => getItemStock(r) <= Number(r.stockLimit ?? 0));
    const high = rows.filter((r) => getItemStock(r) > Number(r.stockLimit ?? 0) * 3);
    if (low.length && high.length) {
      const from = high[0];
      const to = low[0];
      suggestions.push({
        type: "transfer",
        severity: "medium",
        params: {
          productName: from.product?.name || sku,
          fromLocation: from.pointOfSales?.name || "sede A",
          toLocation: to.pointOfSales?.name || "sede B",
        },
      });
    }
  });

  if (orders.length > 0) {
    suggestions.push({
      type: "orders",
      severity: "info",
      params: { orderCount: orders.length },
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      type: "ok",
      severity: "info",
      params: {},
    });
  }

  return {
    suggestions,
    source: "heuristic",
    generatedAt: new Date().toISOString(),
  };
}
