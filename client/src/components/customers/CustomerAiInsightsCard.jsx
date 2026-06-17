import {
  LightbulbIcon,
  SparkleIcon,
  TargetIcon,
  UserCircleIcon,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";
import { AiBadge, AiLoadingIndicator } from "../ai/AiInsightPanel";
import AppFeedbackModal from "../AppFeedbackModal";
import {
  fetchCustomerAiInsightsRequest,
  generateCustomerPromoEmailRequest,
} from "../../api/aiApi";
import { analyzeCustomerAiLocal, buildPromoDisplayForCustomer, generatePromoEmailLocal } from "../../utils/customerAiAnalyzer";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";

function ProfileStat({ label, value }) {
  return (
    <div className="customer-ai-stat">
      <span className="customer-ai-stat__label">{label}</span>
      <span className="customer-ai-stat__value">{value}</span>
    </div>
  );
}

export function CustomerAiInsightsCard({
  customer,
  customerId,
  token,
  catalogProducts = [],
  compact = false,
  onDismiss,
}) {
  const { t, lang } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailModal, setEmailModal] = useState(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [promoDisplayModal, setPromoDisplayModal] = useState(null);
  const [promoIndex, setPromoIndex] = useState(0);

  const loadInsights = useCallback(async () => {
    if (!customerId) return;
    setLoading(true);
    setError("");
    try {
      if (token && /^[0-9a-fA-F]{24}$/.test(customerId)) {
        const result = await fetchCustomerAiInsightsRequest({ token, customerId });
        setData(result);
      } else if (customer) {
        setData(analyzeCustomerAiLocal(customer, catalogProducts));
      }
    } catch (err) {
      if (customer) {
        setData(analyzeCustomerAiLocal(customer, catalogProducts));
      } else {
        setError(err.message || t("aiError"));
      }
    } finally {
      setLoading(false);
    }
  }, [customerId, token, customer?._id, customer?.id, catalogProducts]);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  const handleSendEmail = async (index = promoIndex) => {
    const promotion = data?.promotions?.[index];
    if (!promotion || !customer) return;

    setEmailLoading(true);
    try {
      let emailData;
      if (token && /^[0-9a-fA-F]{24}$/.test(customerId)) {
        emailData = await generateCustomerPromoEmailRequest({
          token,
          customerId,
          promotionIndex: index,
          lang,
        });
      } else {
        emailData = generatePromoEmailLocal({ customer, promotion, lang });
      }
      setEmailModal(emailData);
    } catch (err) {
      setEmailModal(
        generatePromoEmailLocal({ customer, promotion, lang })
      );
    } finally {
      setEmailLoading(false);
    }
  };

  const handleShowToCustomer = async (index = promoIndex) => {
    const promotion = data?.promotions?.[index];
    if (!promotion || !customer) return;

    const display = buildPromoDisplayForCustomer({ customer, promotion, t, lang });

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(display.clipboardText);
        setPromoDisplayModal({ ...display, copied: true });
        return;
      }
    } catch {
      // Mostra comunque il modal se la clipboard non è disponibile
    }

    setPromoDisplayModal(display);
  };

  const profile = data?.profile;
  const promotion = data?.promotions?.[promoIndex] || data?.promotions?.[0];

  return (
    <>
      <section
        className={`customer-ai-card app-surface ${compact ? "customer-ai-card--compact" : ""} ${
          isDark ? "text-white" : "text-[#090c64]"
        }`}
      >
        <div className="customer-ai-card__header">
          <div className="flex items-center gap-2 min-w-0">
            <SparkleIcon size={22} weight="duotone" className="shrink-0" />
            <div className="min-w-0">
              <h3 className="text-sm font-bold">{t("customerAiTitle")}</h3>
              {!compact && (
                <p className="text-xs opacity-75">{t("customerAiDesc")}</p>
              )}
            </div>
            <AiBadge source={data?.source} />
          </div>
          {compact && onDismiss && (
            <button type="button" onClick={onDismiss} className="custom-button-light text-xs">
              {t("customerAiDismiss")}
            </button>
          )}
        </div>

        {loading && !data && <AiLoadingIndicator className="mt-2" />}
        {error && <p className="text-xs text-red-500">{error}</p>}

        {profile && (
          <div className="customer-ai-profile">
            <div className="customer-ai-profile__badge">
              <UserCircleIcon size={18} weight="duotone" />
              {profile.label}
            </div>
            <div className="customer-ai-profile__grid">
              <ProfileStat label={t("customerAiPreferredCategory")} value={profile.preferredCategory} />
              <ProfileStat
                label={t("customerAiPurchaseFrequency")}
                value={
                  profile.purchaseFrequencyDays
                    ? t("customerAiEveryDays").replace("{days}", String(profile.purchaseFrequencyDays))
                    : "N/D"
                }
              />
              <ProfileStat
                label={t("customerAiAvgOrder")}
                value={profile.averageOrderValue ? `€${profile.averageOrderValue}` : "N/D"}
              />
              <ProfileStat label={t("customerAiLoyaltyLevel")} value={profile.loyaltyLevel} />
            </div>
          </div>
        )}

        {data?.insights?.length > 0 && (
          <div className="customer-ai-section">
            <h4 className="customer-ai-section__title">
              <LightbulbIcon size={16} weight="duotone" />
              {t("customerAiInsightsTitle")}
            </h4>
            <ul className="customer-ai-list">
              {data.insights.slice(0, compact ? 2 : 6).map((item, i) => (
                <li key={`${item.title}-${i}`} className="customer-ai-list__item customer-ai-list__item--insight">
                  <span>{item.description}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {data?.promotions?.length > 0 && (
          <div className="customer-ai-section">
            <h4 className="customer-ai-section__title">
              <TargetIcon size={16} weight="duotone" />
              {t("customerAiPromotionsTitle")}
            </h4>
            {data.promotions.length > 1 && !compact && (
              <div className="customer-ai-promo-tabs">
                {data.promotions.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPromoIndex(i)}
                    className={`customer-ai-promo-tabs__btn${
                      promoIndex === i ? " is-active" : ""
                    }`}
                    aria-pressed={promoIndex === i}
                  >
                    {t("customerAiPromoOption").replace("{n}", String(i + 1))}
                  </button>
                ))}
              </div>
            )}
            {promotion && (
              <div className="customer-ai-promo">
                <p className="customer-ai-promo__title">
                  🎯 {t("customerAiRecommendedPromo")}: {promotion.discountPercent}% {t("customerAiOn")}{" "}
                  {promotion.productName}
                </p>
                <p className="customer-ai-promo__meta">
                  {t("customerAiValidDays").replace("{days}", String(promotion.validDays))}
                </p>
                <p className="customer-ai-promo__motivation">{promotion.motivation}</p>
                {promotion.recentProducts?.length > 0 && (
                  <ul className="customer-ai-promo__recent">
                    {promotion.recentProducts.map((name) => (
                      <li key={name}>• {name}</li>
                    ))}
                  </ul>
                )}
                <div className="customer-ai-promo__actions">
                  <button
                    type="button"
                    className="custom-button text-xs"
                    onClick={() => handleSendEmail(promoIndex)}
                    disabled={emailLoading}
                  >
                    {emailLoading ? t("aiLoading") : t("customerAiSendPromo")}
                  </button>
                  <button
                    type="button"
                    className="custom-button-light text-xs"
                    onClick={() => handleShowToCustomer(promoIndex)}
                  >
                    {t("customerAiShowToCustomer")}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <AppFeedbackModal
        open={Boolean(emailModal)}
        title={emailModal?.subject || t("customerAiEmailTitle")}
        message={emailModal?.body || ""}
        tone="success"
        closeLabel={t("chiudi")}
        onClose={() => setEmailModal(null)}
      />

      <AppFeedbackModal
        open={Boolean(promoDisplayModal)}
        title={promoDisplayModal?.title || t("customerAiPromoShowTitle")}
        message={
          promoDisplayModal?.copied
            ? `${promoDisplayModal.body}\n\n${t("customerAiPromoCopied")}`
            : promoDisplayModal?.body || ""
        }
        tone="info"
        closeLabel={t("chiudi")}
        onClose={() => setPromoDisplayModal(null)}
      />
    </>
  );
}

export function CustomerCheckoutAiPanel(props) {
  return <CustomerAiInsightsCard {...props} compact />;
}

export default CustomerAiInsightsCard;
