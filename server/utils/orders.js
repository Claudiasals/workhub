import { AppConfig } from "../config/app.js";

const { affiliate } = AppConfig;

// Calculates affiliate points based on order amount and affiliate tier
export const calculateAffiliatePoints = (
  orderAmount,
  affiliateType = "standard"
) => {
  // Validate order amount
  if (typeof orderAmount !== "number" || orderAmount < 0) return 0;

  // Fallback to standard affiliate if type is invalid
  if (!affiliateType || !affiliate[affiliateType]) {
    affiliateType = "standard";
  }

  const {
    AFFILIATE_POINTS_FOREACH_UNIT,
    AFFILIATE_POINTS_UNIT,
  } = affiliate[affiliateType];

  // Minimum amount required to earn points
  if (orderAmount < AFFILIATE_POINTS_UNIT) return 0;

  // Calculate earned points
  return (
    Math.floor(orderAmount / AFFILIATE_POINTS_UNIT) *
    AFFILIATE_POINTS_FOREACH_UNIT
  );
};
