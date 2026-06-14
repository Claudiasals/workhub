const COMPLEMENTARY = {
  Office: ["Tables & Chairs", "Storage", "Living"],
  Living: ["Tables & Chairs", "Storage", "Bedroom"],
  Bedroom: ["Living", "Storage"],
  Storage: ["Office", "Living"],
  "Tables & Chairs": ["Office", "Living", "Storage"],
};

export function buildCustomerPromotions(metrics, catalogProducts = []) {
  if (!catalogProducts.length) return [];

  const { normalized, preferredCategory, purchasedProductIds, loyaltyLevel } = metrics;
  const recentProducts = normalized.slice(-5).reverse().map((o) => o.productName);
  const candidateCategories = new Set();
  if (preferredCategory && preferredCategory !== "N/D") {
    candidateCategories.add(preferredCategory);
    (COMPLEMENTARY[preferredCategory] || []).forEach((c) => candidateCategories.add(c));
  }

  const candidates = catalogProducts.filter((product) => {
    const id = product._id?.toString?.() || product._id;
    if (purchasedProductIds.has(id)) return false;
    const catName = product.category?.name || product.category;
    return candidateCategories.size === 0 || candidateCategories.has(catName);
  });

  const discountBase = loyaltyLevel === "Alto" ? 15 : loyaltyLevel === "Medio" ? 12 : 10;

  return candidates.slice(0, 3).map((product, index) => ({
    productId: product._id,
    productName: product.name,
    productPrice: product.price,
    discountPercent: Math.max(8, discountBase - index * 2),
    validDays: 7,
    recentProducts: recentProducts.slice(0, 4),
    category: product.category?.name || product.category,
    motivation:
      recentProducts.length >= 2
        ? `Recenti acquisti: ${recentProducts.slice(0, 3).join(", ")}. ${product.name} potrebbe completare l'allestimento.`
        : `Storico concentrato su ${preferredCategory || "catalogo"}.`,
  }));
}
