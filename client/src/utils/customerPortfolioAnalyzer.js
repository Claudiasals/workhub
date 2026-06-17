import { subMonths, startOfMonth } from "date-fns";
import { analyzeSalesCommercialLocal } from "./salesCommercialAnalyzer";

const MS_DAY = 86400000;
const INACTIVE_DAYS = 90;
const UPGRADE_MIN_ORDERS = 5;
const UPGRADE_MIN_POINTS = 80;

function percentChange(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function normalizeTier(name) {
  return String(name || "standard").toLowerCase();
}

function isPremiumCustomer(customer) {
  return normalizeTier(customer?.affiliateProgram?.name) === "premium";
}

function getCustomerId(customer) {
  return customer?._id?.toString?.() || customer?.id?.toString?.() || null;
}

function buildCustomerOrderStats(orders = []) {
  const map = new Map();

  orders.forEach((order) => {
    const date = new Date(order.createdAt || order.updatedAt);
    if (Number.isNaN(date.getTime())) return;

    (order.clients || []).forEach((row) => {
      const customerId =
        row.customer?._id?.toString?.() ||
        row.customer?.toString?.() ||
        row.customerId?.toString?.();
      if (!customerId) return;

      if (!map.has(customerId)) {
        map.set(customerId, {
          orderCount: 0,
          lastOrderAt: 0,
          involvesPremium: false,
        });
      }

      const stat = map.get(customerId);
      stat.orderCount += 1;
      const ts = date.getTime();
      if (ts > stat.lastOrderAt) stat.lastOrderAt = ts;
    });
  });

  return map;
}

function portfolioInsight(type, title, description) {
  return { type, title, description };
}

function portfolioSuggestion(severity, title, description) {
  return { severity, title, description, message: description ? `${title} — ${description}` : title };
}

function demoPortfolio() {
  return {
    source: "heuristic",
    isDemo: true,
    insights: [
      portfolioInsight(
        "success",
        "Tasso di ritorno clienti: 64%",
        "Due clienti su tre tornano ad acquistare entro 60 giorni."
      ),
      portfolioInsight(
        "success",
        "Nuovi clienti +9% rispetto al trimestre precedente",
        "La crescita del portafoglio resta positiva nel confronto trimestrale."
      ),
      portfolioInsight(
        "warning",
        "12 clienti inattivi da oltre 90 giorni",
        "Segmento a rischio churn: priorità a campagna di riattivazione."
      ),
      portfolioInsight(
        "info",
        "18 clienti Premium generano il 43% degli ordini",
        "Il livello Premium concentra quasi metà del volume commerciale."
      ),
      portfolioInsight(
        "promo",
        "8 clienti Standard mostrano comportamenti compatibili con il livello Premium",
        "Candidati ideali per upgrade tessera e promo mirate."
      ),
    ],
    database: {
      total: 327,
      newLastQuarter: 35,
      recurring: 210,
      inactive: 27,
      premium: 54,
    },
    suggestions: [
      portfolioSuggestion(
        "high",
        "Campagna riattivazione clienti inattivi",
        "Invia promo win-back del 10% ai 12 clienti senza acquisti da 90+ giorni."
      ),
      portfolioSuggestion(
        "medium",
        "Percorso upgrade Standard → Premium",
        "Proponi upgrade tessera ai 8 clienti Standard con frequenza e spesa da Premium."
      ),
      portfolioSuggestion(
        "medium",
        "Proteggi il cluster Premium",
        "I 18 clienti Premium meritano comunicazioni dedicate: early access e bundle esclusivi."
      ),
      portfolioSuggestion(
        "low",
        "Onboarding nuovi clienti trimestre",
        "Automatizza un follow-up a 14 giorni per i 35 nuovi clienti acquisiti."
      ),
    ],
    kpis: {
      returnRate: 64,
      conversionRows: [],
    },
  };
}

export function analyzeCustomerPortfolioLocal({
  customers = [],
  orders = [],
  items = [],
} = {}) {
  const sales = analyzeSalesCommercialLocal({ customers, orders, items });
  const orderStats = buildCustomerOrderStats(orders);
  const now = Date.now();
  const quarterStart = startOfMonth(subMonths(new Date(), 3)).getTime();
  const prevQuarterStart = startOfMonth(subMonths(new Date(), 6)).getTime();

  const hasRealData =
    customers.length > 0 ||
    orders.length > 0 ||
    orderStats.size > 0;

  if (!hasRealData) {
    return { ...demoPortfolio(), kpis: sales.kpis };
  }

  const premiumCustomers = customers.filter(isPremiumCustomer);
  const premiumIds = new Set(
    premiumCustomers.map(getCustomerId).filter(Boolean)
  );

  let inactiveCount = 0;
  let recurringCount = 0;
  let upgradeCandidates = 0;
  let newLastQuarter = 0;
  let newPrevQuarter = 0;
  let activeLast90 = 0;
  let returningLast90 = 0;

  customers.forEach((customer) => {
    const id = getCustomerId(customer);
    const stat = id ? orderStats.get(id) : null;
    const createdAt = new Date(customer.createdAt || customer.updatedAt).getTime();
    const points = Number(customer.affiliateProgram?.points || 0);
    const tier = normalizeTier(customer.affiliateProgram?.name);

    if (!Number.isNaN(createdAt)) {
      if (createdAt >= quarterStart) newLastQuarter += 1;
      else if (createdAt >= prevQuarterStart && createdAt < quarterStart) {
        newPrevQuarter += 1;
      }
    }

    if (stat && stat.orderCount >= 2) recurringCount += 1;

    const daysSinceOrder = stat?.lastOrderAt
      ? Math.floor((now - stat.lastOrderAt) / MS_DAY)
      : null;

    if (daysSinceOrder == null || daysSinceOrder > INACTIVE_DAYS) {
      inactiveCount += 1;
    }

    if (
      tier === "standard" &&
      stat &&
      (stat.orderCount >= UPGRADE_MIN_ORDERS || points >= UPGRADE_MIN_POINTS)
    ) {
      upgradeCandidates += 1;
    }

    if (stat && daysSinceOrder != null && daysSinceOrder <= INACTIVE_DAYS) {
      activeLast90 += 1;
      if (stat.orderCount >= 2) returningLast90 += 1;
    }
  });

  const newClientsChange = percentChange(newLastQuarter, newPrevQuarter);
  const returnRate =
    activeLast90 > 0
      ? Math.round((returningLast90 / activeLast90) * 100)
      : sales.kpis?.returnRate ?? 0;

  let premiumOrderCount = 0;
  orders.forEach((order) => {
    const involvesPremium = (order.clients || []).some((row) => {
      const customerId =
        row.customer?._id?.toString?.() ||
        row.customer?.toString?.() ||
        row.customerId?.toString?.();
      return customerId && premiumIds.has(customerId);
    });
    if (involvesPremium) premiumOrderCount += 1;
  });

  const premiumOrderShare =
    orders.length > 0
      ? Math.round((premiumOrderCount / orders.length) * 100)
      : 0;

  const insights = [];

  if (returnRate > 0) {
    insights.push(
      portfolioInsight(
        returnRate >= 50 ? "success" : "warning",
        `Tasso di ritorno clienti: ${returnRate}%`,
        returnRate >= 50
          ? "La maggior parte dei clienti attivi torna ad acquistare regolarmente."
          : "Il tasso di ritorno è sotto la soglia ideale: priorità alla fidelizzazione."
      )
    );
  }

  if (newLastQuarter > 0 || newPrevQuarter > 0) {
    const sign = newClientsChange > 0 ? "+" : "";
    insights.push(
      portfolioInsight(
        newClientsChange >= 0 ? "success" : "warning",
        `Nuovi clienti ${sign}${newClientsChange}% rispetto al trimestre precedente`,
        `Ultimo trimestre: ${newLastQuarter} nuovi clienti contro ${newPrevQuarter} nel periodo precedente.`
      )
    );
  }

  if (inactiveCount > 0) {
    insights.push(
      portfolioInsight(
        "warning",
        `${inactiveCount} clienti inattivi da oltre ${INACTIVE_DAYS} giorni`,
        "Segmento a rischio churn: valuta una campagna di riattivazione mirata."
      )
    );
  }

  if (premiumCustomers.length > 0 && premiumOrderShare > 0) {
    insights.push(
      portfolioInsight(
        "info",
        `${premiumCustomers.length} clienti Premium generano il ${premiumOrderShare}% degli ordini`,
        "Il livello Premium pesa in modo significativo sul volume commerciale complessivo."
      )
    );
  }

  if (upgradeCandidates > 0) {
    insights.push(
      portfolioInsight(
        "promo",
        `${upgradeCandidates} clienti Standard mostrano comportamenti compatibili con il livello Premium`,
        "Candidati ideali per upgrade tessera e promozioni personalizzate."
      )
    );
  }

  const suggestions = [];

  if (inactiveCount > 0) {
    suggestions.push(
      portfolioSuggestion(
        inactiveCount >= 10 ? "high" : "medium",
        "Campagna riattivazione clienti inattivi",
        `Invia promo win-back ai ${inactiveCount} clienti senza acquisti da ${INACTIVE_DAYS}+ giorni.`
      )
    );
  }

  if (upgradeCandidates > 0) {
    suggestions.push(
      portfolioSuggestion(
        "medium",
        "Percorso upgrade Standard → Premium",
        `Proponi upgrade tessera ai ${upgradeCandidates} clienti Standard con frequenza e spesa elevate.`
      )
    );
  }

  if (premiumCustomers.length > 0) {
    suggestions.push(
      portfolioSuggestion(
        "medium",
        "Proteggi il cluster Premium",
        `Comunicazioni dedicate per ${premiumCustomers.length} clienti Premium: early access e bundle esclusivi.`
      )
    );
  }

  if (newLastQuarter > 0) {
    suggestions.push(
      portfolioSuggestion(
        "low",
        "Onboarding nuovi clienti trimestre",
        `Automatizza un follow-up a 14 giorni per i ${newLastQuarter} nuovi clienti acquisiti.`
      )
    );
  }

  if (insights.length < 3 && sales.insights?.length) {
    sales.insights.slice(0, 2).forEach((item) => {
      suggestions.push(
        portfolioSuggestion(
          item.type === "warning" || item.type === "critical" ? "medium" : "low",
          item.title,
          item.description
        )
      );
    });
  }

  return {
    source: "heuristic",
    isDemo: sales.isDemo,
    insights: insights.slice(0, 6),
    database: {
      total: customers.length,
      newLastQuarter,
      recurring: recurringCount,
      inactive: inactiveCount,
      premium: premiumCustomers.length,
    },
    suggestions: suggestions.slice(0, 6),
    kpis: sales.kpis,
  };
}
