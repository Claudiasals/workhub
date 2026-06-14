import {
  COMPLEMENTARY_CATEGORIES,
  normalizeCustomerOrders,
} from "./analyzeCustomerData.js";

export class PromotionRecommendationService {
  generate({ metrics, catalogProducts = [] }) {
    const { normalized, preferredCategory, purchasedProductIds, loyaltyLevel } =
      metrics;

    if (!catalogProducts.length) return [];

    const recentProducts = normalized
      .slice(-5)
      .reverse()
      .map((o) => o.productName)
      .filter(Boolean);

    const candidateCategories = new Set();
    if (preferredCategory && preferredCategory !== "N/D") {
      candidateCategories.add(preferredCategory);
      (COMPLEMENTARY_CATEGORIES[preferredCategory] || []).forEach((c) =>
        candidateCategories.add(c)
      );
    }

    const candidates = catalogProducts.filter((product) => {
      const id = product._id?.toString?.() || product._id;
      if (purchasedProductIds.has(id)) return false;
      const catName = product.category?.name || product.category;
      return candidateCategories.size === 0 || candidateCategories.has(catName);
    });

    const promotions = [];
    const discountBase = loyaltyLevel === "Alto" ? 15 : loyaltyLevel === "Medio" ? 12 : 10;

    candidates.slice(0, 3).forEach((product, index) => {
      const catName = product.category?.name || product.category || preferredCategory;
      const discount = discountBase - index * 2;
      const motivation = this.buildMotivation({
        preferredCategory: catName,
        recentProducts,
        productName: product.name,
      });

      promotions.push({
        productId: product._id,
        productName: product.name,
        productPrice: product.price,
        discountPercent: Math.max(8, discount),
        validDays: 7,
        motivation,
        recentProducts: recentProducts.slice(0, 4),
        category: catName,
      });
    });

    if (promotions.length === 0 && catalogProducts.length > 0) {
      const fallback = catalogProducts.find(
        (p) => !purchasedProductIds.has(p._id?.toString?.() || p._id)
      );
      if (fallback) {
        promotions.push({
          productId: fallback._id,
          productName: fallback.name,
          productPrice: fallback.price,
          discountPercent: 10,
          validDays: 7,
          motivation:
            "Proposta generica basata sul catalogo per incentivare un nuovo acquisto.",
          recentProducts: recentProducts.slice(0, 4),
          category: fallback.category?.name || "Catalogo",
        });
      }
    }

    return promotions;
  }

  buildMotivation({ preferredCategory, recentProducts, productName }) {
    if (recentProducts.length >= 2) {
      return `Il cliente ha recentemente acquistato ${recentProducts.slice(0, 3).join(", ")}. ${productName} potrebbe completare l'allestimento in corso.`;
    }
    if (preferredCategory) {
      return `Storico acquisti concentrato sulla categoria ${preferredCategory}.`;
    }
    return "Promo personalizzata in base al profilo cliente.";
  }
}

export { normalizeCustomerOrders };
