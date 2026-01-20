import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import jsPDF from "jspdf";

import {
  SignOutIcon,
  WarehouseIcon,
  NoteIcon,
  PaperclipIcon,
  FilePdfIcon,
} from "@phosphor-icons/react";

import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";

const Product = () => {
  // Get product ID from URL
  const { id } = useParams();

  // Theme and translations
  const { theme } = useTheme();
  const { t } = useLanguage();

  // Local state
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch product by ID
  useEffect(() => {
    fetch(`http://localhost:3030/api/v1/items/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setItem(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading product:", err);
        setLoading(false);
      });
  }, [id]);

  // Export product data as PDF
  const handleExportPDF = () => {
    if (!item || !item.product) return;

    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Product sheet", 20, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);

    doc.text(`Item ID: ${item._id}`, 20, 40);
    doc.text(`Name: ${item.product.name}`, 20, 50);
    doc.text(`SKU: ${item.product.sku}`, 20, 60);
    doc.text(
      `Category: ${item.product.category?.name || "N/A"}`,
      20,
      70
    );
    doc.text(`Stock: ${item.stock}`, 20, 80);
    doc.text(`Reorder limit: ${item.stockLimit}`, 20, 90);
    doc.text(`Notes: ${item.note || "-"}`, 20, 100);

    // Add product image if available
    if (item.product.image) {
      const img = new Image();
      img.src = item.product.image;

      img.onload = () => {
        doc.addImage(img, "JPEG", 20, 110, 60, 60);
        doc.save(`Product_${item.product.name}.pdf`);
      };

      img.onerror = () => {
        console.error("Image load failed");
        doc.save(`Product_${item.product.name}.pdf`);
      };
    } else {
      doc.save(`Product_${item.product.name}.pdf`);
    }
  };

  // Loading state
  if (loading) {
    return <div className="text-center mt-10">Loading...</div>;
  }

  // Product not found
  if (!item) {
    return (
      <div className="w-full min-h-screen flex flex-col justify-center items-center bg-[#f0f4f8] text-[#090c64]">
        <h2 className="text-2xl font-bold mb-4">
          {t("prodottoNonTrovato")}
        </h2>
        <Link
          to="/warehouse"
          className="bg-[#fafafa]/50 text-[#090c64] font-semibold px-6 py-3 rounded-full shadow-md hover:bg-white/80 transition-all"
        >
          {t("tornaAllaLista")}
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex justify-center items-start p-8">
      <div className="w-full max-w-[1200px] p-6 flex flex-col gap-8">

        {/* PRODUCT DETAILS */}
        <div className="rounded-2xl bg-[#fafafa]/10 backdrop-blur-sm p-6 shadow-md flex flex-col gap-2">

          {/* Header row */}
          <div className="flex items-center justify-between mb-4">
            <span className="font-bold text-3xl">
              {item.product.name}
            </span>
            <Link
              to="/warehouse"
              className="w-12 h-12 flex items-center justify-center bg-white/50 rounded-full shadow-md hover:bg-white/70 transition-all"
            >
              <SignOutIcon
                size={32}
                color={theme === "dark" ? "white" : "#090c64"}
                weight="duotone"
              />
            </Link>
          </div>

          {/* Product info + image */}
          <div className="grid grid-cols-2 gap-6 items-start">

            {/* Product info */}
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 bg-white/40 rounded-lg p-2 shadow-sm">
                <span>{t("id")}</span>
                <span className="break-all">{item._id}</span>
              </div>

              <div className="grid grid-cols-2 bg-white/40 rounded-lg p-2 shadow-sm">
                <span>{t("nomeProdotto")}</span>
                <span>{item.product.name}</span>
              </div>

              <div className="grid grid-cols-2 bg-white/40 rounded-lg p-2 shadow-sm">
                <span>SKU</span>
                <span>{item.product.sku}</span>
              </div>

              <div className="grid grid-cols-2 bg-white/40 rounded-lg p-2 shadow-sm">
                <span>{t("categoria")}</span>
                <span>{item.product.category?.name || "N/D"}</span>
              </div>

              <div className="grid grid-cols-2 bg-white/40 rounded-lg p-2 shadow-sm">
                <span>{t("quantita")}</span>
                <span>{item.stock}</span>
              </div>

              <div className="grid grid-cols-2 bg-white/40 rounded-lg p-2 shadow-sm">
                <span>{t("sogliaRiordino")}</span>
                <span>{item.stockLimit}</span>
              </div>
            </div>

            {/* Product image */}
            <div className="flex items-center justify-center">
              {item.product?.image ? (
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="max-h-80 object-contain rounded-2xl shadow-md bg-white/30"
                />
              ) : (
                <div className="w-full h-80 rounded-2xl bg-white/30 flex items-center justify-center shadow-md">
                  {t("nessunaImmagine")}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* NOTES & ATTACHMENTS */}
        <div className="rounded-2xl bg-[#fafafa]/10 backdrop-blur-sm p-6 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <NoteIcon
              size={32}
              color={theme === "dark" ? "white" : "#090c64"}
              weight="duotone"
            />
            <h3 className="text-[#090c64] text-lg font-bold">
              {t("noteAllegati")}
            </h3>
          </div>

          <textarea
            placeholder={t("aggiungiNota")}
            className="w-full p-3 rounded-xl bg-white/40 text-[#090c64] shadow-sm mb-4"
            rows={4}
          />

          <label className="flex items-center gap-2 cursor-pointer bg-[#fafafa]/50 text-[#090c64] font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-white/80 transition-all">
            <PaperclipIcon
              size={28}
              color={theme === "dark" ? "white" : "#090c64"}
              weight="duotone"
            />
            <input type="file" hidden />
            {t("scegliFile")}
          </label>
        </div>

        {/* AVAILABILITY & ACTIONS */}
        <div className="flex gap-4">

          {/* Availability */}
          <div className="flex-1 rounded-2xl bg-[#fafafa]/10 backdrop-blur-sm p-6 shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <WarehouseIcon
                size={32}
                color={theme === "dark" ? "white" : "#090c64"}
                weight="duotone"
              />
              <h3 className="text-[#090c64] text-lg font-bold">
                {t("disponibilita")}
              </h3>
            </div>

            <div className="bg-white/40 rounded-xl p-3 shadow-sm">
              {item.stock} {t("pezzi")}
            </div>
          </div>

          {/* Export PDF */}
          <div className="flex-1 flex items-center justify-center">
            <button
              onClick={handleExportPDF}
              className="bg-[#fafafa]/50 font-semibold px-6 py-3 rounded-xl shadow-md hover:bg-white/80 transition-all flex items-center gap-2"
            >
              <FilePdfIcon
                size={28}
                color={theme === "dark" ? "white" : "#090c64"}
                weight="duotone"
              />
              {t("esportaPDF")}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Product;
