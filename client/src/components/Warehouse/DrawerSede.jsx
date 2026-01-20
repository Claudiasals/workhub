import { useState, useEffect } from "react";
import { useLanguage } from "../../context/LanguageContext";
import bgLight from "../../assets/bg/bg.jpg";

const DrawerSede = ({ open, onClose, productData, userWorkplaceId }) => {
  // Product name search input
  const [searchName, setSearchName] = useState("");

  // Search results state
  const [results, setResults] = useState([]);

  const { t } = useLanguage();

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

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      <aside
        className="absolute right-0 top-0 w-[420px] h-full
                   border-l border-white/40 shadow-2xl
                   overflow-auto bg-cover bg-center"
        role="dialog"
        aria-modal="true"
        style={{ backgroundImage: `url(${bgLight})` }}
      >
        <header className="sticky top-0 border-b border-white/60 px-6 py-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#090c64]">
            {t("disponibilitaAltreSedi")}
          </h2>

          <button
            onClick={onClose}
            className="custom-button text-sm bg-[#090c64] text-white"
          >
            {t("chiudi")}
          </button>
        </header>

        <div className="p-6 text-[15px] text-[#090c64]">
          <label className="block mb-2 font-semibold">
            {t("nomeProdotto")}
          </label>

          <input
            type="text"
            placeholder="Es. BILLY Libreria"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="w-full mb-4 px-3 py-2 border rounded-xl"
          />

          <button
            onClick={searchStores}
            className="custom-button text-sm bg-[#090c64] text-white mb-6"
          >
            {t("cercaDisponibilita")}
          </button>

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
};

export default DrawerSede;
