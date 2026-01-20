import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { TrashIcon } from "@phosphor-icons/react";

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

  // New order form state
  const [clientRows, setClientRows] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedPointOfSaleId, setSelectedPointOfSaleId] = useState("");
  const [totalQuantity, setTotalQuantity] = useState(0);

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

  // Deletes an existing order
  const handleDeleteOrder = (id) => {
    dispatch(deleteOrder({ id, token }));
  };

  return (
    <div className="w-full px-6 pb-6 flex flex-col gap-6">
      {drawerOpen && (
        <div className="p-6 flex flex-col gap-4 rounded-xl border border-white/30 shadow-md backdrop-blur-sm bg-white/20">
          <h3 className="text-lg font-bold text-[#090c64]">
            {t("nuovoOrdine")}
          </h3>

          <form
            onSubmit={handleCreateOrder}
            className="grid grid-cols-2 gap-4"
          >
            <select
              required
              className="p-2 border rounded-xl"
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
              className="p-2 border rounded-xl"
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
              className="p-2 border rounded-xl"
              onChange={(e) =>
                setTotalQuantity(Number(e.target.value) || 0)
              }
            />

            <div className="col-span-2 flex justify-between items-center mt-2">
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
              <div key={i} className="col-span-2 grid grid-cols-2 gap-2">
                <select
                  value={row.customerId}
                  onChange={(e) =>
                    handleClientChange(i, "customerId", e.target.value)
                  }
                  className="p-2 border rounded text-sm"
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
                  className="p-2 border rounded text-sm"
                />
              </div>
            ))}

            <div className="col-span-2 space-y-1">
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

            <div className="col-span-2 flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="px-4 py-2 border rounded-xl"
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
            onClick={() => setDrawerOpen((v) => !v)}
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
                size={28}
                color={theme === "dark" ? "#ff4d4d" : "#ff0000"}
                weight="duotone"
              />
            ),
            onClick: (row) => handleDeleteOrder(row._id),
          },
        ]}
      />
    </div>
  );
};

export default OrderPage;
