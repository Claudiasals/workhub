import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "../../context/LanguageContext";
import bgLight from "../../assets/bg/bg.jpg";
import bgDark from "../../assets/bg/bgScuro.jpg";
import { useTheme } from "../../context/ThemeContext";

const DrawerSede = ({ open, onClose, productData, userWorkplaceId }) => {
  // Product name search input
  const [searchName, setSearchName] = useState("");

  // Search results state
  const [results, setResults] = useState([]);

  const { t } = useLanguage();
  const { theme } = useTheme();

  // Closes drawer on ESC key press
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    if (open) document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // Resets search state when drawer closes
  useEffect(() => {
    if (!open) {
      setSearchName("");
      setResults([]);
    }
  }, [open]);

  // Searches product availability in other workplaces
  const searchStores = () => {
    if (!searchName.trim()) return;

    const filtered = productData.filter((item) => {
      const matchesProductName = item.product?.name
        ?.toLowerCase()
        .includes(searchName.toLowerCase());

      const isDifferentStore =
        String(item.pointOfSales?._id) !== String(userWorkplaceId);

      return matchesProductName && isDifferentStore;
    });

    if (filtered.length === 0) {
      setResults([
        {
          error: t("prodottoNonTrovato") || "Product not found",
        },
      ]);
      return;
    }

    filtered.sort((a, b) => b.stock - a.stock);
    setResults(filtered);
  };

  if (!open) return null;

  const content = (
    <div className="drawer-root">
      <div className="drawer-overlay" onClick={onClose} />

      <aside
        className="drawer-panel"
        role="dialog"
        aria-modal="true"
        style={{ "--drawer-bg-image": `url(${theme === "dark" ? bgDark : bgLight})` }}
      >
        <header className="drawer-header">
          <h2 className="text-base font-semibold">
            {t("disponibilitaAltreSedi")}
          </h2>

          <button
            onClick={onClose}
            className="custom-button text-sm"
          >
            {t("chiudi")}
          </button>
        </header>

        <div className="drawer-content">
          <label className="drawer-label">
            {t("nomeProdotto")}
          </label>

          <input
            type="text"
            placeholder="Es. BILLY Libreria"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                searchStores();
              }
            }}
            className="drawer-search mb-4"
          />

          <div className="mb-6 flex justify-end">
            <button
              onClick={searchStores}
              className="custom-button text-sm"
            >
              {t("cercaDisponibilita")}
            </button>
          </div>

          {results.length === 0 ? (
            <p className="opacity-70">
              {t("nessunaRicercaEffettuata")}
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {results.map((item, index) => {
                if (item.error) {
                  return (
                    <p key={`error-${index}`} className="text-red-600">
                      {item.error}
                    </p>
                  );
                }

                return (
                  <div key={index} className="glass-card">
                    <span>
                      <strong>{t("prodotto")}:</strong>{" "}
                      {item.product?.name}
                    </span>

                    <span>
                      <strong>{t("point")}:</strong>{" "}
                      {item.pointOfSales?.name}
                    </span>

                    <span>
                      <strong>{t("stock")}:</strong>{" "}
                      {item.stock} {t("pezzi")}
                    </span>

                    <span>
                      <strong>{t("stockLimit")}:</strong>{" "}
                      {item.stockLimit}
                    </span>

                    {item.promo?.isActive && (
                      <span>
                        <strong>{t("promo")}:</strong>{" "}
                        {item.promo.value}
                        {item.promo.mode === "percentage"
                          ? "%"
                          : "€"}
                      </span>
                    )}

                    {item.note && (
                      <span>
                        <strong>{t("note")}:</strong>{" "}
                        {item.note}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    </div>
  );

  return createPortal(content, document.body);
};

export default DrawerSede;
