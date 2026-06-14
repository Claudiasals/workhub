const applyParams = (template, params) =>
  Object.entries(params).reduce(
    (text, [key, value]) => text.replace(new RegExp(`\\{${key}\\}`, "g"), String(value ?? "")),
    template
  );

export function formatWarehouseSuggestion(item, t) {
  const p = item.params || {};
  const product = p.productName || t("warehouseAiProductFallback");
  const location = p.location || t("warehouseAiLocationFallback");

  switch (item.type) {
    case "reorder":
      return applyParams(t("warehouseAiReorder"), { product, location });
    case "low_stock":
      return applyParams(t("warehouseAiLowStock"), {
        product,
        location,
        stock: p.stock ?? 0,
        limit: p.limit ?? 0,
      });
    case "transfer":
      return applyParams(t("warehouseAiTransfer"), {
        product: p.productName || product,
        from: p.fromLocation || t("warehouseAiLocationFallback"),
        to: p.toLocation || t("warehouseAiLocationFallback"),
      });
    case "orders":
      return applyParams(t("warehouseAiOrders"), {
        count: p.orderCount ?? 0,
      });
    case "ok":
      return t("warehouseAiOk");
    default:
      return item.message || "";
  }
}

export function localizeWarehouseSuggestions(suggestions = [], t) {
  return suggestions.map((item) => ({
    ...item,
    message: item.params ? formatWarehouseSuggestion(item, t) : item.message || "",
  }));
}
