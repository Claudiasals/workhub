import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { TrashIcon } from "@phosphor-icons/react";

import Drawer from "../components/Drawer";
import OrdersTable from "../components/Orders/OrdersTable";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

import {
  createOrder,
  fetchOrders,
  deleteOrder,
} from "../store/feature/orderSlice";
import { fetchProducts } from "../store/feature/productsSlice";
import { fetchPointsOfSalesAsync } from "../store/feature/pointOfSalesSlice";
import { fetchCustomersAsync } from "../store/feature/customerSlice";
import { CustomerCheckoutAiPanel } from "../components/customers/CustomerAiInsightsCard";

const OrderPage = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const dispatch = useDispatch();

  // Orders table column keys
  const orderColumns = [
    "prodotto",
    "quantità totale",
    "data",
    "stato",
    "corriere",
    "totale",
  ];

  // Drawer visibility state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);

  // New order form state
  const [clientRows, setClientRows] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedPointOfSaleId, setSelectedPointOfSaleId] = useState("");
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [checkoutAiDismissed, setCheckoutAiDismissed] = useState(false);

  // Redux state
  const token = useSelector((state) => state.auth.token);
  const products = useSelector((state) => state.products.list);
  const pointOfSales = useSelector((state) => state.pos.list);
  const customers = useSelector((state) => state.customers.list);
  const orders = useSelector((state) => state.orders.items);

  // Initial data loading
  useEffect(() => {
    if (!token) return;

    dispatch(fetchOrders({ token }));
    dispatch(fetchProducts(token));
    dispatch(fetchPointsOfSalesAsync({ token }));
    dispatch(fetchCustomersAsync(token));
  }, [dispatch, token]);

  // Adds a new client row
  const handleAddClientRow = () => {
    setClientRows((prev) => [...prev, { customerId: "", qty: "" }]);
  };

  // Updates a client row field
  const handleClientChange = (index, field, value) => {
    setClientRows((prev) =>
      prev.map((row, i) =>
        i === index ? { ...row, [field]: value } : row
      )
    );
  };

  // Total quantity assigned to clients
  const totalClientQty = useMemo(
    () => clientRows.reduce((sum, r) => sum + (Number(r.qty) || 0), 0),
    [clientRows]
  );

  // Detects duplicate client selections
  const hasDuplicateClients = useMemo(() => {
    const ids = clientRows.map((r) => r.customerId).filter(Boolean);
    return new Set(ids).size !== ids.length;
  }, [clientRows]);

  const selectedCheckoutCustomerId = useMemo(() => {
    const ids = [...new Set(clientRows.map((r) => r.customerId).filter(Boolean))];
    return ids.length === 1 ? ids[0] : null;
  }, [clientRows]);

  const selectedCheckoutCustomer = useMemo(
    () => customers?.find((c) => c._id === selectedCheckoutCustomerId) || null,
    [customers, selectedCheckoutCustomerId]
  );

  useEffect(() => {
    setCheckoutAiDismissed(false);
  }, [selectedCheckoutCustomerId]);

  // Quantity overflow validation
  const isQtyExceeded = totalClientQty > totalQuantity;

  // Overall form validation state
  const isFormInvalid =
    isQtyExceeded ||
    hasDuplicateClients ||
    totalQuantity <= 0 ||
    clientRows.length === 0;

  // Maps backend orders to OrdersTable format
  const ordersForTable = useMemo(() => {
    return orders.map((o) => {
      const product = o.product;
      const unitPrice = product?.price || 0;

      const clienti = o.clients.map((c) => ({
        ...c.client,
        qty: c.quantity,
        totale: c.quantity * unitPrice,
        puntiOrdine: c.puntiOrdine,
        puntiTotali: c.puntiTotali,
        ordiniTotali: c.ordiniTotali,
      }));

      const totale = clienti.reduce((s, c) => s + (c.totale || 0), 0);

      return {
        _id: o._id,
        prodotto: product?.name,
        "quantità totale": o.totalQuantity,
        data: new Date(o.createdAt).toLocaleDateString("it-IT"),
        stato: o.stato || "In lavorazione",
        corriere: o.corriere || "Bartolini",
        totale: Number(totale.toFixed(2)),
        prodottoDettaglio: product,
        clienti,
      };
    });
  }, [orders]);

  // Creates a new order
  const handleCreateOrder = (e) => {
    e.preventDefault();

    const payload = {
      pointOfSales: selectedPointOfSaleId,
      product: selectedProductId,
      totalQuantity,
      clients: clientRows
        .filter((r) => r.customerId && r.qty !== "")
        .map((r) => ({
          client: r.customerId,
          quantity: Number(r.qty),
        })),
    };

    dispatch(createOrder({ orderData: payload, token })).then(() => {
      dispatch(fetchOrders({ token }));
    });

    setDrawerOpen(false);
    setClientRows([]);
    setSelectedProductId("");
    setSelectedPointOfSaleId("");
    e.target.reset();
  };

  // Opens delete confirmation modal
  const handleDeleteOrder = (order) => {
    setOrderToDelete(order);
  };

  // Deletes an existing order after confirmation
  const confirmDeleteOrder = () => {
    if (!orderToDelete) return;
    dispatch(deleteOrder({ id: orderToDelete._id, token }));
    setOrderToDelete(null);
  };

  return (
    <div className="w-full pb-6 flex flex-col gap-6">
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={t("nuovoOrdine")}
      >
          <form
            onSubmit={handleCreateOrder}
            className="flex flex-col gap-4"
          >
            <select
              required
              className="drawer-input !mb-0"
              value={selectedPointOfSaleId}
              onChange={(e) => setSelectedPointOfSaleId(e.target.value)}
            >
              <option value="">{t("selezionaPuntoVendita")}</option>
              {pointOfSales?.map((pv) => (
                <option key={pv._id} value={pv._id}>
                  {pv.name}
                </option>
              ))}
            </select>

            <select
              required
              className="drawer-input !mb-0"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
            >
              <option value="">{t("selezionaProdotto")}</option>
              {products?.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>

            <input
              type="number"
              min="0"
              required
              placeholder={t("quantitaTotale")}
              className="drawer-input !mb-0"
              onChange={(e) =>
                setTotalQuantity(Number(e.target.value) || 0)
              }
            />

            <div className="flex justify-between items-center mt-2">
              <span className="text-sm font-semibold">
                {t("clientiQuantita")}
              </span>
              <button
                type="button"
                onClick={handleAddClientRow}
                className="custom-button text-[13px]"
              >
                {t("aggiungiCliente")}
              </button>
            </div>

            {clientRows.map((row, i) => (
              <div
                key={i}
                className="grid grid-cols-[minmax(0,1fr)_96px] gap-2"
              >
                <select
                  value={row.customerId}
                  onChange={(e) =>
                    handleClientChange(i, "customerId", e.target.value)
                  }
                  className="drawer-input !mb-0 text-sm"
                >
                  <option value="">{t("selezionaCliente")}</option>
                  {customers?.map((c) => {
                    const used = clientRows.some(
                      (r) =>
                        r.customerId === c._id &&
                        r.customerId !== row.customerId
                    );
                    return (
                      <option key={c._id} value={c._id} disabled={used}>
                        {c.firstName} {c.lastName} ({c.location?.city})
                      </option>
                    );
                  })}
                </select>

                <input
                  type="number"
                  min="0"
                  value={row.qty}
                  onChange={(e) =>
                    handleClientChange(i, "qty", e.target.value)
                  }
                  placeholder={t("quantitaCliente")}
                  className="drawer-input !mb-0 text-sm"
                />
              </div>
            ))}

            {selectedCheckoutCustomerId &&
              !checkoutAiDismissed &&
              selectedCheckoutCustomer && (
                <div className="mt-2">
                  <p className="text-xs font-bold mb-2 opacity-80">
                    {t("customerAiCheckoutTitle")}
                  </p>
                  <CustomerCheckoutAiPanel
                    customer={selectedCheckoutCustomer}
                    customerId={selectedCheckoutCustomerId}
                    token={token}
                    catalogProducts={products || []}
                    onDismiss={() => setCheckoutAiDismissed(true)}
                  />
                </div>
              )}

            <div className="space-y-1">
              {hasDuplicateClients && (
                <p className="text-sm text-red-600 font-semibold">
                  {t("stessoClienteErrore")}
                </p>
              )}
              {isQtyExceeded && (
                <p className="text-sm text-red-600 font-semibold">
                  {t("quantitaClientiErrore")} ({totalClientQty}){" "}
                  {t("superaTotaleOrdine")} ({totalQuantity})
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="custom-button-light px-4 py-2"
              >
                {t("annulla")}
              </button>
              <button
                type="submit"
                disabled={isFormInvalid}
                className="custom-button text-[14px]"
              >
                {t("crea")}
              </button>
            </div>
          </form>
      </Drawer>

      {orderToDelete && (
        <div
          className="app-modal-backdrop fixed inset-0 z-[9999] flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="app-modal-panel w-full max-w-[420px] p-6 text-center">
            <h3 className="mb-3 text-lg font-bold">
              {t("confermaEliminazioneOrdine")}
            </h3>

            <p className="mb-6 text-sm font-semibold opacity-80">
              {t("testoEliminazioneOrdine")}{" "}
              <span className="font-extrabold">
                {orderToDelete.prodotto}
              </span>
              ?
            </p>

            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                className="custom-button-light px-4 py-2"
              >
                {t("annulla")}
              </button>

              <button
                type="button"
                onClick={confirmDeleteOrder}
                className="rounded-xl bg-red-600 px-4 py-2 font-bold text-white shadow-md transition hover:bg-red-700"
              >
                {t("elimina")}
              </button>
            </div>
          </div>
        </div>
      )}

      <OrdersTable
        data={ordersForTable}
        columns={orderColumns}
        columnsLabels={{
          prodotto: t("product"),
          "quantità totale": t("totalQuantity"),
          data: t("date"),
          stato: t("status"),
          corriere: t("courier"),
          totale: t("total"),
        }}
        customToolbar={
          <button
            onClick={() => setDrawerOpen(true)}
            className="custom-button text-[14px]"
          >
            {t("nuovoOrdine")}
          </button>
        }
        actionLabel={t("azioni")}
        actions={[
          {
            name: "delete",
            icon: (
              <TrashIcon
                size={20}
                color={theme === "dark" ? "#ff4d4d" : "#ff0000"}
                weight="duotone"
              />
            ),
            onClick: (row) => handleDeleteOrder(row),
          },
        ]}
      />
    </div>
  );
};

export default OrderPage;
