import { createElement, useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import CalendarBox from "../components/CalendarBox";
import Table from "../components/Table";
import Drawer from "../components/Drawer";
import AppFeedbackModal from "../components/AppFeedbackModal";

import {
  WarehouseIcon,
  ShoppingCartSimpleIcon,
  UserCircleCheckIcon,
  PackageIcon,
  WarningOctagonIcon,
  CalendarIcon,
  MegaphoneIcon,
  PencilSimpleIcon,
  SirenIcon,
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

  // Auth data
  const token = useSelector((state) => state.auth.token);
  const authUser = useSelector((state) => state.auth.user);
  const role = authUser?.role;
  const userWorkplaceId =
    typeof authUser?.workplace === "string"
      ? authUser.workplace
      : authUser?.workplace?._id || authUser?.workplace?.id;
  const canManageBoard = role === "admin";

  // Global redux data
  const users = useSelector((state) => state.users);
  const pointOfSales = useSelector((state) => state.pos);
  const products = useSelector((state) => state.products);
  const orders = useSelector((state) => state.orders);
  const items = useSelector((state) => state.items);
  const events = useSelector((state) => state.events.events);

  // Products below stock threshold, scoped to the logged user's workplace
  const lowStockProducts = useMemo(() => {
    const itemList = items?.list || [];

    return itemList.filter((item) => {
      const itemWorkplaceId =
        typeof item.pointOfSales === "string"
          ? item.pointOfSales
          : item.pointOfSales?._id || item.pointOfSales?.id;

      const matchesWorkplace =
        !userWorkplaceId ||
        String(itemWorkplaceId) === String(userWorkplaceId);

      return matchesWorkplace && item.stock <= item.stockLimit;
    });
  }, [items?.list, userWorkplaceId]);

  const textColor = theme === "dark" ? "text-white" : "text-[#090c64]";

  // Initial data fetch on mount
  useEffect(() => {
    if (!token) return;

    dispatch(fetchEventsAsync({ token }));
    dispatch(fetchProducts(token));
    dispatch(fetchItems());
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
  const [eventToDelete, setEventToDelete] = useState(null);
  const [boardSearchTerm, setBoardSearchTerm] = useState("");

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
    setEventToDelete(row);
  };

  const confirmDeleteEvent = () => {
    if (!eventToDelete) return;
    dispatch(deleteEventAsync({ id: eventToDelete._id, token }));
    setEventToDelete(null);
  };

  return (
    <div
      data-page-scroll
      className="w-full h-full flex flex-col gap-6 overflow-y-auto
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
            className={`app-surface page-info-box flex items-center justify-between ${textColor}`}
          >
            <div className="flex items-center gap-2">
              {createElement(Icon, {
                size: 24,
                color: theme === "dark" ? "white" : "#090c64",
                weight: "duotone",
              })}
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
          className={`app-surface flex flex-col gap-3 p-4 ${textColor}`}
        >
          <div className="dashboard-card-header flex items-center gap-4">
            <MegaphoneIcon
              size={24}
              color={theme === "dark" ? "white" : "#090c64"}
              weight="duotone"
              className="preserve-icon-size shrink-0"
            />
            <h3 className="text-[14px] font-bold">{t("bacheca")}</h3>

            <div className="ml-auto flex items-center gap-2">
              <input
                type="text"
                placeholder={t("cerca")}
                value={boardSearchTerm}
                onChange={(e) => setBoardSearchTerm(e.target.value)}
                className="table-search dashboard-card-search"
              />

              {canManageBoard && (
                <button
                  onClick={openDrawerAdd}
                  className="custom-button text-[14px]"
                >
                  + {t("aggiungi")}
                </button>
              )}
            </div>
          </div>
          <Table
            variant="embedded"
            data={boardPosts}
            columns={boardColumns}
            columnLabels={columnLabels}
            showSort={false}
            showSearch={false}
            searchTerm={boardSearchTerm}
            actionLabel={canManageBoard ? t("azioni") : null}
            actions={
              canManageBoard
                ? [
                    {
                      name: "edit",
                      icon: (
                        <PencilSimpleIcon
                          size={24}
                          color={theme === "dark" ? "white" : "#090c64"}
                          weight="duotone"
                          className="mr-4 preserve-icon-size"
                        />
                      ),
                      onClick: openDrawerEdit,
                    },
                    {
                      name: "delete",
                      icon: (
                        <TrashIcon
                          size={16}
                          color="#ff0000"
                          weight="duotone"
                        />
                      ),
                      onClick: handleDelete,
                    },
                  ]
                : null
            }
          />
        </div>

        {/* Low stock products */}
        <div
          className={`app-surface flex flex-col gap-3 p-4 ${textColor}`}
        >
          <div className="dashboard-card-header flex items-center gap-4">
            <SirenIcon
              size={24}
              color={theme === "dark" ? "white" : "#090c64"}
              weight="duotone"
              className="preserve-icon-size shrink-0"
            />
            <h3 className="text-[14px] font-bold">
              {t("prodottiInEsaurimento")}
            </h3>

            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => navigate("/warehouse")}
                className="custom-button text-[14px]"
              >
                {t("vediTutti")}
              </button>
            </div>
          </div>

          <Table
            variant="embedded"
            data={lowStockProducts.slice(0, 3).map((item) => ({
              name: item.product.name,
              stock: item.stock,
              pos: item.pointOfSales.name,
            }))}
            columns={["name", "stock", "pos"]}
            showSort={false}
            showSearch={false}
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
        className="app-surface dashboard-calendar-card p-6 flex flex-col gap-4 min-h-[700px]"
      >
        <div className="flex items-center gap-4">
          <CalendarIcon
            size={24}
            color={theme === "dark" ? "white" : "#090c64"}
            weight="duotone"
            className="preserve-icon-size shrink-0"
          />
          <h3 className={`text-[14px] font-bold ${textColor}`}>
            {t("calendario")}
          </h3>
        </div>

        <CalendarBox />
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

      <AppFeedbackModal
        open={Boolean(eventToDelete)}
        title={t("modaleAttenzione")}
        message={
          eventToDelete
            ? `${t("seiSicuroEliminareEvento")} "${eventToDelete.title}"?`
            : ""
        }
        tone="warning"
        onClose={() => setEventToDelete(null)}
        actions={[
          {
            label: t("annulla"),
            onClick: () => setEventToDelete(null),
            className: "custom-button-light",
          },
          {
            label: t("elimina"),
            onClick: confirmDeleteEvent,
            className:
              "rounded-xl bg-red-600 px-4 py-2 font-bold text-white shadow-md transition hover:bg-red-700",
          },
        ]}
      />
    </div>
  );
};

export default BoardPage;
