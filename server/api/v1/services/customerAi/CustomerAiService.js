import { Client, Order, Product } from "../../../../db/index.js";
import { computeCustomerMetrics } from "./analyzeCustomerData.js";
import { CustomerInsightsService } from "./CustomerInsightsService.js";
import { PromotionRecommendationService } from "./PromotionRecommendationService.js";
import { EmailPromotionGeneratorService } from "./EmailPromotionGeneratorService.js";
import { LlmCustomerAiProvider } from "./providers/LlmCustomerAiProvider.js";
import { isAiConfigured } from "../ai/llmClient.js";

export class CustomerAiService {
  constructor() {
    this.insightsService = new CustomerInsightsService();
    this.promotionService = new PromotionRecommendationService();
    this.emailService = new EmailPromotionGeneratorService();
    this.llmProvider = new LlmCustomerAiProvider();
  }

  async loadCustomerContext(customerId) {
    const customer = await Client.findById(customerId)
      .populate({ path: "affiliateProgram", select: "name points cardNumber" })
      .lean();

    if (!customer) return null;

    const orders = await Order.find({
      clients: { $elemMatch: { client: customer._id } },
    })
      .populate({ path: "product", populate: { path: "category" } })
      .populate("pointOfSales")
      .lean();

    const customerOrders = orders.map((order) => ({
      _id: order._id,
      pointOfSales: order.pointOfSales,
      product: order.product,
      quantity: order.clients.find(
        (c) => c.client.toString() === customer._id.toString()
      )?.quantity,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }));

    const catalogProducts = await Product.find()
      .populate("category")
      .lean();

    const globalAvg = await this.computeGlobalAverageOrderValue();

    return { customer, customerOrders, catalogProducts, globalAvg };
  }

  async computeGlobalAverageOrderValue() {
    const sample = await Order.find()
      .populate("product")
      .limit(200)
      .lean();
    if (!sample.length) return null;

    let total = 0;
    let count = 0;
    sample.forEach((order) => {
      const price = order.product?.price || 0;
      total += price * (order.totalQuantity || 1);
      count += 1;
    });
    return count ? total / count : null;
  }

  buildProfile(metrics) {
    return {
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
  }

  buildCheckout(metrics, insights, promotions) {
    const topInsight = insights[0]?.description || metrics.profileLabel;
    const promo = promotions[0] || null;

    return {
      summaryInsight: topInsight,
      profileLabel: metrics.profileLabel,
      preferredCategory: metrics.preferredCategory,
      promotion: promo
        ? {
            productName: promo.productName,
            discountPercent: promo.discountPercent,
            validDays: promo.validDays,
            motivation: promo.motivation,
          }
        : null,
    };
  }

  async getCustomerInsights(customerId) {
    const context = await this.loadCustomerContext(customerId);
    if (!context) return null;

    const { customer, customerOrders, catalogProducts, globalAvg } = context;
    const metrics = computeCustomerMetrics(customer, customerOrders);

    let insights = this.insightsService.generate({
      metrics,
      globalAverageOrderValue: globalAvg,
    });
    let promotions = this.promotionService.generate({
      metrics,
      catalogProducts,
    });

    if (isAiConfigured()) {
      const llmEnhancement = await this.llmProvider.enhance({
        customer,
        metrics,
        insights,
        promotions,
      });
      if (llmEnhancement?.insights?.length) insights = llmEnhancement.insights;
      if (llmEnhancement?.promotions?.length) promotions = llmEnhancement.promotions;
    }

    const profile = this.buildProfile(metrics);
    const checkout = this.buildCheckout(metrics, insights, promotions);

    return {
      profile,
      insights,
      promotions,
      checkout,
      source: isAiConfigured() ? "ai" : "heuristic",
      generatedAt: new Date().toISOString(),
    };
  }

  async generatePromoEmail({ customerId, promotionIndex = 0, lang = "it" }) {
    const context = await this.loadCustomerContext(customerId);
    if (!context) return null;

    const { customer, customerOrders, catalogProducts, globalAvg } = context;
    const metrics = computeCustomerMetrics(customer, customerOrders);
    const promotions = this.promotionService.generate({
      metrics,
      catalogProducts,
    });

    const promotion = promotions[promotionIndex] || promotions[0];
    if (!promotion) {
      return {
        subject: lang === "en" ? "WorkHub offer" : "Offerta WorkHub",
        body:
          lang === "en"
            ? "No promotion available for this customer."
            : "Nessuna promozione disponibile per questo cliente.",
        source: "heuristic",
      };
    }

    const customerName = `${customer.firstName || ""} ${customer.lastName || ""}`.trim();
    return this.emailService.generate({
      customerName,
      promotion,
      lang,
    });
  }
}

let defaultService;

export function getCustomerAiService() {
  if (!defaultService) defaultService = new CustomerAiService();
  return defaultService;
}

export async function getCustomerInsights(customerId) {
  return getCustomerAiService().getCustomerInsights(customerId);
}

export async function generateCustomerPromoEmail(options) {
  return getCustomerAiService().generatePromoEmail(options);
}
