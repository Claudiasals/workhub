import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateItemQuantity } from "../../store/feature/itemsSlice";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import bgLight from "../../assets/bg/bg.jpg";
import bgDark from "../../assets/bg/bgScuro.jpg";

const DrawerAddNewProduct = ({ open, onClose }) => {
  const dispatch = useDispatch();

  // Items list from redux store
  const items = useSelector((state) => state.items.list);

  // Logged user's workplace ID
  const userWorkplaceId = useSelector(
    (state) => state.auth.user?.workplace?._id
  );

  // Local UI state
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [quantity, setQuantity] = useState("");

  const { theme } = useTheme();
  const { t } = useLanguage();

  // Closes drawer on ESC key press
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    if (open) document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // Resets local state when drawer closes
  useEffect(() => {
    if (!open) {
      setSearch("");
      setResults([]);
      setQuantity("");
    }
  }, [open]);

  // Parsed numeric quantity value
  const qty = useMemo(() => Number(quantity), [quantity]);

  // Searches items belonging to the user's workplace
  const searchItems = () => {
    if (!search.trim()) return;

    const filtered = items.filter((item) => {
      if (!item?.product) return false;

      const sameWorkplace =
        String(item.pointOfSales?._id) === String(userWorkplaceId);

      const matchesSearch =
        item.product?.name
          ?.toLowerCase()
          .includes(search.toLowerCase()) ||
        item.product?.sku
          ?.toLowerCase()
          .includes(search.toLowerCase());

      return sameWorkplace && matchesSearch;
    });

    if (filtered.length === 0) {
      setResults([
        {
          error:
            t("prodottoNonPresenteNellaTuaSede") ||
            "Product not available in your workplace",
        },
      ]);
      return;
    }

    filtered.sort((a, b) => b.stock - a.stock);
    setResults(filtered);
  };

  // Adds stock quantity to selected item
  const handleAddStock = async (itemId) => {
    if (!qty || qty <= 0) {
      alert(t("inserisciQuantitaValida"));
      return;
    }

    try {
      const resultAction = await dispatch(
        updateItemQuantity({ id: itemId, quantityToAdd: qty })
      );

      if (updateItemQuantity.fulfilled.match(resultAction)) {
        alert(`${t("stockAggiornato")} ${resultAction.payload.stock}`);
        setQuantity("");
        setSearch("");
        setResults([]);
        onClose?.();
      } else {
        const err = resultAction.payload || resultAction.error?.message;
        alert(`${t("errore")} ${err}`);
      }
    } catch (err) {
      console.error(err);
      alert(t("erroreImprevisto"));
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      <aside
        className="drawer-panel"
        role="dialog"
        aria-modal="true"
        style={{
          backgroundImage: `url(${theme === "dark" ? bgDark : bgLight})`,
        }}
      >
        <header className="drawer-header">
          <h2 className="text-base font-semibold">
            {t("aggiungiStock")}
          </h2>

          <button onClick={onClose} className="custom-button text-sm">
            {t("chiudi")}
          </button>
        </header>

        <div className="drawer-content">
          <label className="drawer-label">
            {t("nomeProdottoSku")}
          </label>

          <input
            type="text"
            placeholder="Es. BILLY Libreria o SKU1234"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="drawer-input"
          />

          <label className="drawer-label">
            {t("quantitaDaAggiungere")}
          </label>

          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="drawer-input"
            min={1}
            placeholder="Es. 5"
          />

          <button
            onClick={searchItems}
            className="custom-button text-sm mb-6"
          >
            {t("cercaProdotto")}
          </button>

          <div className="flex flex-col gap-4">
            {results.length === 0 && (
              <p className="opacity-70">
                {t("nessunaRicercaEffettuata")}
              </p>
            )}

            {results.map((item, i) => {
              if (item.error) {
                return (
                  <p key={`err-${i}`} className="text-red-600">
                    {item.error}
                  </p>
                );
              }

              return (
                <div key={item._id} className="glass-card">
                  <span>
                    <strong>{t("prodotto")}:</strong>{" "}
                    {item.product?.name}
                  </span>

                  <span>
                    <strong>SKU:</strong>{" "}
                    {item.product?.sku}
                  </span>

                  <span>
                    <strong>{t("point")}:</strong>{" "}
                    {item.pointOfSales?.name}
                  </span>

                  <span>
                    <strong>{t("stock")}:</strong>{" "}
                    {item.stock}
                  </span>

                  <button
                    onClick={() => handleAddStock(item._id)}
                    disabled={!qty || qty <= 0}
                    className="custom-button text-sm mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t("aggiungi")}
                    {quantity ? ` ${quantity} ${t("pezzi")}` : ""}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </aside>
    </div>
  );
};

export default DrawerAddNewProduct;
