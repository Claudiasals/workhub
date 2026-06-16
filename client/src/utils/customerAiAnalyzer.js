import { computeCustomerMetrics } from "./customerAiMetrics.js";
import { buildCustomerInsights } from "./customerAiInsights.js";
import { buildCustomerPromotions } from "./customerAiPromotions.js";

/** Analisi locale quando si usa già il payload cliente con ordini (fallback). */
export function analyzeCustomerAiLocal(customer, catalogProducts = []) {
  const orders = customer?.orders || [];
  const metrics = computeCustomerMetrics(customer, orders);
  const insights = buildCustomerInsights(metrics, null);
  const promotions = buildCustomerPromotions(metrics, catalogProducts);

  const profile = {
    label: metrics.profileLabel,
    preferredCategory: metrics.preferredCategory,
    purchaseFrequencyDays: metrics.frequencyDays,
    averageOrderValue: metrics.averageOrderValue,
    loyaltyLevel: metrics.loyaltyLevel,
    totalOrders: metrics.totalOrders,
    totalSpent: metrics.totalSpent,
    lastPurchaseDaysAgo: metrics.lastPurchaseDaysAgo,
    topLocation: metrics.topLocation,
    tier: metrics.tier,
    points: metrics.points,
  };

  return {
    profile,
    insights,
    promotions,
    checkout: {
      summaryInsight: insights[0]?.description || profile.label,
      profileLabel: profile.label,
      preferredCategory: profile.preferredCategory,
      promotion: promotions[0]
        ? {
            productName: promotions[0].productName,
            discountPercent: promotions[0].discountPercent,
            validDays: promotions[0].validDays,
            motivation: promotions[0].motivation,
          }
        : null,
    },
    source: "heuristic",
    generatedAt: new Date().toISOString(),
  };
}

export function generatePromoEmailLocal({ customer, promotion, lang = "it" }) {
  const name =
    `${customer?.firstName || ""} ${customer?.lastName || ""}`.trim() ||
    (lang === "en" ? "Customer" : "Cliente");
  const discount = promotion?.discountPercent || 10;
  const product = promotion?.productName || "prodotti selezionati";
  const validDays = promotion?.validDays || 7;
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + validDays);
  const dateStr = validUntil.toLocaleDateString(lang === "en" ? "en-GB" : "it-IT");

  return {
    subject:
      lang === "en"
        ? `Exclusive ${discount}% offer for you`
        : `Promo esclusiva ${discount}% per lei`,
    body:
      lang === "en"
        ? `Dear ${name},\n\nThank you for your recent purchases.\n\nWe selected ${discount}% off on ${product}, valid until ${dateStr}.\n\n${promotion?.motivation || ""}\n\nBest regards,\nWorkHub Store Team`
        : `Gentile ${name},\n\nLa ringraziamo per i recenti acquisti.\n\nLe proponiamo ${discount}% di sconto su ${product}, valido fino al ${dateStr}.\n\n${promotion?.motivation || ""}\n\nCordiali saluti,\nTeam WorkHub`,
    source: "heuristic",
  };
}

/** Testo formattato da mostrare al cliente in negozio (modal / cassa). */
export function buildPromoDisplayForCustomer({ customer, promotion, t, lang = "it" }) {
  const name =
    `${customer?.firstName || ""} ${customer?.lastName || ""}`.trim() ||
    (lang === "en" ? "Customer" : "Cliente");
  const discount = promotion?.discountPercent || 10;
  const product = promotion?.productName || (lang === "en" ? "selected products" : "prodotti selezionati");
  const validDays = promotion?.validDays || 7;
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + validDays);
  const dateStr = validUntil.toLocaleDateString(lang === "en" ? "en-GB" : "it-IT");
  const onLabel = t("customerAiOn");
  const validLabel = t("customerAiValidDays").replace("{days}", String(validDays));

  const lines = [
    `🎯 ${t("customerAiRecommendedPromo")}: ${discount}% ${onLabel} ${product}`,
    `${validLabel} (${lang === "en" ? "until" : "fino al"} ${dateStr})`,
    "",
    promotion?.motivation || "",
  ];

  if (promotion?.recentProducts?.length) {
    lines.push("", lang === "en" ? "Recent purchases:" : "Acquisti recenti:");
    promotion.recentProducts.forEach((item) => lines.push(`• ${item}`));
  }

  lines.push("", `— ${name}`);

  return {
    title: t("customerAiPromoShowTitle"),
    body: lines.join("\n").trim(),
    clipboardText: `${discount}% ${onLabel} ${product}\n${promotion?.motivation || ""}`,
  };
}
