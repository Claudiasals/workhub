import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import { useState, useEffect } from "react";

import { useLanguage } from "../../context/LanguageContext";
import AppFeedbackModal from "../../components/AppFeedbackModal";
import EditIcon from "../../components/EditIcon";

import {
  FloppyDiskIcon,
  XCircleIcon,
  FileXlsIcon,
} from "@phosphor-icons/react";

import CustomerAiInsightsCard from "../../components/customers/CustomerAiInsightsCard";
import {
  fetchCustomerByIdAsync,
  updateCustomerAsync,
  clearSelected,
  clearError,
} from "../../store/feature/customerSlice";

import * as XLSX from "xlsx";

const CustomersRegistry = () => {
  const { id } = useParams();
  const dispatch = useDispatch();

  const { t } = useLanguage();

  /* REDUX STATE */
  const { selected: customer, loading, error } = useSelector(
    (state) => state.customers
  );

  const token =
    useSelector((state) => state.auth?.token) ||
    localStorage.getItem("token");

  /* LOCAL UI STATE */
  const [isEditing, setIsEditing] = useState(false);
  const [editedCustomer, setEditedCustomer] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  /* FETCH CUSTOMER */
  useEffect(() => {
    if (!id || !token) return;

    dispatch(fetchCustomerByIdAsync({ id, token }));

    // Cleanup selected customer on unmount
    return () => dispatch(clearSelected());
  }, [dispatch, id, token]);

  /* SYNC EDIT STATE */
  useEffect(() => {
    if (customer) {
      setEditedCustomer(customer);
    }
  }, [customer]);

  /* ERROR HANDLING */
  useEffect(() => {
    if (!error) return;
    console.error("Customer error:", error);
    dispatch(clearError());
  }, [error, dispatch]);

  /* FORM CHANGE HANDLER - Supports nested fields (location.*)*/ 
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setEditedCustomer((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setEditedCustomer((prev) => ({ ...prev, [name]: value }));
    }
  };

  /* SAVE CUSTOMER CHANGES */
  const handleSave = async () => {
    if (!token || !id || !editedCustomer) return;

    try {
      setSaving(true);

      // Minimal payload sent to backend
      const payload = {
        firstName: editedCustomer.firstName,
        lastName: editedCustomer.lastName,
        email: editedCustomer.email,
        phoneNumber: editedCustomer.phoneNumber,
        fiscalCode: editedCustomer.fiscalCode,
        birthDate: editedCustomer.birthDate,
        location: editedCustomer.location,
      };

      await dispatch(
        updateCustomerAsync({
          id,
          updates: payload,
          token,
        })
      ).unwrap();

      setIsEditing(false);
      setShowSaved(true);
    } catch (err) {
      console.error("Save customer error:", err);
    } finally {
      setSaving(false);
    }
  };

  /* EXPORT AFFILIATION (EXCEL) */
  const exportAffiliateToExcel = () => {
    if (!customer?.affiliateProgram) return;

    const data = [
      {
        "Livello Tessera": customer.affiliateProgram.name || "N/A",
        "Punti Accumulati": customer.affiliateProgram.points || 0,
        "Numero Tessera": customer.affiliateProgram.cardNumber || "N/A",
        "Programma Fedeltà": "Attivo",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Affiliazione");

    XLSX.writeFile(
      wb,
      `Affiliazione_${customer.firstName}_${customer.lastName}.xlsx`
    );
  };

  /* EXPORT ORDERS (EXCEL) */
  const exportOrdersToExcel = () => {
    if (!customer?.orders?.length) return;

    const data = customer.orders.map((order) => ({
      "ID Ordine": order._id || "N/A",
      Prodotto: order.product?.name || "N/A",
      Quantità: order.quantity || 0,
      Prezzo: order.price || 0,
      "Data Ordine": order.createdAt
        ? new Date(order.createdAt).toLocaleDateString()
        : "N/A",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ordini");

    XLSX.writeFile(
      wb,
      `Ordini_${customer.firstName}_${customer.lastName}.xlsx`
    );
  };

  /* LOADING / EMPTY STATES */
  if (loading) {
    return (
      <div className="w-full min-h-screen">
        {t("caricamentoClienti")}
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="w-full min-h-screen">
        {t("clienteNonTrovato")}
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4 pb-8">
      <div className="flex justify-end">
        <Link
          to="/customers"
          className="ai-alert-toggle inline-flex w-fit text-[#090c64] dark:text-[#8ea2ff]"
        >
          {"< Torna alla lista clienti"}
        </Link>
      </div>

      <div className="grid w-full grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Anagrafica — sinistra */}
        <div className={`relative custom-box p-6 min-w-0${!customer.affiliateProgram ? " xl:col-span-2" : ""}`}>
        {/* Header actions */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="font-semibold">{t("anagrafica")}</h3>

          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="custom-button-light flex items-center gap-1"
            >
              <EditIcon color="#090c64" />
              {t("modifica")}
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="custom-button flex items-center gap-1"
              >
                <FloppyDiskIcon size={18} />
                {t("salva")}
              </button>
              <button
                onClick={() => {
                  setEditedCustomer(customer);
                  setIsEditing(false);
                }}
                className="custom-button-light flex items-center gap-1"
              >
                <XCircleIcon size={18} />
                {t("annulla")}
              </button>
            </div>
          )}
        </div>

        {/* Profile fields */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: "firstName", span: 1 },
            { key: "lastName", span: 1 },
            { key: "email", span: 2 },
            { key: "phoneNumber", span: 1 },
            { key: "fiscalCode", span: 1 },
            { key: "birthDate", span: 2, type: "date" },
            { key: "location.address", span: 2 },
            { key: "location.city", span: 1 },
            { key: "location.state", span: 1 },
            { key: "location.zipCode", span: 1 },
            { key: "location.country", span: 1 },
          ].map(({ key, span, type }) => (
            <div
              key={key}
              className={`bg-white/20 p-3 rounded-xl col-span-${span}`}
            >
              {isEditing ? (
                <input
                  type={type || "text"}
                  name={key}
                  value={
                    key.includes(".")
                      ? editedCustomer?.[key.split(".")[0]]?.[
                          key.split(".")[1]
                        ] || ""
                      : editedCustomer?.[key] || ""
                  }
                  onChange={handleChange}
                  className="bg-transparent outline-none w-full"
                />
              ) : (
                <span>
                  {key.includes(".")
                    ? customer?.[key.split(".")[0]]?.[
                        key.split(".")[1]
                      ] || "N/D"
                    : customer?.[key] || "N/D"}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

        {/* Affiliazione — destra di anagrafica */}
        {customer.affiliateProgram && (
          <div className="custom-box p-6 min-w-0">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="font-semibold">{t("affiliazione")}</h3>
              <button
                onClick={exportAffiliateToExcel}
                className="custom-button-light flex items-center gap-1"
              >
                <FileXlsIcon size={18} />
                Excel
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div className="glass-card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <strong>{t("livelloTessera")}:</strong>{" "}
                  {customer.affiliateProgram.name}
                </div>

                {customer.affiliateProgram.name === "standard" && (
                  <div className="rounded-xl bg-white/80 p-3 text-sm sm:max-w-[58%]">
                    {t("alRaggiungimentoDei")}{" "}
                    <strong>10 {t("ordini")}</strong>,{" "}
                    {t("laTesseraPassaAutomaticamenteDa")}{" "}
                    <strong>Standard</strong> &rarr; <strong>Premium</strong>.
                  </div>
                )}
              </div>

              <div className="glass-card">
                <strong>{t("puntiAccumulati")}:</strong>{" "}
                {customer.affiliateProgram.points}
              </div>
              <div className="glass-card">
                <strong>{t("numeroTessera")}:</strong>{" "}
                {customer.affiliateProgram.cardNumber}
              </div>
              <div className="glass-card">
                <strong>{t("programmaFedelta")}:</strong>{" "}
                {t("attivo")}
              </div>
            </div>
          </div>
        )}

        {/* Storico ordini — sinistra di AI Consumer Insight */}
        <div className="min-w-0 custom-box p-6">
        <div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="font-semibold">{t("storicoOrdini")}</h3>
            <button
              onClick={exportOrdersToExcel}
              className="custom-button-light flex items-center gap-1"
            >
              <FileXlsIcon size={18} />
              Excel
            </button>
          </div>

          {customer.orders?.length ? (
            <div className="flex flex-col gap-3">
              {customer.orders.map((order, idx) => (
                <div
                  key={idx}
                  className="glass-card grid grid-cols-1 gap-4 md:grid-cols-2"
                >
                  <div className="flex min-w-0 flex-col gap-2">
                    <div>
                      <strong>{t("numeroOrdine")}:</strong>{" "}
                      <span className="break-all">{order._id || "N/D"}</span>
                    </div>
                    <div>
                      <strong>{t("puntoVendita")}:</strong>{" "}
                      {order.pointOfSales?.name || "N/D"}
                    </div>
                    <div>
                      <strong>{t("data")}:</strong>{" "}
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString()
                        : "N/D"}
                    </div>
                  </div>

                  <div className="flex min-w-0 flex-col gap-2">
                    <div>
                      <strong>{t("prodotto")}:</strong>{" "}
                      {order.product?.name || "N/D"}
                    </div>
                    <div>
                      <strong>{t("prezzo")}:</strong>{" "}
                      {order.product?.price
                        ? `${order.product.price} \u20ac`
                        : "N/D"}
                    </div>
                    <div>
                      <strong>{t("quantita")}:</strong>{" "}
                      {order.quantity || 0}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card text-center">
              {t("nessunOrdineTrovato")}
            </div>
          )}
        </div>
        </div>

        {/* AI Consumer Insight — destra dello storico ordini */}
        <div className="min-w-0">
          <CustomerAiInsightsCard
            customer={customer}
            customerId={id}
            token={token}
          />
        </div>
      </div>

      <AppFeedbackModal
        open={showSaved}
        title={t("modaleSuccesso")}
        message={t("modificheSalvate")}
        tone="success"
        closeLabel={t("chiudi")}
        onClose={() => setShowSaved(false)}
      />
    </div>
  );
};

export default CustomersRegistry;
