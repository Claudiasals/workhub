import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import CalendarBox from "../components/CalendarBox";
import Table from "../components/Table";
import Drawer from "../components/Drawer";

import {
  WarehouseIcon,
  ShoppingCartSimpleIcon,
  UserCircleCheckIcon,
  ChalkboardSimpleIcon,
  PackageIcon,
  WarningOctagonIcon,
  CalendarIcon,
  NotePencilIcon,
  TrashIcon,
} from "@phosphor-icons/react";

import {
  fetchEventsAsync,
  createEventAsync,
  updateEventAsync,
  deleteEventAsync,
} from "../store/feature/eventsSlice";
import { fetchProducts } from "../store/feature/productsSlice";
import { fetchItems } from "../store/feature/itemsSlice";
import { fetchOrders } from "../store/feature/orderSlice";

const BoardPage = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Auth and role data
  const { role } = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);

  // Global redux data
  const users = useSelector((state) => state.users);
  const pointOfSales = useSelector((state) => state.pos);
  const products = useSelector((state) => state.products);
  const orders = useSelector((state) => state.orders);
  const items = useSelector((state) => state.items);
  const events = useSelector((state) => state.events.events);

  // Products below stock threshold
  const lowStockProducts =
    items?.list?.filter((item) => item.stock <= item.stockLimit) || [];

  const textColor = theme === "dark" ? "text-white" : "text-[#090c64]";

  // Initial data fetch on mount
  useEffect(() => {
    if (!token) return;

    dispatch(fetchEventsAsync({ token }));
    dispatch(fetchProducts(token));
    dispatch(fetchItems(token));
    dispatch(fetchOrders({ token }));
  }, [dispatch, token]);

  // Board posts mapped for table component
  const boardPosts = events.map((event) => ({
    _id: event._id,
    title: event.title,
    date: event.startDate ? event.startDate.slice(0, 10) : "",
    description: event.description || "",
  }));

  const boardColumns = ["title", "date", "description"];

  const columnLabels = {
    title: t("titolo"),
    date: t("data"),
    description: t("descrizione"),
  };

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  // Open drawer in edit mode
  const openDrawerEdit = (row) => {
    setEditData({
      _id: row._id,
      title: row.title,
      date: row.date,
      description: row.description || "",
    });
    setDrawerOpen(true);
  };

  // Open drawer in create mode
  const openDrawerAdd = () => {
    setEditData({ _id: null, title: "", date: "", description: "" });
    setDrawerOpen(true);
  };

  // Create or update board event
  const handleSavePost = (e) => {
    e.preventDefault();

    const payload = {
      title: editData.title,
      startDate: editData.date,
      endDate: editData.date,
      description: editData.description,
    };

    if (editData._id) {
      dispatch(updateEventAsync({ id: editData._id, data: payload, token }));
    } else {
      dispatch(createEventAsync({ data: payload, token }));
    }

    setDrawerOpen(false);
    setEditData(null);
  };

  // Delete board event
  const handleDelete = (row) => {
    if (window.confirm(`${t("seiSicuroEliminareEvento")} "${row.title}"?`)) {
      dispatch(deleteEventAsync({ id: row._id, token }));
    }
  };

  return (
    <div
      className="w-full h-full flex flex-col gap-8 overflow-y-auto
      [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
    >
      {/* Top statistics */}
      <div className="grid grid-cols-5 gap-4 w-full">
        {[
          {
            icon: WarehouseIcon,
            label: t("depositi"),
            value: pointOfSales?.list?.length ?? 0,
          },
          {
            icon: ShoppingCartSimpleIcon,
            label: t("prodotti"),
            value: products?.list?.length ?? 0,
          },
          {
            icon: PackageIcon,
            label: t("ordiniInUscita"),
            value: orders?.items?.length ?? 0,
          },
          {
            icon: WarningOctagonIcon,
            label: t("articoliSottoSoglia"),
            value: lowStockProducts.length,
          },
          {
            icon: UserCircleCheckIcon,
            label: t("personaleAttivo"),
            value: users?.list?.length ?? 0,
          },
        ].map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className={`flex items-center justify-between rounded-xl px-3 py-2 shadow
            bg-[#fafafa20] dark:bg-[#fafafa10] backdrop-blur-sm
            border border-white/30 dark:border-white/80 ${textColor}`}
          >
            <div className="flex items-center gap-2">
              <Icon
                size={28}
                color={theme === "dark" ? "white" : "#090c64"}
                weight="duotone"
              />
              <span className="font-bold text-[14px]">{label}</span>
            </div>
            <span className="text-sm opacity-70 font-semibold">{value}</span>
          </div>
        ))}
      </div>

      {/* Board and low stock sections */}
      <div className="grid grid-cols-2 gap-6 w-full">
        {/* Board */}
        <div
          className={`flex flex-col gap-4 p-4
          bg-[#fafafa20] dark:bg-[#fafafa10] backdrop-blur-sm
          border border-white/30 dark:border-white/80 rounded-xl shadow-md
          ${textColor}`}
        >
          <div className="flex items-start gap-4">
            <ChalkboardSimpleIcon
              size={28}
              color={theme === "dark" ? "white" : "#090c64"}
              weight="duotone"
            />
            <h3 className="text-[14px] font-bold">{t("bacheca")}</h3>

            <button
              onClick={role === "admin" ? openDrawerAdd : undefined}
              className={`custom-button ml-auto text-[14px] ${
                role === "user" ? "invisible pointer-events-none" : ""
              }`}
            >
              + {t("aggiungi")}
            </button>
          </div>

          <Table
            data={boardPosts}
            columns={boardColumns}
            columnLabels={columnLabels}
            actionLabel="Actions"
            actions={
              role === "admin"
                ? [
                    {
                      name: "edit",
                      icon: (
                        <NotePencilIcon
                          size={28}
                          color={theme === "dark" ? "white" : "#090c64"}
                          weight="duotone"
                          className="mr-4"
                        />
                      ),
                      onClick: openDrawerEdit,
                    },
                    {
                      name: "delete",
                      icon: (
                        <TrashIcon
                          size={28}
                          color="#ff0000"
                          weight="duotone"
                        />
                      ),
                      onClick: handleDelete,
                    },
                  ]
                : []
            }
          />
        </div>

        {/* Low stock products */}
        <div
          className={`flex flex-col gap-4 p-4
          bg-[#fafafa20] dark:bg-[#fafafa10] backdrop-blur-sm
          border border-white/30 dark:border-white/80 rounded-xl shadow-md
          ${textColor}`}
        >
          <div className="flex items-start gap-4">
            <ShoppingCartSimpleIcon
              size={28}
              color={theme === "dark" ? "white" : "#090c64"}
              weight="duotone"
            />
            <h3 className="text-[14px] font-bold">
              {t("prodottiInEsaurimento")}
            </h3>

            <button
              onClick={() => navigate("/warehouse")}
              className="ml-auto custom-button text-[14px]"
            >
              {t("vediTutti")}
            </button>
          </div>

          <Table
            data={lowStockProducts.slice(0, 3).map((item) => ({
              name: item.product.name,
              stock: item.stock,
              pos: item.pointOfSales.name,
            }))}
            columns={["name", "stock", "pos"]}
            columnLabels={{
              name: t("prodotto"),
              stock: t("giacenza"),
              pos: t("pos"),
            }}
          />
        </div>
      </div>

      {/* Calendar section */}
      <div
        className="bg-[#fafafa20] dark:bg-[#fafafa20] backdrop-blur-sm
        border border-white/30 dark:border-white/80
        rounded-xl p-6 shadow-md flex gap-4 min-h-[700px]"
      >
        <CalendarIcon
          size={28}
          color={theme === "dark" ? "white" : "#090c64"}
          weight="duotone"
        />
        <div className="flex-1 flex flex-col">
          <h3 className={`text-[14px] font-bold mb-4 ${textColor}`}>
            {t("calendario")}
          </h3>
          <CalendarBox />
        </div>
      </div>

      {/* Drawer for board events */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={
          editData && editData._id
            ? t("modificaEvento")
            : t("aggiungiEvento")
        }
      >
        {editData && (
          <form onSubmit={handleSavePost} className="flex flex-col gap-4">
            <input
              className="custom-input"
              placeholder={t("titolo")}
              value={editData.title}
              onChange={(e) =>
                setEditData({ ...editData, title: e.target.value })
              }
            />

            <input
              type="date"
              className="custom-input"
              value={editData.date}
              onChange={(e) =>
                setEditData({ ...editData, date: e.target.value })
              }
            />

            <input
              className="custom-input"
              placeholder={t("descrizione")}
              value={editData.description}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  description: e.target.value,
                })
              }
            />

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="custom-button-light"
              >
                {t("annulla")}
              </button>
              <button type="submit" className="custom-button">
                {t("salva")}
              </button>
            </div>
          </form>
        )}
      </Drawer>
    </div>
  );
};

export default BoardPage;
